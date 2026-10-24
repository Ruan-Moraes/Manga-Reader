import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.Rectangle;
import java.awt.RenderingHints;
import java.awt.font.GlyphVector;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.Base64;
import java.util.Locale;

/** Local JDK-only glyph renderer. Font bytes arrive on stdin; no fallback or network. */
public class CalibrationGlyphRenderer {
    private static final String TEXT = "春夏秋冬山川草木日月星空東西南北";
    private static final int FONT_SIZE = 84;
    private static final int CELL_SIZE = 112;
    private static final int MAX_FONT_BYTES = 32 * 1024 * 1024;

    public static void main(String[] args) {
        try {
            if (args.length != 1) throw new IllegalArgumentException();
            int face = Integer.parseInt(args[0]);
            byte[] bytes = System.in.readNBytes(MAX_FONT_BYTES + 1);
            if (bytes.length > MAX_FONT_BYTES || face < 0 || face >= 64) throw new IllegalArgumentException();
            Font[] fonts = Font.createFonts(new ByteArrayInputStream(bytes));
            if (face >= fonts.length) throw new IllegalArgumentException();
            Font font = fonts[face].deriveFont((float) FONT_SIZE);
            StringBuilder output = new StringBuilder("{\"java\":").append(quote(System.getProperty("java.runtime.version")))
                    .append(",\"family\":").append(quote(font.getFamily(Locale.ROOT)))
                    .append(",\"style\":").append(quote(font.getFontName(Locale.ROOT)))
                    .append(",\"glyphs\":[");
            boolean first = true;
            for (int point : TEXT.codePoints().toArray()) {
                if (!font.canDisplay(point)) throw new IllegalArgumentException();
                BufferedImage scratch = new BufferedImage(CELL_SIZE, CELL_SIZE, BufferedImage.TYPE_INT_RGB);
                Graphics2D graphics = scratch.createGraphics();
                try {
                    graphics.setColor(Color.WHITE);
                    graphics.fillRect(0, 0, CELL_SIZE, CELL_SIZE);
                    graphics.setColor(Color.BLACK);
                    graphics.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
                    graphics.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_OFF);
                    GlyphVector vector = font.createGlyphVector(graphics.getFontRenderContext(), new String(Character.toChars(point)));
                    if (vector.getNumGlyphs() != 1 || vector.getGlyphCode(0) == font.getMissingGlyphCode()) throw new IllegalArgumentException();
                    Rectangle bounds = vector.getPixelBounds(graphics.getFontRenderContext(), 0, 0);
                    if (bounds.width <= 0 || bounds.height <= 0 || bounds.width >= CELL_SIZE - 2 || bounds.height >= CELL_SIZE - 2) throw new IllegalArgumentException();
                    graphics.drawGlyphVector(vector, 1 - bounds.x, 1 - bounds.y);
                    int left = CELL_SIZE, top = CELL_SIZE, right = -1, bottom = -1;
                    for (int y = 0; y < CELL_SIZE; y++) for (int x = 0; x < CELL_SIZE; x++) {
                        if ((scratch.getRGB(x, y) & 0xffffff) != 0xffffff) {
                            left = Math.min(left, x); top = Math.min(top, y);
                            right = Math.max(right, x); bottom = Math.max(bottom, y);
                        }
                    }
                    if (left <= 0 || top <= 0 || right >= CELL_SIZE - 1 || bottom >= CELL_SIZE - 1 || right < left) throw new IllegalArgumentException();
                    int width = right - left + 1, height = bottom - top + 1;
                    byte[] mask = new byte[width * height];
                    for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
                        int pixel = scratch.getRGB(left + x, top + y);
                        int red = (pixel >> 16) & 255, green = (pixel >> 8) & 255, blue = pixel & 255;
                        if (red != green || green != blue) throw new IllegalArgumentException();
                        mask[y * width + x] = (byte) (255 - red);
                    }
                    if (!first) output.append(',');
                    first = false;
                    output.append("{\"codePoint\":").append(point).append(",\"glyphId\":").append(vector.getGlyphCode(0))
                            .append(",\"width\":").append(width).append(",\"height\":").append(height)
                            .append(",\"mask\":").append(quote(Base64.getEncoder().encodeToString(mask))).append('}');
                } finally {
                    graphics.dispose();
                }
            }
            System.out.println(output.append("]}"));
        } catch (Exception failure) {
            System.err.println("calibration-font-render-failed");
            System.exit(1);
        }
    }

    private static String quote(String value) {
        StringBuilder escaped = new StringBuilder("\"");
        for (char character : value.toCharArray()) {
            if (character == '"' || character == '\\') escaped.append('\\').append(character);
            else if (character < 32) escaped.append(String.format(Locale.ROOT, "\\u%04x", (int) character));
            else escaped.append(character);
        }
        return escaped.append('"').toString();
    }
}
