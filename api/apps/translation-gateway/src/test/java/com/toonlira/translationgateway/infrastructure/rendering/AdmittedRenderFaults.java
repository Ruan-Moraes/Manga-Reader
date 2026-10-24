package com.toonlira.translationgateway.infrastructure.rendering;

import java.io.ByteArrayInputStream;
import java.io.DataInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.TimeUnit;

/** Test-only faults in an owned, admitted call; never change media/text/geometry. */
final class AdmittedRenderFaults {
    static final long FAILURE_ADDRESS_BYTES = 1536L * 1024 * 1024;
    private static final long MAX_SCRATCH_BYTES = 512L * 1024 * 1024;
    private static final int WRITE_BLOCK_BYTES = 1024 * 1024;
    private static final int FILESYSTEM_BLOCK_BYTES = 4096;
    private static final int BOUNDED_NATIVE_MAGIC = 0x54524e33;
    private AdmittedRenderFaults() { }

    static void signalOwnedChild(Process child, boolean pause) throws IOException {
        if (ProcessHandle.current().pid() != 1 || child == null || !child.isAlive()
            || child.toHandle().parent().map(ProcessHandle::pid).orElse(-1L) != 1)
            throw new IllegalStateException("test-fault-invalid-child");
        var builder = new ProcessBuilder(List.of("/bin/kill", pause ? "-STOP" : "-CONT", Long.toString(child.pid())))
            .redirectError(ProcessBuilder.Redirect.DISCARD).redirectOutput(ProcessBuilder.Redirect.DISCARD);
        builder.environment().clear();
        var signal = builder.start();
        try {
            if (!signal.waitFor(5, TimeUnit.SECONDS) || signal.exitValue() != 0)
                throw new IllegalStateException("test-fault-invalid-child");
            long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
            while (System.nanoTime() < end && child.isAlive()) {
                try (var input = Files.newInputStream(Path.of("/proc", Long.toString(child.pid()), "status"), LinkOption.NOFOLLOW_LINKS)) {
                    var bytes = input.readNBytes(16385);
                    if (bytes.length > 16384) throw new IllegalStateException("test-fault-invalid-child");
                    var state = new String(bytes, StandardCharsets.US_ASCII).lines().filter(line -> line.startsWith("State:")).findFirst().orElse("");
                    boolean stopped = state.matches("State:\\s+[Tt].*");
                    if (pause == stopped) return;
                }
                Thread.sleep(10);
            }
            throw new IllegalStateException("test-fault-invalid-child");
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt(); throw new IOException("test-fault-interrupted");
        } finally {
            signal.destroyForcibly();
            boolean interrupted = Thread.interrupted();
            while (true) try { signal.waitFor(); break; } catch (InterruptedException error) { interrupted = true; }
            if (interrupted) Thread.currentThread().interrupt();
        }
    }

    static long fillScratch(Path staging) throws IOException {
        var directory = staging.toRealPath();
        var store = Files.getFileStore(directory);
        if (!directory.getParent().equals(Path.of("/work/render"))
            || !directory.getFileName().toString().startsWith("render-jvm-")
            || !store.type().equals("tmpfs") || store.getTotalSpace() <= 0
            || store.getTotalSpace() > MAX_SCRATCH_BYTES) invalidScratch();
        var file = directory.resolve("test-pressure.bin");
        var block = ByteBuffer.allocate(WRITE_BLOCK_BYTES);
        boolean exhausted = false;
        try (var output = FileChannel.open(file, StandardOpenOption.WRITE,
                StandardOpenOption.CREATE_NEW, LinkOption.NOFOLLOW_LINKS)) {
            for (int attempt = 0; attempt <= MAX_SCRATCH_BYTES / WRITE_BLOCK_BYTES; attempt++) {
                block.clear();
                try { while (block.hasRemaining()) output.write(block); }
                catch (IOException failure) {
                    // No raw exception or guessed errno: success requires a genuinely exhausted tmpfs.
                    if (store.getUsableSpace() >= FILESYSTEM_BLOCK_BYTES) invalidScratch();
                    exhausted = true; break;
                }
            }
        }
        long written = Files.size(file);
        if (!exhausted || written <= 0 || written > MAX_SCRATCH_BYTES
            || store.getUsableSpace() >= FILESYSTEM_BLOCK_BYTES) invalidScratch();
        return written;
    }

    private static void invalidScratch() { throw new IllegalStateException("test-fault-invalid-scratch"); }

    static int lowerChildAddressCeiling(Path file) throws IOException {
        byte[] bytes;
        try (var stream = Files.newInputStream(file, LinkOption.NOFOLLOW_LINKS)) {
            bytes = stream.readNBytes(RenderSubprocessProtocol.MAX_REQUEST_BYTES + 1);
        }
        if (bytes.length > RenderSubprocessProtocol.MAX_REQUEST_BYTES) invalid();
        int offset;
        try (var input = new DataInputStream(new ByteArrayInputStream(bytes))) {
            if (input.readInt() != BOUNDED_NATIVE_MAGIC) invalid();
            for (int index = 0; index < 5; index++) input.readUTF();
            input.readLong();
            offset = bytes.length - input.available();
            if (input.readLong() != NativeProcessLimits.initial().addressSpaceBytes()) invalid();
        }
        var changed = ByteBuffer.allocate(Long.BYTES).putLong(FAILURE_ADDRESS_BYTES).flip();
        try (var output = FileChannel.open(file, StandardOpenOption.WRITE, LinkOption.NOFOLLOW_LINKS)) {
            output.position(offset);
            while (changed.hasRemaining()) output.write(changed);
        }
        return offset;
    }

    private static void invalid() { throw new IllegalStateException("test-fault-invalid-envelope"); }
}
