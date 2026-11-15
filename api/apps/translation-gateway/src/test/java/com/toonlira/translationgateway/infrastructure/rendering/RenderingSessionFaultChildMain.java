package com.toonlira.translationgateway.infrastructure.rendering;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintStream;
import java.nio.ByteBuffer;
import java.lang.foreign.Linker;
import java.lang.foreign.FunctionDescriptor;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.ValueLayout;
import java.nio.channels.FileChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

/** Test-only resource pressure after input acquisition, before native decode. IPC bytes and ceilings stay unchanged. */
public final class RenderingSessionFaultChildMain {
    private RenderingSessionFaultChildMain() { }
    public static void main(String[] args) {
        System.setOut(new PrintStream(new FaultOutput(System.out), true));
        RenderingTaskChildMain.main(args);
    }
    private static final class FaultOutput extends OutputStream {
        private final PrintStream target;
        private final ByteArrayOutputStream frame = new ByteArrayOutputStream();
        private boolean injected;
        FaultOutput(PrintStream target) { this.target = target; }
        @Override public void write(int value) throws IOException { target.write(value); frame.write(value); }
        @Override public void write(byte[] bytes, int offset, int length) throws IOException {
            target.write(bytes, offset, length); frame.write(bytes, offset, length);
            if (frame.size() > RenderingSessionProtocol.MAX_BYTES + 8) throw new IOException("test-frame-too-large");
        }
        @Override public void flush() throws IOException {
            target.flush();
            var bytes = frame.toByteArray();
            if (bytes.length < 8) return;
            int length = ByteBuffer.wrap(bytes).getInt(4);
            if (length < 1 || length > RenderingSessionProtocol.MAX_BYTES || bytes.length < length + 8) return;
            var request = RenderingSessionProtocol.read(new ByteArrayInputStream(bytes), RenderingSessionProtocol.Request.class);
            frame.reset();
            if (injected || !"CLAIM".equals(request.operation())) return;
            injected = true;
            if (Files.exists(Path.of("disk-fault"))) fillScratch();
            else {
                reserveAddressSpace();
            }
        }
    }
    private static MemorySegment addressReservation;
    private static void reserveAddressSpace() throws IOException {
        long ceiling = NativeProcessLimits.initial().addressSpaceBytes();
        var limits = Files.readAllLines(Path.of("/proc/self/limits"));
        var line = limits.stream().filter(value -> value.startsWith("Max address space")).findFirst().orElseThrow();
        var tokens = line.substring("Max address space".length()).trim().split("\\s+");
        if (!tokens[0].equals(Long.toString(ceiling)) || !tokens[1].equals(Long.toString(ceiling)))
            throw new IOException("test-address-ceiling");
        long current = Files.readAllLines(Path.of("/proc/self/status")).stream()
            .filter(value -> value.startsWith("VmSize:")).map(value -> Long.parseLong(value.trim().split("\\s+")[1]) * 1024)
            .findFirst().orElseThrow();
        long headroom = 384L * 1024 * 1024;
        long reserved = ceiling - current - headroom;
        if (reserved < 1024 * 1024) throw new IOException("test-address-headroom");
        var linker = Linker.nativeLinker();
        var mapper = linker.downcallHandle(linker.defaultLookup().findOrThrow("mmap"),
            FunctionDescriptor.of(ValueLayout.ADDRESS, ValueLayout.ADDRESS, ValueLayout.JAVA_LONG,
                ValueLayout.JAVA_INT, ValueLayout.JAVA_INT, ValueLayout.JAVA_INT, ValueLayout.JAVA_LONG));
        try {
            // PROT_NONE, MAP_PRIVATE|MAP_ANONYMOUS: occupy virtual space without touching pages or raising any cap.
            addressReservation = (MemorySegment) mapper.invokeExact(MemorySegment.NULL, reserved, 0, 0x22, -1, 0L);
            if (addressReservation.address() == -1) throw new IOException("test-address-reservation");
        } catch (IOException error) { throw error; }
        catch (Throwable error) { throw new IOException("test-address-mapping"); }
        Files.writeString(Path.of("/export/session-address.json"), "{\"phase\":\"predecode\",\"ceilingBytes\":" + ceiling
            + ",\"reservedBytes\":" + reserved + ",\"headroomBytes\":" + headroom + "}");
    }
    private static void fillScratch() throws IOException {
        var directory = Path.of("").toAbsolutePath().toRealPath();
        if (!directory.getParent().equals(Path.of("/work/render/render-sessions-v1"))
            || !directory.getFileName().toString().matches("session-[0-9a-f-]{36}")) throw new IOException("test-scratch-owner");
        var store = Files.getFileStore(directory);
        if (!"tmpfs".equals(store.type()) || store.getTotalSpace() > 512L * 1024 * 1024) throw new IOException("test-scratch-store");
        var block = ByteBuffer.allocate(1024 * 1024);
        long bytes = 0;
        boolean full = false;
        // Each file stays below the already-active production RLIMIT_FSIZE (64 MiB).
        for (int file = 0; file < 17 && !full; file++) {
            try (var output = FileChannel.open(directory.resolve("test-pressure-" + file),
                    StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE)) {
                for (int index = 0; index < 32; index++) {
                    block.clear();
                    try { while (block.hasRemaining()) bytes += output.write(block); }
                    catch (IOException exhausted) {
                        if (store.getUsableSpace() != 0) throw exhausted;
                        full = true; break;
                    }
                }
            }
        }
        if (!full || bytes == 0 || store.getUsableSpace() != 0) throw new IOException("test-scratch-not-full");
        Files.writeString(Path.of("/export/session-pressure.json"), "{\"bytes\":" + bytes + ",\"usable\":0}");
    }
}
