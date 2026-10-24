package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;

/** Experimental prerequisite, not operational approval or an atomic reservation against other workloads. */
final class LinuxWorkerMemoryAdmission {
    private static final long MIB = 1024L * 1024;
    private static final long GIB = 1024 * MIB;
    private static final long MIN_CONTAINER_BYTES = 8 * GIB;
    private static final long MAX_PROCESS_ADDRESS_BYTES = NativeWorkerParentLimitMain.CEILING;
    private static final long MAX_SCRATCH_BYTES = 512 * MIB;
    private static final long RESERVE_BYTES = GIB;
    private static final int MAX_PIDS = 64, CONTROL_BYTES = 4096, STATUS_BYTES = 16384;
    private final Access access;
    private final NativeProcessLimits childLimits;

    private LinuxWorkerMemoryAdmission(Access access, NativeProcessLimits childLimits) {
        this.access = access; this.childLimits = childLimits;
    }

    static LinuxWorkerMemoryAdmission admit(Path temporaryDirectory, NativeProcessLimits limits) {
        if (temporaryDirectory == null || !temporaryDirectory.isAbsolute()) invalid();
        return admit(new SystemAccess(temporaryDirectory, false), limits);
    }

    static void requirePreparationEnvironment(Path temporaryDirectory, NativeProcessLimits limits) {
        if (temporaryDirectory == null || !temporaryDirectory.isAbsolute()) invalid();
        // Planning only: the proposed parent cap is NOT kernel confirmation and this admission is never returned.
        admit(new SystemAccess(temporaryDirectory, true), limits);
    }

    static LinuxWorkerMemoryAdmission admit(Access access, NativeProcessLimits limits) {
        var result = new LinuxWorkerMemoryAdmission(access, limits);
        result.requireAvailable();
        return result;
    }

    void requireAvailable() {
        try {
            if (access == null || childLimits == null || childLimits.addressSpaceBytes() > MAX_PROCESS_ADDRESS_BYTES) invalid();
            var state = access.snapshot();
            if (state == null || state.pid() != 1 || !"0::/".equals(state.namespace())
                || state.memoryMaximum() < MIN_CONTAINER_BYTES || state.memoryCurrent() < 0
                || state.swapMaximum() != 0 || state.pidsMaximum() < 1 || state.pidsMaximum() > MAX_PIDS
                || !"tmpfs".equals(state.scratchType()) || state.scratchCapacity() < 1
                || state.scratchCapacity() > MAX_SCRATCH_BYTES || state.parentAddressLimit() != MAX_PROCESS_ADDRESS_BYTES
                || state.parentVirtualBytes() < 1
                || state.parentVirtualBytes() > state.parentAddressLimit()) invalid();
            // Fixed caps cover the two application processes; tmpfs is separately charged to the cgroup.
            long ceilings = Math.addExact(Math.addExact(state.parentAddressLimit(), childLimits.addressSpaceBytes()),
                Math.addExact(state.scratchCapacity(), RESERVE_BYTES));
            // Current charge may also contain cache/other pressure: do not equate VmSize, heap or RSS to that charge.
            long launchHeadroom = Math.addExact(state.memoryCurrent(), Math.addExact(childLimits.addressSpaceBytes(),
                Math.addExact(state.scratchCapacity(), RESERVE_BYTES)));
            if (ceilings > state.memoryMaximum() || launchHeadroom > state.memoryMaximum()) invalid();
        } catch (Throwable ignored) { throw new RenderFileException(CONFIGURATION); }
    }

    static long finite(String text, boolean zeroAllowed) {
        try {
            if (text == null || text.length() > CONTROL_BYTES) invalid();
            var value = text.strip();
            if (!value.matches("0|[1-9][0-9]{0,18}")) invalid();
            long number = Long.parseLong(value);
            if (!zeroAllowed && number == 0) invalid();
            return number;
        } catch (Throwable ignored) { throw new RenderFileException(CONFIGURATION); }
    }

    static long addressLimit(String text) {
        try {
            if (text == null || text.length() > CONTROL_BYTES) invalid();
            Long result = null;
            for (var row : text.split("\n", -1)) {
                var line = row.strip();
                if (!line.startsWith("Max address space")) continue;
                if (result != null || !line.matches("Max address space\\s+[1-9][0-9]{0,18}\\s+[1-9][0-9]{0,18}\\s+bytes")) invalid();
                var tokens = line.split("\\s+");
                long soft = finite(tokens[3], false), hard = finite(tokens[4], false);
                if (soft != hard) invalid();
                result = soft;
            }
            if (result == null) invalid();
            return result;
        } catch (Throwable ignored) { throw new RenderFileException(CONFIGURATION); }
    }

    static long virtualBytes(String text) {
        try {
            if (text == null || text.length() > STATUS_BYTES) invalid();
            Long result = null;
            for (var row : text.split("\n", -1)) {
                var line = row.strip();
                if (!line.startsWith("VmSize:")) continue;
                if (result != null || !line.matches("VmSize:\\s+[1-9][0-9]{0,18} kB")) invalid();
                result = Math.multiplyExact(finite(line.split("\\s+")[1], false), 1024);
            }
            if (result == null) invalid();
            return result;
        } catch (Throwable ignored) { throw new RenderFileException(CONFIGURATION); }
    }

    private static void invalid() { throw new RenderFileException(CONFIGURATION); }
    @Override public String toString() { return "LinuxWorkerMemoryAdmission[redacted]"; }

    @FunctionalInterface interface Access { Snapshot snapshot(); }
    record Snapshot(long pid, String namespace, long memoryMaximum, long memoryCurrent, long swapMaximum,
                    long pidsMaximum, String scratchType, long scratchCapacity, long parentAddressLimit, long parentVirtualBytes) {
        @Override public String toString() { return "WorkerMemorySnapshot[redacted]"; }
    }

    private record SystemAccess(Path temporaryDirectory, boolean preparing) implements Access {
        @Override public Snapshot snapshot() {
            try {
                var store = Files.getFileStore(temporaryDirectory);
                return new Snapshot(ProcessHandle.current().pid(), read("/proc/self/cgroup", CONTROL_BYTES).strip(),
                    finite(read("/sys/fs/cgroup/memory.max", CONTROL_BYTES), false),
                    finite(read("/sys/fs/cgroup/memory.current", CONTROL_BYTES), true),
                    finite(read("/sys/fs/cgroup/memory.swap.max", CONTROL_BYTES), true),
                    finite(read("/sys/fs/cgroup/pids.max", CONTROL_BYTES), false), store.type(), store.getTotalSpace(),
                    preparing ? MAX_PROCESS_ADDRESS_BYTES : addressLimit(read("/proc/self/limits", CONTROL_BYTES)),
                    virtualBytes(read("/proc/self/status", STATUS_BYTES)));
            } catch (Throwable ignored) { throw new RenderFileException(CONFIGURATION); }
        }
        private static String read(String fixedPath, int maximum) {
            try (var input = Files.newInputStream(Path.of(fixedPath), LinkOption.NOFOLLOW_LINKS)) {
                var bytes = input.readNBytes(maximum + 1);
                if (bytes.length < 1 || bytes.length > maximum) invalid();
                return new String(bytes, StandardCharsets.US_ASCII);
            } catch (Throwable ignored) { throw new RenderFileException(CONFIGURATION); }
        }
        @Override public String toString() { return "WorkerMemoryAccess[redacted]"; }
    }
}
