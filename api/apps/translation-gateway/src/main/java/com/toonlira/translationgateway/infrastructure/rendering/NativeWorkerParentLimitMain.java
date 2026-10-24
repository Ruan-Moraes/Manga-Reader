package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import java.lang.foreign.Arena;
import java.lang.foreign.FunctionDescriptor;
import java.lang.foreign.Linker;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.ValueLayout;
import java.lang.invoke.MethodHandle;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

/** Private helper entry point, never an HTTP/task contract. No arbitrary PID, path or business arguments. */
public final class NativeWorkerParentLimitMain {
    static final long CEILING = 3L * 1024 * 1024 * 1024;
    static final String CONFIRMATION = "parent-limit.bin";
    private static final int MAGIC = 0x57504c31, CONFIRMATION_BYTES = 12;
    private static final int PARENT = 1, ADDRESS_SPACE = 9, STATUS_BYTES = 16384, CONTROL_BYTES = 4096;
    private NativeWorkerParentLimitMain() { }

    public static void main(String[] arguments) {
        try {
            require(arguments.length == 0 && ProcessHandle.current().pid() > PARENT);
            LinuxNativeProcessGuard.requirePlatform();
            LinuxOomPolicy.requireSupervisor();
            LinuxNativeProcessGuard.apply(new NativeProcessLimits(1024L * 1024 * 1024, 10, 1024, 64));
            try (var access = new NativeAccess()) { tighten(access); }
            Files.write(Path.of(CONFIRMATION), confirmation(), StandardOpenOption.CREATE_NEW,
                StandardOpenOption.WRITE, LinkOption.NOFOLLOW_LINKS);
        } catch (Throwable ignored) { System.exit(1); }
    }

    static void tighten(Access access) {
        try {
            requireScope(access);
            long before = access.parentVirtualBytes();
            var previous = access.read();
            require(previous != null && Long.compareUnsigned(previous.soft(), previous.hard()) <= 0
                && Long.compareUnsigned(previous.soft(), CEILING) >= 0 && Long.compareUnsigned(previous.hard(), CEILING) >= 0
                && before > 0 && before < CEILING);
            var limit = new LinuxNativeProcessGuard.Limits(CEILING, CEILING);
            access.write(limit);
            require(limit.equals(access.read()));
            requireScope(access);
            long after = access.parentVirtualBytes();
            require(after > 0 && after < CEILING);
        } catch (Throwable ignored) { throw unavailable(); }
    }

    static byte[] confirmation() { return ByteBuffer.allocate(CONFIRMATION_BYTES).putInt(MAGIC).putLong(CEILING).array(); }

    static long confirm(byte[] bytes) {
        require(bytes != null && bytes.length == CONFIRMATION_BYTES);
        var buffer = ByteBuffer.wrap(bytes);
        require(buffer.getInt() == MAGIC && buffer.getLong() == CEILING);
        return CEILING;
    }

    private static void requireScope(Access access) {
        require(access != null && access.parentPid() == PARENT && access.sameExecutable() && access.privateGroup());
    }
    private static void require(boolean condition) { if (!condition) throw unavailable(); }
    private static RenderFileException unavailable() { return new RenderFileException(CONFIGURATION); }

    interface Access {
        int parentPid();
        boolean sameExecutable();
        boolean privateGroup();
        long parentVirtualBytes();
        LinuxNativeProcessGuard.Limits read();
        void write(LinuxNativeProcessGuard.Limits limits);
    }

    private static final class NativeAccess implements Access, AutoCloseable {
        private final Arena arena;
        private final MemorySegment pair;
        private final MethodHandle limiter, parent;
        NativeAccess() {
            var linker = Linker.nativeLinker();
            require(linker.canonicalLayouts().get("int").byteSize() == Integer.BYTES
                && linker.canonicalLayouts().get("long").byteSize() == Long.BYTES);
            limiter = linker.downcallHandle(linker.defaultLookup().findOrThrow("prlimit"),
                FunctionDescriptor.of(ValueLayout.JAVA_INT, ValueLayout.JAVA_INT, ValueLayout.JAVA_INT,
                    ValueLayout.ADDRESS, ValueLayout.ADDRESS));
            parent = linker.downcallHandle(linker.defaultLookup().findOrThrow("getppid"), FunctionDescriptor.of(ValueLayout.JAVA_INT));
            arena = Arena.ofConfined(); pair = arena.allocate(2L * Long.BYTES, Long.BYTES);
        }
        @Override public int parentPid() {
            try { return (int) parent.invokeExact(); } catch (Throwable ignored) { throw unavailable(); }
        }
        @Override public boolean sameExecutable() {
            // Deliberately fixed kernel links: there is no operator/job-supplied process target.
            try { return Files.isSameFile(Path.of("/proc/self/exe"), Path.of("/proc/1/exe")); }
            catch (Exception ignored) { throw unavailable(); }
        }
        @Override public boolean privateGroup() {
            return readControl("/proc/self/cgroup", CONTROL_BYTES).strip().equals("0::/")
                && readControl("/proc/1/cgroup", CONTROL_BYTES).strip().equals("0::/");
        }
        @Override public long parentVirtualBytes() {
            return LinuxWorkerMemoryAdmission.virtualBytes(readControl("/proc/1/status", STATUS_BYTES));
        }
        @Override public LinuxNativeProcessGuard.Limits read() {
            try {
                require((int) limiter.invokeExact(PARENT, ADDRESS_SPACE, MemorySegment.NULL, pair) == 0);
                return new LinuxNativeProcessGuard.Limits(pair.get(ValueLayout.JAVA_LONG, 0), pair.get(ValueLayout.JAVA_LONG, Long.BYTES));
            } catch (Throwable ignored) { throw unavailable(); }
        }
        @Override public void write(LinuxNativeProcessGuard.Limits limits) {
            try {
                pair.set(ValueLayout.JAVA_LONG, 0, limits.soft()); pair.set(ValueLayout.JAVA_LONG, Long.BYTES, limits.hard());
                require((int) limiter.invokeExact(PARENT, ADDRESS_SPACE, pair, MemorySegment.NULL) == 0);
            } catch (Throwable ignored) { throw unavailable(); }
        }
        @Override public void close() { arena.close(); }
        private static String readControl(String fixedPath, int maximum) {
            try (var input = Files.newInputStream(Path.of(fixedPath), LinkOption.NOFOLLOW_LINKS)) {
                var bytes = input.readNBytes(maximum + 1); require(bytes.length > 0 && bytes.length <= maximum);
                return new String(bytes, StandardCharsets.US_ASCII);
            } catch (Throwable ignored) { throw unavailable(); }
        }
    }
}
