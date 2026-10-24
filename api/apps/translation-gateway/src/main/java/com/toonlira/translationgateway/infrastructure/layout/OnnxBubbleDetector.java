package com.toonlira.translationgateway.infrastructure.layout;

import ai.onnxruntime.NodeInfo;
import ai.onnxruntime.OnnxJavaType;
import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtLoggingLevel;
import ai.onnxruntime.OrtSession;
import ai.onnxruntime.TensorInfo;
import com.toonlira.translationgateway.application.port.BubbleDetectionPort;
import com.toonlira.translationgateway.domain.layout.Bubble;
import com.toonlira.translationgateway.domain.layout.LayoutBox;
import com.toonlira.translationgateway.domain.layout.LayoutFailure;
import com.toonlira.translationgateway.domain.layout.PixelImage;

import java.nio.FloatBuffer;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import static com.toonlira.translationgateway.domain.layout.LayoutParameters.CONFIDENCE;
import static com.toonlira.translationgateway.domain.layout.LayoutParameters.MAX_BUBBLES;
import static com.toonlira.translationgateway.infrastructure.layout.ComicDetectorModel.INPUT_SIZE;

public final class OnnxBubbleDetector implements BubbleDetectionPort, AutoCloseable {
    private final OrtEnvironment environment;
    private final OrtSession session;
    private final ScheduledExecutorService timer = Executors.newSingleThreadScheduledExecutor(runnable -> {
        var thread = new Thread(runnable, "layout-cancellation");
        thread.setDaemon(true);
        return thread;
    });

    public OnnxBubbleDetector(Path model) {
        ComicDetectorModel.verify(model); // Before native library initialization.
        OrtSession created = null;
        try {
            environment = OrtEnvironment.getEnvironment(OrtLoggingLevel.ORT_LOGGING_LEVEL_FATAL);
            try (var options = new OrtSession.SessionOptions()) {
                options.setIntraOpNumThreads(2);
                options.setInterOpNumThreads(1);
                options.setSessionLogLevel(OrtLoggingLevel.ORT_LOGGING_LEVEL_FATAL);
                created = environment.createSession(model.toString(), options);
                validateContract(created.getInputInfo(), created.getOutputInfo());
            }
            session = created;
        } catch (OrtException | RuntimeException | LinkageError error) {
            if (created != null) try { created.close(); } catch (OrtException ignored) { }
            timer.shutdownNow();
            throw new IllegalStateException("Layout native model initialization unavailable");
        }
    }

    static void validateContract(Map<String, NodeInfo> inputs, Map<String, NodeInfo> outputs) {
        if (!inputs.keySet().equals(Set.of("images", "orig_target_sizes"))
            || !outputs.keySet().equals(Set.of("labels", "boxes", "scores"))) throw invalid();
        tensor(inputs.get("images"), OnnxJavaType.FLOAT, -1, 3, -1, -1);
        tensor(inputs.get("orig_target_sizes"), OnnxJavaType.INT64, -1, 2);
        tensor(outputs.get("labels"), OnnxJavaType.INT64, -1, -1);
        tensor(outputs.get("boxes"), OnnxJavaType.FLOAT, -1, -1, -1);
        tensor(outputs.get("scores"), OnnxJavaType.FLOAT, -1, -1);
    }

    private static void tensor(NodeInfo node, OnnxJavaType type, long... shape) {
        if (!(node.getInfo() instanceof TensorInfo info) || info.type != type || !Arrays.equals(info.getShape(), shape))
            throw invalid();
    }

