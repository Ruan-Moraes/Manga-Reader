package com.toonlira.translationgateway.infrastructure.layout;

import com.toonlira.translationgateway.application.port.BubbleDetectionPort;
import com.toonlira.translationgateway.application.port.LayoutPort;
import com.toonlira.translationgateway.domain.OcrManifest;
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

    public LocalLayoutAdapter(BubbleDetectionPort bubbles, ReadingDirection direction, Duration budget) {
        if (direction == null || budget.isNegative() || budget.isZero() || budget.compareTo(Duration.ofSeconds(30)) > 0)
            throw new IllegalArgumentException("Invalid layout configuration");
        this.bubbles = bubbles;
        this.direction = direction;
        this.budget = budget;
    }

    @Override public boolean available() { return true; }

    @Override
    public LayoutManifest analyze(Path validatedImage, OcrManifest ocr, String imageHash, String ocrHash) {
        if (!capacity.tryAcquire()) throw new LayoutFailure(LayoutFailure.Code.UNAVAILABLE);
        long deadline = System.nanoTime() + budget.toNanos();
        try {
            var image = ImageIO.read(validatedImage.toFile());
            if (image == null || image.getWidth() != ocr.widthPx() || image.getHeight() != ocr.heightPx())
                throw new LayoutFailure(LayoutFailure.Code.INVALID_RESPONSE);
            PixelImage pixels = new PixelImage() {
                public int width() { return image.getWidth(); }
                public int height() { return image.getHeight(); }
                public int rgb(int x, int y) { return image.getRGB(x, y); }
            };
            var panels = new RegularPanelDetector().detect(pixels, direction, () -> System.nanoTime() >= deadline);
            var detected = bubbles.detect(pixels, Duration.ofNanos(deadline - System.nanoTime()));
            var layout = new LayoutInterpreter().interpret(ocr, imageHash, ocrHash, ComicDetectorModel.METADATA,
                direction, panels, detected);
            if (System.nanoTime() >= deadline) throw new LayoutFailure(LayoutFailure.Code.TIMEOUT);
            return layout;
        } catch (IOException error) { throw new LayoutFailure(LayoutFailure.Code.UNAVAILABLE); }
        finally {
            // Native detect is synchronous. Never release the slot on Future.cancel while JNI is still running.
            capacity.release();
        }
    }

    @Override public void close() {
        capacity.acquireUninterruptibly();
        try { if (bubbles instanceof AutoCloseable closeable) closeable.close(); }
        catch (Exception ignored) { }
        finally { capacity.release(); }
    }
}
