package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;

/** Narrow ELF64 little-endian metadata admission bound to the declared target; not an ELF loader. */
final class NativeCodecElf {
    private static final int ELF_HEADER_BYTES = 64;
    private static final int PROGRAM_HEADER_BYTES = 56;
    private static final int MAX_PROGRAM_HEADERS = 128;
    private static final int MAX_DYNAMIC_ENTRIES = 1024;
    private static final int MAX_STRING_BYTES = 65536;
    private static final long LOAD = 1, DYNAMIC = 2, NEEDED = 1, STRING_TABLE = 5, STRING_SIZE = 10;
    private static final long SONAME = 14, RPATH = 15, TEXTREL = 22, RUNPATH = 29;

    private NativeCodecElf() { }

    static void verify(byte[] bytes, String soname, Set<String> dependencies) {
        verify(bytes, soname, dependencies, NativeCodecPlatform.ARM64);
    }

    static void verify(byte[] bytes, String soname, Set<String> dependencies, NativeCodecPlatform platform) {
        try { inspect(bytes, soname, dependencies, platform); }
        catch (RuntimeException failure) { throw new RenderFileException(CONFIGURATION); }
    }

    private static void inspect(byte[] bytes, String soname, Set<String> dependencies, NativeCodecPlatform platform) {
        require(platform != null && bytes != null && bytes.length >= ELF_HEADER_BYTES);
        var buffer = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
        require(buffer.getInt(0) == 0x464c457f && bytes[4] == 2 && bytes[5] == 1 && bytes[6] == 1
            && buffer.getShort(16) == 3 && buffer.getShort(18) == platform.machine() && buffer.getInt(20) == 1
            && buffer.getShort(52) == ELF_HEADER_BYTES && buffer.getShort(54) == PROGRAM_HEADER_BYTES);
        int count = Short.toUnsignedInt(buffer.getShort(56));
        require(count > 0 && count <= MAX_PROGRAM_HEADERS);
        int headers = range(buffer.getLong(32), (long) count * PROGRAM_HEADER_BYTES, bytes.length);
        var loads = new ArrayList<long[]>(); long dynamicOffset = -1, dynamicSize = 0;
        for (int i = 0; i < count; i++) {
            int entry = headers + i * PROGRAM_HEADER_BYTES;
            long type = Integer.toUnsignedLong(buffer.getInt(entry));
            long offset = buffer.getLong(entry + 8), address = buffer.getLong(entry + 16), size = buffer.getLong(entry + 32);
            range(offset, size, bytes.length);
            if (type == LOAD) { require(address >= 0); loads.add(new long[]{offset, address, size}); }
            if (type == DYNAMIC) { require(dynamicOffset == -1); dynamicOffset = offset; dynamicSize = size; }
        }
        require(dynamicOffset >= 0 && dynamicSize >= 16 && dynamicSize % 16 == 0
            && dynamicSize / 16 <= MAX_DYNAMIC_ENTRIES);
        var tags = new HashMap<Long, Long>(); var needed = new ArrayList<Long>(); boolean terminated = false;
        for (int i = 0; i < dynamicSize / 16; i++) {
            int entry = Math.toIntExact(dynamicOffset + i * 16L);
            long type = buffer.getLong(entry), value = buffer.getLong(entry + 8);
            if (type == 0) { terminated = true; break; }
            require(type != RPATH && type != TEXTREL);
            if (type == NEEDED) needed.add(value);
            if (type == STRING_TABLE || type == STRING_SIZE || type == SONAME || type == RUNPATH)
                require(tags.putIfAbsent(type, value) == null);
        }
        require(terminated && tags.keySet().equals(Set.of(STRING_TABLE, STRING_SIZE, SONAME, RUNPATH)));
        long stringSize = tags.get(STRING_SIZE), address = tags.get(STRING_TABLE);
        require(stringSize > 0 && stringSize <= MAX_STRING_BYTES && address >= 0);
        long stringOffset = -1;
        for (var load : loads) {
            long delta = address - load[1];
            if (delta >= 0 && delta <= load[2] && stringSize <= load[2] - delta) {
                require(stringOffset == -1); stringOffset = load[0] + delta;
            }
        }
        int start = range(stringOffset, stringSize, bytes.length), size = Math.toIntExact(stringSize);
        require(soname.equals(string(bytes, start, size, tags.get(SONAME))));
        require("$ORIGIN".equals(string(bytes, start, size, tags.get(RUNPATH))));
        var actual = new HashSet<String>();
        for (long position : needed) require(actual.add(string(bytes, start, size, position)));
        require(actual.equals(dependencies));
    }

    private static String string(byte[] bytes, int start, int size, long offset) {
        require(offset >= 0 && offset < size); int from = start + Math.toIntExact(offset), end = from;
        while (end < start + size && bytes[end] != 0) { require(bytes[end] >= 32 && bytes[end] <= 126); end++; }
        require(end < start + size); return new String(bytes, from, end - from, StandardCharsets.US_ASCII);
    }
    private static int range(long offset, long size, int length) {
        require(offset >= 0 && size >= 0 && offset <= length && size <= length - offset);
        return Math.toIntExact(offset);
    }
    private static void require(boolean condition) { if (!condition) throw new RenderFileException(CONFIGURATION); }
}
