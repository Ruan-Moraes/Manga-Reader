import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

/** Synthetic checks only; no claim about a cloud instance or native syscall availability. */
final class WorkerIsolationProbeChecks {
    private static final long GIB = 1024L * 1024 * 1024;
    public static void main(String[] arguments) {
        var valid = new Fixture();
        require(WorkerIsolationProbe.inspect(valid).status().equals("observations-match"));
        require(!WorkerIsolationProbe.inspect(valid).json().contains("private-secret"));
        for (var control : WorkerIsolationProbe.Control.values()) {
            var missing = new Fixture(); missing.values.remove(control);
            require(WorkerIsolationProbe.inspect(missing).status().equals("observations-incomplete"));
        }
        for (var invalid : Map.of(
                WorkerIsolationProbe.Control.MEMORY_MAX, "max",
                WorkerIsolationProbe.Control.SWAP_MAX, "1",
                WorkerIsolationProbe.Control.PIDS_MAX, "65",
                WorkerIsolationProbe.Control.OOM_GROUP, "1",
                WorkerIsolationProbe.Control.OOM_SCORE, "1",
                WorkerIsolationProbe.Control.CGROUP, "0::/private-secret",
                WorkerIsolationProbe.Control.LIMITS, "Max address space unlimited unlimited bytes\n").entrySet()) {
            var fixture = new Fixture(); fixture.values.put(invalid.getKey(), invalid.getValue());
            var report = WorkerIsolationProbe.inspect(fixture);
            require(report.status().equals("requirements-not-met"));
            require(!report.json().contains("private-secret"));
        }
        for (var bytes : new long[] {8 * GIB - 1, 8 * GIB}) {
            var fixture = new Fixture(); fixture.values.put(WorkerIsolationProbe.Control.MEMORY_MAX, Long.toString(bytes));
            require(WorkerIsolationProbe.inspect(fixture).status().equals(bytes < 8 * GIB ? "requirements-not-met" : "observations-match"));
        }
        for (var pids : new int[] {0, 1, 64, 65}) {
            var fixture = new Fixture(); fixture.values.put(WorkerIsolationProbe.Control.PIDS_MAX, Integer.toString(pids));
            require(WorkerIsolationProbe.inspect(fixture).status().equals(pids == 0 || pids == 65 ? "requirements-not-met" : "observations-match"));
        }
        var pressure = new Fixture(); pressure.values.put(WorkerIsolationProbe.Control.MEMORY_CURRENT, Long.toString(5 * GIB));
        require(WorkerIsolationProbe.inspect(pressure).status().equals("requirements-not-met"));
        var malformed = new Fixture(); malformed.values.put(WorkerIsolationProbe.Control.PIDS_MAX, "private-secret");
        require(WorkerIsolationProbe.inspect(malformed).status().equals("observations-incomplete"));
        require(!WorkerIsolationProbe.inspect(malformed).json().contains("private-secret"));
        var oversized = new Fixture(); oversized.values.put(WorkerIsolationProbe.Control.LIMITS, "private-secret".repeat(4096));
        require(WorkerIsolationProbe.inspect(oversized).status().equals("observations-incomplete"));
        var scratch = new Fixture(); scratch.scratch = new WorkerIsolationProbe.Scratch("private-secret", 512L * 1024 * 1024 + 1, Set.of());
        require(WorkerIsolationProbe.inspect(scratch).status().equals("requirements-not-met"));
        require(!WorkerIsolationProbe.inspect(scratch).json().contains("private-secret"));
        var unknownScratch = new Fixture(); unknownScratch.scratch = null;
        require(WorkerIsolationProbe.inspect(unknownScratch).status().equals("observations-incomplete"));
        var unknownFlags = new Fixture(); unknownFlags.scratch = new WorkerIsolationProbe.Scratch("tmpfs", 512L * 1024 * 1024, null);
        require(WorkerIsolationProbe.inspect(unknownFlags).status().equals("observations-incomplete"));
        var duplicateLimit = new Fixture(); duplicateLimit.values.put(WorkerIsolationProbe.Control.LIMITS, valid.read(WorkerIsolationProbe.Control.LIMITS).repeat(2));
        require(WorkerIsolationProbe.inspect(duplicateLimit).status().equals("observations-incomplete"));
        var duplicateStatus = new Fixture(); duplicateStatus.values.put(WorkerIsolationProbe.Control.STATUS, valid.read(WorkerIsolationProbe.Control.STATUS).repeat(2));
        require(WorkerIsolationProbe.inspect(duplicateStatus).status().equals("observations-incomplete"));
        var overflow = new Fixture(); overflow.values.put(WorkerIsolationProbe.Control.MEMORY_CURRENT, Long.toString(Long.MAX_VALUE));
        require(WorkerIsolationProbe.inspect(overflow).status().equals("requirements-not-met"));
        require(WorkerIsolationProbe.mountFlags("private-secret".repeat(65536), "/work") == null);
        try { WorkerIsolationProbe.inspect(valid).checks().clear(); throw new AssertionError(); }
        catch (UnsupportedOperationException expected) { }
        require(WorkerIsolationProbe.mountFlags("1 0 0:1 / / rw - tmpfs tmpfs rw\n2 1 0:2 / /work rw,noexec,nosuid,nodev - tmpfs tmpfs rw\n", "/work/sub").equals(Set.of("noexec", "nosuid", "nodev")));
        require(WorkerIsolationProbe.mountFlags("1 0 0:1 / / rw - tmpfs tmpfs rw\n2 1 0:2 / /work rw,noexec - tmpfs tmpfs rw\n", "/workspace").isEmpty());
        require(WorkerIsolationProbe.mountFlags("2 1 0:2 / /work\\040space rw,noexec - tmpfs tmpfs rw\n", "/work space/sub").contains("noexec"));
        System.out.println("synthetic-checks-passed");
    }
    private static void require(boolean condition) { if (!condition) throw new AssertionError("synthetic-check-failed"); }
    private static final class Fixture implements WorkerIsolationProbe.Access {
        final Map<WorkerIsolationProbe.Control, String> values = new EnumMap<>(WorkerIsolationProbe.Control.class);
        WorkerIsolationProbe.Scratch scratch = new WorkerIsolationProbe.Scratch("tmpfs", 512L * 1024 * 1024, Set.of("noexec", "nosuid", "nodev"));
        Fixture() {
            values.put(WorkerIsolationProbe.Control.CGROUP, "0::/\n");
            values.put(WorkerIsolationProbe.Control.MEMORY_MAX, Long.toString(8 * GIB));
            values.put(WorkerIsolationProbe.Control.MEMORY_CURRENT, Long.toString(GIB));
            values.put(WorkerIsolationProbe.Control.SWAP_MAX, "0");
            values.put(WorkerIsolationProbe.Control.PIDS_MAX, "64");
            values.put(WorkerIsolationProbe.Control.OOM_GROUP, "0");
            values.put(WorkerIsolationProbe.Control.OOM_SCORE, "0");
            values.put(WorkerIsolationProbe.Control.LIMITS, "Max address space " + 3 * GIB + " " + 3 * GIB + " bytes\n");
            values.put(WorkerIsolationProbe.Control.STATUS, "VmSize: 524288 kB\n");
        }
        public boolean linux() { return true; }
        public boolean amd64() { return true; }
        public long pid() { return 1; }
        public String read(WorkerIsolationProbe.Control control) { return values.get(control); }
        public WorkerIsolationProbe.Scratch scratch() { return scratch; }
    }
}
