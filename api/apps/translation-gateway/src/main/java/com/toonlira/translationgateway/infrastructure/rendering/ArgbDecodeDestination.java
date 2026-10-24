package com.toonlira.translationgateway.infrastructure.rendering;

import java.awt.Point;
import java.awt.image.BufferedImage;
import java.awt.image.ColorModel;
import java.awt.image.DataBuffer;
import java.awt.image.DataBufferInt;
import java.awt.image.Raster;
import java.awt.image.SinglePixelPackedSampleModel;
import java.awt.image.WritableRaster;
import javax.imageio.ImageTypeSpecifier;

/**
 * The JDK readers write scanlines/pixels in their source color model. Convert those writes into
 * one ARGB buffer using a one-pixel source raster, rather than allocating a second full page.
 * Only used with the explicitly selected JDK PNG/JPEG readers, not arbitrary ImageIO plugins.
 */
final class ArgbDecodeDestination {
    private static final int[] ARGB_MASKS = {0x00ff0000, 0x0000ff00, 0x000000ff, 0xff000000};
    private final DecodeRaster raster;
    private final BufferedImage destination;

    ArgbDecodeDestination(ImageTypeSpecifier sourceType, int width, int height) {
        this(sourceType, width, height, new DataBufferInt(Math.multiplyExact(width, height)));
    }

    ArgbDecodeDestination(ImageTypeSpecifier sourceType, int width, int height, DataBuffer data) {
        if (data == null || data.getDataType() != DataBuffer.TYPE_INT || data.getNumBanks() != 1
            || data.getOffset() != 0 || data.getSize() != Math.multiplyExact(width, height))
            throw new RenderFileException(RenderFileException.Failure.INVALID_MEDIA);
        raster = new DecodeRaster(sourceType, width, height, data);
        destination = new BufferedImage(new DecodeColorModel(sourceType.getColorModel()), raster, false, null);
    }

    BufferedImage destination() { return destination; }
    BufferedImage argbView() {
        var view = Raster.createPackedRaster(raster.getDataBuffer(), raster.getWidth(), raster.getHeight(),
            raster.getWidth(), ARGB_MASKS, new Point(0, 0));
        return new BufferedImage(ColorModel.getRGBdefault(), view, false, null);
    }

    private static final class DecodeRaster extends WritableRaster {
        private final BufferedImage pixel;
        private final DataBuffer output;
        private final int[] one;

        DecodeRaster(ImageTypeSpecifier type, int width, int height, DataBuffer data) {
            super(new DecodeSampleModel(width, height, type.getSampleModel().getSampleSize()),
                data, new Point(0, 0));
            pixel = type.createBufferedImage(1, 1);
            output = data;
            one = new int[getNumBands()];
        }

        @Override public void setPixel(int x, int y, int[] samples) {
            ValidatedRasterDecoder.checkInterrupted();
            pixel.getRaster().setPixel(0, 0, samples);
            output.setElem(Math.addExact(Math.multiplyExact(y, width), x), pixel.getRGB(0, 0));
        }

        @Override public void setPixels(int x, int y, int w, int h, int[] samples) {
            int bands = getNumBands();
            int offset = 0;
            for (int row = y; row < y + h; row++) for (int column = x; column < x + w; column++) {
                System.arraycopy(samples, offset, one, 0, bands);
                setPixel(column, row, one);
                offset += bands;
            }
        }

        @Override public void setRect(Raster source) { setRect(0, 0, source); }
        @Override public void setRect(int dx, int dy, Raster source) {
            // JDK JPEG supplies a single scanline; PNG uses setPixel for this non-byte-interleaved raster.
            int[] line = null;
            for (int y = source.getMinY(); y < source.getMinY() + source.getHeight(); y++) {
                line = source.getPixels(source.getMinX(), y, source.getWidth(), 1, line);
                setPixels(dx + source.getMinX(), dy + y, source.getWidth(), 1, line);
            }
        }
    }

    private static final class DecodeSampleModel extends SinglePixelPackedSampleModel {
        private final int[] sourceSizes;
        DecodeSampleModel(int width, int height, int[] sourceSizes) {
            super(DataBuffer.TYPE_INT, width, height, masks(sourceSizes.length));
            this.sourceSizes = sourceSizes.clone();
        }
        @Override public int[] getSampleSize() { return sourceSizes.clone(); }
        @Override public int getSampleSize(int band) { return sourceSizes[band]; }
        private static int[] masks(int count) {
            var masks = new int[count];
            // Band samples are converted by DecodeRaster, never stored using these packed masks.
            for (int band = 0; band < count; band++) masks[band] = 0xff;
            return masks;
        }
    }

    private static final class DecodeColorModel extends ColorModel {
        DecodeColorModel(ColorModel source) {
            super(32, source.getComponentSize(), source.getColorSpace(), source.hasAlpha(), false,
                source.getTransparency(), DataBuffer.TYPE_INT);
        }
        @Override public int getRed(int pixel) { return pixel >>> 16 & 255; }
        @Override public int getGreen(int pixel) { return pixel >>> 8 & 255; }
        @Override public int getBlue(int pixel) { return pixel & 255; }
        @Override public int getAlpha(int pixel) { return pixel >>> 24; }
        @Override public int getRGB(int pixel) { return pixel; }
        @Override public boolean isCompatibleRaster(Raster raster) { return raster instanceof DecodeRaster; }
    }
}