    @Override
    public List<Bubble> detect(PixelImage image, Duration remaining) {
        if (remaining.isNegative() || remaining.isZero()) throw new LayoutFailure(LayoutFailure.Code.TIMEOUT);
        long deadline = System.nanoTime() + remaining.toNanos();
        var timedOut = new AtomicBoolean();
        try (var options = new OrtSession.RunOptions()) {
            options.setLogLevel(OrtLoggingLevel.ORT_LOGGING_LEVEL_FATAL);
            var active = new AtomicBoolean(true);
            var cancellation = timer.schedule(() -> {
                synchronized (active) {
                    if (active.get()) {
                        timedOut.set(true);
                        try { options.setTerminate(true); } catch (OrtException ignored) { }
                    }
                }
            }, remaining.toNanos(), TimeUnit.NANOSECONDS);
            try (var pixels = OnnxTensor.createTensor(environment, FloatBuffer.wrap(resize(image)), new long[]{1, 3, INPUT_SIZE, INPUT_SIZE});
                 var sizes = OnnxTensor.createTensor(environment, targetSizes(image));
                 var output = session.run(Map.of("images", pixels, "orig_target_sizes", sizes), options)) {
                if (timedOut.get() || System.nanoTime() >= deadline) throw new LayoutFailure(LayoutFailure.Code.TIMEOUT);
                var labels = (long[][]) output.get("labels").orElseThrow().getValue();
                var boxes = (float[][][]) output.get("boxes").orElseThrow().getValue();
                var scores = (float[][]) output.get("scores").orElseThrow().getValue();
                return decode(labels, boxes, scores, image.width(), image.height());
            } finally {
                synchronized (active) { active.set(false); cancellation.cancel(false); }
            }
        } catch (LayoutFailure error) { throw error; }
        catch (OrtException | RuntimeException error) {
            throw new LayoutFailure(timedOut.get() ? LayoutFailure.Code.TIMEOUT : LayoutFailure.Code.UNAVAILABLE);
        }
    }

    static List<Bubble> decode(long[][] labels, float[][][] boxes, float[][] scores, int width, int height) {
        if (labels.length != 1 || boxes.length != 1 || scores.length != 1 || labels[0].length != boxes[0].length
            || labels[0].length != scores[0].length || labels[0].length > 10000) throw invalid();
        var result = new ArrayList<Bubble>();
        for (int i = 0; i < labels[0].length; i++) {
            float score = scores[0][i];
            if (labels[0][i] < 0 || labels[0][i] > 2 || !Float.isFinite(score) || score < 0 || score > 1
                || boxes[0][i].length != 4) throw invalid();
            for (float coordinate : boxes[0][i]) if (!Float.isFinite(coordinate)) throw invalid();
            if (score < CONFIDENCE || labels[0][i] != 0) continue;
            var b = boxes[0][i];
            try {
                result.add(new Bubble("bubble-" + i, new LayoutBox(b[0] / width, b[1] / height, b[2] / width, b[3] / height), score));
            } catch (IllegalArgumentException error) { throw invalid(); }
            if (result.size() > MAX_BUBBLES) throw new LayoutFailure(LayoutFailure.Code.LIMIT_EXCEEDED);
        }
        return List.copyOf(result);
    }

    static long[][] targetSizes(PixelImage image) {
        // This ONNX export repeats [width,height] to scale xyxy. Unlike the HF processor API,
        // it does not unbind target_sizes as (height,width); see RTDETRPostProcessor.forward.
        return new long[][]{{image.width(), image.height()}};
    }

    /** Half-pixel bilinear RGB resize, planar channels scaled to [0,1], no normalization/padding. */
    static float[] resize(PixelImage image) {
        float[] result = new float[3 * INPUT_SIZE * INPUT_SIZE];
        for (int y = 0; y < INPUT_SIZE; y++) {
            double sourceY = Math.max(0, (y + .5) * image.height() / INPUT_SIZE - .5);
            int y0 = (int) sourceY, y1 = Math.min(image.height() - 1, y0 + 1);
            double fy = sourceY - y0;
            for (int x = 0; x < INPUT_SIZE; x++) {
                double sourceX = Math.max(0, (x + .5) * image.width() / INPUT_SIZE - .5);
                int x0 = (int) sourceX, x1 = Math.min(image.width() - 1, x0 + 1);
                double fx = sourceX - x0;
                int a = image.rgb(x0, y0), b = image.rgb(x1, y0), c = image.rgb(x0, y1), d = image.rgb(x1, y1);
                for (int channel = 0; channel < 3; channel++) {
                    int shift = (2 - channel) * 8;
                    double top = ((a >> shift) & 255) * (1 - fx) + ((b >> shift) & 255) * fx;
                    double bottom = ((c >> shift) & 255) * (1 - fx) + ((d >> shift) & 255) * fx;
                    result[channel * INPUT_SIZE * INPUT_SIZE + y * INPUT_SIZE + x] = (float) ((top * (1 - fy) + bottom * fy) / 255);
                }
            }
        }
        return result;
    }

    private static LayoutFailure invalid() { return new LayoutFailure(LayoutFailure.Code.INVALID_RESPONSE); }

    @Override
    public void close() {
        timer.shutdownNow();
        try { session.close(); } catch (OrtException ignored) { }
    }
}
