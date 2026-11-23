package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.SeekableByteChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

/** Bounded PT_INTERP inspection of the running Java executable; no loader, subprocess or FFM in the parent. */
final class NativeRuntimeElf {
    private static final int HEADER_BYTES = 64, PROGRAM_HEADER_BYTES = 56;
    private static final int MAX_PROGRAM_HEADERS = 128, MAX_INTERPRETER_BYTES = 256;
    private static final int INTERPRETER = 3, EXECUTABLE = 2, POSITION_INDEPENDENT = 3;

    private NativeRuntimeElf() { }

    static String interpreter(Path executable, int machine) {
        // The runtime caller supplies only /proc/self/exe. Follow this kernel-owned symlink, not task/config input.
        try (var channel = Files.newByteChannel(executable, StandardOpenOption.READ)) {
            var header = read(channel, 0, HEADER_BYTES);
            require(header.getInt(0) == 0x464c457f && header.get(4) == 2 && header.get(5) == 1 && header.get(6) == 1
                && (header.getShort(16) == EXECUTABLE || header.getShort(16) == POSITION_INDEPENDENT)
                && header.getShort(18) == machine && header.getInt(20) == 1
                && header.getShort(52) == HEADER_BYTES && header.getShort(54) == PROGRAM_HEADER_BYTES);
            int count = Short.toUnsignedInt(header.getShort(56));
            require(count > 0 && count <= MAX_PROGRAM_HEADERS);
            var programs = read(channel, header.getLong(32), count * PROGRAM_HEADER_BYTES);
            String interpreter = null;
            for (int i = 0; i < count; i++) {
                int entry = i * PROGRAM_HEADER_BYTES;
                if (programs.getInt(entry) != INTERPRETER) continue;
                require(interpreter == null);
                long length = programs.getLong(entry + 32);
                require(length > 1 && length <= MAX_INTERPRETER_BYTES);
                var bytes = read(channel, programs.getLong(entry + 8), Math.toIntExact(length)).array();
                require(bytes[bytes.length - 1] == 0);
                for (int j = 0; j < bytes.length - 1; j++) require(bytes[j] >= 32 && bytes[j] <= 126);
                interpreter = new String(bytes, 0, bytes.length - 1, StandardCharsets.US_ASCII);
            }
            require(interpreter != null); return interpreter;
        } catch (Exception error) { throw new RenderFileException(CONFIGURATION); }
    }

    private static ByteBuffer read(SeekableByteChannel channel, long offset, int length) throws Exception {
        long size = channel.size();
        require(offset >= 0 && length > 0 && offset <= size && length <= size - offset);
        var buffer = ByteBuffer.allocate(length).order(ByteOrder.LITTLE_ENDIAN);
        channel.position(offset);
        while (buffer.hasRemaining()) require(channel.read(buffer) > 0);
        buffer.flip(); return buffer;
    }

    private static void require(boolean condition) { if (!condition) throw new RenderFileException(CONFIGURATION); }
}
