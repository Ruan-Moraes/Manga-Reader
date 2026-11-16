package com.toonlira.translationgateway.infrastructure.layout;

import com.toonlira.translationgateway.infrastructure.rendering.PageRasterReader;

import com.toonlira.translationgateway.application.port.BubbleDetectionPort;
import com.toonlira.translationgateway.application.port.LayoutPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.layout.Detections;
import com.toonlira.translationgateway.domain.layout.LayoutFailure;
import com.toonlira.translationgateway.domain.layout.LayoutInterpreter;
import com.toonlira.translationgateway.domain.layout.LayoutManifest;
import com.toonlira.translationgateway.domain.layout.PixelImage;
import com.toonlira.translationgateway.domain.layout.ReadingDirection;
import com.toonlira.translationgateway.domain.layout.RegularPanelDetector;

import javax.imageio.ImageIO;
import java.io.IOException;
import java.nio.file.Path;
import java.time.Duration;
import java.util.concurrent.Semaphore;

public final class LocalLayoutAdapter implements LayoutPort, AutoCloseable {
    private final BubbleDetectionPort bubbles;
    private final ReadingDirection direction;
    private final Duration budget;
    private final Semaphore capacity = new Semaphore(1);
    /**
     * How long a page waits for the detector while another page uses it. Failing at once made concurrent pages lose
     * balloon grouping silently (balloons split into lines translated apart).
     */
    static final Duration CAPACITY_WAIT = Duration.ofSeconds(60);
    private final boolean grouping;
    private final Duration capacityWait;

    private final PageRasterReader pages;

    public LocalLayoutAdapter(BubbleDetectionPort bubbles, ReadingDirection direction, Duration budget) {
        this(bubbles, direction, budget, false);
    }

    public LocalLayoutAdapter(BubbleDetectionPort bubbles, ReadingDirection direction, Duration budget, boolean grouping) {
        this(bubbles, direction, budget, grouping, CAPACITY_WAIT);
    }

    LocalLayoutAdapter(BubbleDetectionPort bubbles, ReadingDirection direction, Duration budget, boolean grouping, Duration capacityWait) {
        this(bubbles, direction, budget, grouping, capacityWait, PageRasterReader.jdkOnly());
    }

    /** {@code pages}: reads the validated page, WebP included when a pinned decoder is configured. */
    public LocalLayoutAdapter(BubbleDetectionPort bubbles, ReadingDirection direction, Duration budget, boolean grouping,
                              PageRasterReader pages) {
        this(bubbles, direction, budget, grouping, CAPACITY_WAIT, pages);
    }

    LocalLayoutAdapter(BubbleDetectionPort bubbles, ReadingDirection direction, Duration budget, boolean grouping,
                       Duration capacityWait, PageRasterReader pages) {
        if (pages == null) throw new IllegalArgumentException("Invalid layout configuration");
        this.pages = pages;
        if (direction == null || budget.isNegative() || budget.isZero() || budget.compareTo(Duration.ofSeconds(30)) > 0)
            throw new IllegalArgumentException("Invalid layout configuration");
        this.bubbles = bubbles;
        this.direction = direction;
        this.budget = budget;
        this.grouping = grouping;
        this.capacityWait = capacityWait;
    }

    @Override public boolean available() { return true; }
    @Override public boolean groups() { return grouping; }

    @Override
    public Detections detect(Path validatedImage) {
        acquire();
        long deadline = System.nanoTime() + budget.toNanos();
        try {
            var detected = bubbles.detectAll(pixels(validatedImage, -1, -1), Duration.ofNanos(deadline - System.nanoTime()));
            if (System.nanoTime() >= deadline) throw new LayoutFailure(LayoutFailure.Code.TIMEOUT);
            return detected;
        } catch (IOException error) { throw new LayoutFailure(LayoutFailure.Code.UNAVAILABLE); }
        finally { capacity.release(); }
    }

    @Override
    public LayoutManifest analyze(Path validatedImage, OcrManifest ocr, String imageHash, String ocrHash) {
        return analyze(validatedImage, ocr, imageHash, ocrHash, null);
    }

    @Override
    public LayoutManifest analyze(Path validatedImage, OcrManifest ocr, String imageHash, String ocrHash, Detections reused) {
        acquire();
        long deadline = System.nanoTime() + budget.toNanos();
        try {
            var pixels = pixels(validatedImage, ocr.widthPx(), ocr.heightPx());
            var panels = new RegularPanelDetector().detect(pixels, direction, () -> System.nanoTime() >= deadline);
            var detected = reused != null ? reused : bubbles.detectAll(pixels, Duration.ofNanos(deadline - System.nanoTime()));
            var layout = new LayoutInterpreter().interpret(ocr, imageHash, ocrHash, ComicDetectorModel.METADATA,
                direction, panels, detected.bubbles(), detected.texts());
            if (System.nanoTime() >= deadline) throw new LayoutFailure(LayoutFailure.Code.TIMEOUT);
            return layout;
        } catch (IOException error) { throw new LayoutFailure(LayoutFailure.Code.UNAVAILABLE); }
        finally {
            // Native detect is synchronous. Never release the slot on Future.cancel while JNI is still running.
            capacity.release();
        }
    }

    private void acquire() {
        try {
            if (!capacity.tryAcquire(capacityWait.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS))
                throw new LayoutFailure(LayoutFailure.Code.UNAVAILABLE);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new LayoutFailure(LayoutFailure.Code.UNAVAILABLE);
        }
    }

    private PixelImage pixels(Path validatedImage, int width, int height) throws IOException {
        // A WebP page used to read as null here (no JDK reader) and every WebP page lost its balloons.
        var image = pages.read(validatedImage);
        if (image == null || width >= 0 && (image.getWidth() != width || image.getHeight() != height))
            throw new LayoutFailure(LayoutFailure.Code.INVALID_RESPONSE);
        return new PixelImage() {
            public int width() { return image.getWidth(); }
            public int height() { return image.getHeight(); }
            public int rgb(int x, int y) { return image.getRGB(x, y); }
        };
    }

    @Override public void close() {
        capacity.acquireUninterruptibly();
        try { if (bubbles instanceof AutoCloseable closeable) closeable.close(); }
        catch (Exception ignored) { }
        finally { capacity.release(); }
    }
}
