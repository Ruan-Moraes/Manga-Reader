package com.toonlira.translationgateway.infrastructure.rendering;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.lang.foreign.Arena;
import java.lang.foreign.FunctionDescriptor;
import java.lang.foreign.Linker;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.ValueLayout;
import java.lang.invoke.MethodHandle;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Map;

/** Test-only peer helper. Only container PID 1, its actual parent and the same JVM executable can be tightened. */
public final class OwnedParentAddressProbe {
    private static final long CEILING = 3L * 1024 * 1024 * 1024;
    private static final int STATUS_BYTES = 16384, CONTROL_BYTES = 4096;
    private OwnedParentAddressProbe() { }

    public static void main(String[] arguments) {
        try {
            require(arguments.length == 1 && arguments[0].equals("/work") && ProcessHandle.current().pid() > 1);
            LinuxNativeProcessGuard.requirePlatform();
            LinuxOomPolicy.requireSupervisor();
            // The helper is short-lived; the parent's score, CPU budget and descriptors are not changed.
            LinuxNativeProcessGuard.apply(new NativeProcessLimits(1024L * 1024 * 1024, 10, 1024 * 1024, 64));
            Bound result;
            try (var access = new NativeAccess()) { result = tighten(access); }
            var bytes = GatewayJsonMapper.create().writeValueAsBytes(Map.of("parentIdentityConfirmed", true,
                "parentAddressSpaceLimitBytes", result.limitBytes(), "parentVirtualBeforeBytes", result.virtualBeforeBytes(),
                "parentVirtualAfterBytes", result.virtualAfterBytes()));
            Files.write(Path.of("/work/parent-limit.json"), bytes, StandardOpenOption.CREATE_NEW);
        } catch (Throwable ignored) { System.exit(1); }
    }

    static Bound tighten(Access access) {
        try {
            require(access != null && access.parentPid() == 1 && access.sameExecutable() && access.privateGroup());
            long before = access.parentVirtualBytes();
            var previous = access.read();
            require(previous != null && Long.compareUnsigned(previous.soft(), previous.hard()) <= 0);
            long limit = minimum(CEILING, minimum(previous.soft(), previous.hard()));
            require(before > 0 && before <= limit);
            var bounded = new LinuxNativeProcessGuard.Limits(limit, limit);
            access.write(bounded);
            require(bounded.equals(access.read()) && access.parentPid() == 1 && access.sameExecutable() && access.privateGroup());
            long after = access.parentVirtualBytes();
            require(after > 0 && after <= limit);
            return new Bound(limit, before, after);
        } catch (Throwable ignored) { throw unavailable(); }
    }

    static long virtualBytes(String text) {
        try {
            require(text != null && text.length() <= STATUS_BYTES);
            Long result = null;
            for (var row : text.split("\n", -1)) {
                var line = row.strip();
                if (!line.startsWith("VmSize:")) continue;
                require(result == null && line.matches("VmSize:\\s+[1-9][0-9]{0,18} kB"));
                result = Math.multiplyExact(Long.parseLong(line.split("\\s+")[1]), 1024);
            }
            require(result != null); return result;
        } catch (Throwable ignored) { throw unavailable(); }
    }

    static long addressLimitBytes(String text) {
        try {
            require(text != null && text.length() <= CONTROL_BYTES);
            Long result = null;
            for (var row : text.split("\n", -1)) {
                var line = row.strip();
                if (!line.startsWith("Max address space")) continue;
                require(result == null && line.matches("Max address space\\s+[1-9][0-9]{0,18}\\s+[1-9][0-9]{0,18}\\s+bytes"));
                var tokens = line.split("\\s+");
                long soft = Long.parseLong(tokens[3]), hard = Long.parseLong(tokens[4]);
                require(soft == hard); result = soft;
            }
            require(result != null); return result;
        } catch (Throwable ignored) { throw unavailable(); }
    }

    private static long minimum(long first, long second) { return Long.compareUnsigned(first, second) <= 0 ? first : second; }
    private static void require(boolean value) { if (!value) throw unavailable(); }
    private static IllegalStateException unavailable() { return new IllegalStateException("owned-parent-limit-unavailable"); }

    interface Access {
        int parentPid();
        boolean sameExecutable();
        boolean privateGroup();
        long parentVirtualBytes();
        LinuxNativeProcessGuard.Limits read();
        void write(LinuxNativeProcessGuard.Limits limits);
    }
    record Bound(long limitBytes, long virtualBeforeBytes, long virtualAfterBytes) { }

    private static final class NativeAccess implements Access, AutoCloseable {
        private final Arena arena = Arena.ofConfined();
        private final MemorySegment pair = arena.allocate(16, 8);
        private final MethodHandle limiter, parent;

        NativeAccess() {
            var linker = Linker.nativeLinker();
            require(linker.canonicalLayouts().get("int").byteSize() == 4 && linker.canonicalLayouts().get("long").byteSize() == 8);
            limiter = linker.downcallHandle(linker.defaultLookup().findOrThrow("prlimit"),
                FunctionDescriptor.of(ValueLayout.JAVA_INT, ValueLayout.JAVA_INT, ValueLayout.JAVA_INT,
                    ValueLayout.ADDRESS, ValueLayout.ADDRESS));
            parent = linker.downcallHandle(linker.defaultLookup().findOrThrow("getppid"), FunctionDescriptor.of(ValueLayout.JAVA_INT));
        }

        @Override public int parentPid() {
            try { return (int) parent.invokeExact(); } catch (Throwable ignored) { throw unavailable(); }
        }
        @Override public boolean sameExecutable() {
            // These are fixed kernel links, deliberately not operator-supplied or arbitrary process paths.
            try { return Files.isSameFile(Path.of("/proc/self/exe"), Path.of("/proc/1/exe")); }
            catch (Exception ignored) { throw unavailable(); }
        }
        @Override public boolean privateGroup() {
            return control("/proc/self/cgroup", CONTROL_BYTES).strip().equals("0::/")
                && control("/proc/1/cgroup", CONTROL_BYTES).strip().equals("0::/");
        }
        @Override public long parentVirtualBytes() { return virtualBytes(control("/proc/1/status", STATUS_BYTES)); }
        @Override public LinuxNativeProcessGuard.Limits read() {
            try {
                require((int) limiter.invokeExact(1, 9, MemorySegment.NULL, pair) == 0);
                return new LinuxNativeProcessGuard.Limits(pair.get(ValueLayout.JAVA_LONG, 0), pair.get(ValueLayout.JAVA_LONG, 8));
            } catch (Throwable ignored) { throw unavailable(); }
        }
        @Override public void write(LinuxNativeProcessGuard.Limits limits) {
            try {
                pair.set(ValueLayout.JAVA_LONG, 0, limits.soft()); pair.set(ValueLayout.JAVA_LONG, 8, limits.hard());
                require((int) limiter.invokeExact(1, 9, pair, MemorySegment.NULL) == 0);
            } catch (Throwable ignored) { throw unavailable(); }
        }
        @Override public void close() { arena.close(); }

        private static String control(String fixedPath, int limit) {
            try (var input = Files.newInputStream(Path.of(fixedPath))) {
                var bytes = input.readNBytes(limit + 1); require(bytes.length > 0 && bytes.length <= limit);
                return new String(bytes, StandardCharsets.US_ASCII);
            } catch (Exception ignored) { throw unavailable(); }
        }
    }
}
