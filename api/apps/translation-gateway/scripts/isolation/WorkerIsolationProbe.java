import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.LongPredicate;

/** Standalone, dependency-free observations. Never starts the worker or changes kernel controls. */
public final class WorkerIsolationProbe {
    private static final long MIB = 1024L * 1024, GIB = 1024 * MIB;
    private static final long MIN_MEMORY = 8 * GIB, ADDRESS_CEILING = 3 * GIB, MAX_SCRATCH = 512 * MIB;
    private static final int CONTROL_BYTES = 4096, STATUS_BYTES = 16384, MOUNT_BYTES = 65536;
    private static final Set<String> REQUIRED_FLAGS = Set.of("noexec", "nosuid", "nodev");
    private WorkerIsolationProbe() { }

    public static void main(String[] arguments) {
        try {
            var options = Options.parse(arguments);
            var report = inspect(new SystemAccess(options.scratch())).json() + "\n";
            if (options.output() != null) Files.writeString(options.output(), report, StandardCharsets.UTF_8,
                StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE, LinkOption.NOFOLLOW_LINKS);
            System.out.print(report);
        } catch (Exception error) {
            System.err.println("isolation-probe-unavailable");
            System.exit(2);
        }
    }

    static Report inspect(Access access) {
        var checks = new ArrayList<Check>();
        checks.add(flag("linux", access.linux()));
        checks.add(flag("cloud_run_amd64_abi", access.amd64()));
        checks.add(number("pid_one", access.pid(), value -> value == 1));
        var namespace = bounded(access.read(Control.CGROUP), CONTROL_BYTES);
        checks.add(match("private_cgroup_v2", namespace, "0::/"));
        Long maximum = unsigned(access.read(Control.MEMORY_MAX));
        Long current = unsigned(access.read(Control.MEMORY_CURRENT));
        checks.add(number("memory_at_least_8gib", maximum, value -> value >= MIN_MEMORY));
        checks.add(number("swap_disabled", unsigned(access.read(Control.SWAP_MAX)), value -> value == 0));
        checks.add(number("pids_1_to_64", unsigned(access.read(Control.PIDS_MAX)), value -> value >= 1 && value <= 64));
        checks.add(number("oom_group_disabled", unsigned(access.read(Control.OOM_GROUP)), value -> value == 0));
        var score = signedScore(access.read(Control.OOM_SCORE));
        checks.add(number("supervisor_oom_score", score, value -> value <= 0));
        var scratch = access.scratch();
        checks.add(match("scratch_tmpfs", scratch == null ? null : scratch.type(), "tmpfs"));
        Long capacity = scratch == null ? null : scratch.capacity();
        checks.add(number("scratch_at_most_512mib", capacity, value -> value > 0 && value <= MAX_SCRATCH));
        for (var flag : List.of("noexec", "nosuid", "nodev")) {
            var flags = scratch == null ? null : scratch.flags();
            checks.add(flags == null ? unknown("scratch_" + flag) : flag("scratch_" + flag, flags.contains(flag)));
        }
        Long address = addressLimit(access.read(Control.LIMITS));
        checks.add(number("address_limit_3gib", address, value -> value == ADDRESS_CEILING));
        Long virtual = virtualBytes(access.read(Control.STATUS));
        checks.add(number("virtual_size_below_3gib", virtual, value -> value > 0 && value < ADDRESS_CEILING));
        checks.add(sumWithin("fixed_ceiling_budget", maximum, ADDRESS_CEILING, ADDRESS_CEILING, capacity, GIB));
        checks.add(sumWithin("current_launch_headroom", maximum, current, ADDRESS_CEILING, capacity, GIB));
        return new Report(checks);
    }

    private static Check sumWithin(String id, Long maximum, Long... values) {
        if (maximum == null) return unknown(id);
        for (var value : values) if (value == null) return unknown(id);
        if (maximum < 0) return flag(id, false);
        try {
            long sum = 0;
            for (long value : values) {
                if (value < 0) return flag(id, false);
                sum = Math.addExact(sum, value);
            }
            return flag(id, sum <= maximum);
        } catch (ArithmeticException error) { return flag(id, false); }
    }
    private static Check flag(String id, boolean passed) { return new Check(id, passed ? "PASS" : "FAIL", passed ? "matched" : "different"); }
    private static Check unknown(String id) { return new Check(id, "UNKNOWN", "unavailable"); }
    private static Check match(String id, String observed, String expected) {
        return observed == null ? unknown(id) : flag(id, observed.equals(expected));
    }
    private static Check number(String id, Long observed, LongPredicate predicate) {
        if (observed == null) return unknown(id);
        return new Check(id, predicate.test(observed) ? "PASS" : "FAIL", Long.toString(observed));
    }
    private static String bounded(String raw, int maximum) {
        if (raw == null || raw.length() > maximum || raw.isBlank()) return null;
        return raw.strip();
    }
    private static Long unsigned(String raw) {
        var value = bounded(raw, CONTROL_BYTES);
        if ("max".equals(value)) return -1L;
        if (value == null || !value.matches("0|[1-9][0-9]{0,18}")) return null;
        try { return Long.parseLong(value); } catch (NumberFormatException error) { return null; }
    }
    private static Long signedScore(String raw) {
        var value = bounded(raw, CONTROL_BYTES);
        if (value == null || !value.matches("-?(0|[1-9][0-9]{0,3})")) return null;
        long parsed = Long.parseLong(value);
        return parsed >= -1000 && parsed <= 1000 ? parsed : null;
    }
    private static Long addressLimit(String raw) {
        var value = bounded(raw, CONTROL_BYTES);
        if (value == null) return null;
        String found = null;
        for (var line : value.split("\n")) {
            if (!line.strip().startsWith("Max address space")) continue;
            if (found != null) return null;
            found = line.strip();
        }
        if (found == null || !found.matches("Max address space\\s+(unlimited|[1-9][0-9]{0,18})\\s+(unlimited|[1-9][0-9]{0,18})\\s+bytes")) return null;
        var parts = found.split("\\s+");
        if (parts[3].equals("unlimited") || parts[4].equals("unlimited")) return -1L;
        var soft = unsigned(parts[3]); var hard = unsigned(parts[4]);
        if (soft == null || hard == null) return null;
        return soft.equals(hard) ? soft : -2L;
    }
    private static Long virtualBytes(String raw) {
        var value = bounded(raw, STATUS_BYTES);
        if (value == null) return null;
        String found = null;
        for (var line : value.split("\n")) {
            if (!line.strip().startsWith("VmSize:")) continue;
            if (found != null) return null;
            found = line.strip();
        }
        if (found == null || !found.matches("VmSize:\\s+[1-9][0-9]{0,18} kB")) return null;
        var kilobytes = unsigned(found.split("\\s+")[1]);
        if (kilobytes == null) return null;
        try { return Math.multiplyExact(kilobytes, 1024); } catch (ArithmeticException error) { return null; }
    }

    static Set<String> mountFlags(String raw, String scratch) {
        var value = bounded(raw, MOUNT_BYTES);
        if (value == null) return null;
        String best = null; Set<String> flags = null;
        for (var line : value.split("\n")) {
            var fields = line.split(" ");
            if (fields.length < 10 || !line.contains(" - ")) continue;
            var mount = fields[4].replace("\\040", " ").replace("\\011", "\t").replace("\\012", "\n").replace("\\134", "\\");
            if (!(scratch.equals(mount) || scratch.startsWith(mount.equals("/") ? "/" : mount + "/"))) continue;
            if (best != null && mount.length() <= best.length()) continue;
            best = mount;
            var selected = new HashSet<String>();
            for (var option : fields[5].split(",")) if (REQUIRED_FLAGS.contains(option)) selected.add(option);
            flags = Set.copyOf(selected);
        }
        return flags;
    }

    enum Control {
        CGROUP("/proc/self/cgroup"), MEMORY_MAX("/sys/fs/cgroup/memory.max"), MEMORY_CURRENT("/sys/fs/cgroup/memory.current"),
        SWAP_MAX("/sys/fs/cgroup/memory.swap.max"), PIDS_MAX("/sys/fs/cgroup/pids.max"),
        OOM_GROUP("/sys/fs/cgroup/memory.oom.group"), OOM_SCORE("/proc/self/oom_score_adj"),
        LIMITS("/proc/self/limits"), STATUS("/proc/self/status");
        final String path;
        Control(String path) { this.path = path; }
    }
    interface Access {
        boolean linux(); boolean amd64(); long pid(); String read(Control control); Scratch scratch();
    }
    record Scratch(String type, long capacity, Set<String> flags) {
        Scratch { if (flags != null) flags = Set.copyOf(flags); }
        @Override public String toString() { return "Scratch[redacted]"; }
    }
    record Check(String id, String status, String observed) { }
    record Report(List<Check> checks) {
        Report { checks = List.copyOf(checks); }
        String status() {
            if (checks.stream().anyMatch(check -> check.status().equals("FAIL"))) return "requirements-not-met";
            if (checks.stream().anyMatch(check -> check.status().equals("UNKNOWN"))) return "observations-incomplete";
            return "observations-match";
        }
        String json() {
            var output = new StringBuilder("{\"probeVersion\":\"1.0\",\"observedAt\":\"").append(Instant.now())
                .append("\",\"javaMajor\":").append(Runtime.version().feature())
                .append(",\"operationalApproval\":false,\"nativeOperationsTested\":false,\"status\":\"")
                .append(status()).append("\",\"checks\":[");
            for (int index = 0; index < checks.size(); index++) {
                if (index > 0) output.append(',');
                var check = checks.get(index);
                output.append("{\"id\":\"").append(check.id()).append("\",\"status\":\"")
                    .append(check.status()).append("\",\"observed\":\"").append(check.observed()).append("\"}");
            }
            return output.append("]}").toString();
        }
    }
    private record Options(Path scratch, Path output) {
        static Options parse(String[] arguments) {
            Path scratch = null, output = null;
            for (int index = 0; index < arguments.length; index += 2) {
                if (index + 1 >= arguments.length) throw new IllegalArgumentException();
                var path = Path.of(arguments[index + 1]);
                if (!path.isAbsolute()) throw new IllegalArgumentException();
                switch (arguments[index]) {
                    case "--scratch" -> { if (scratch != null) throw new IllegalArgumentException(); scratch = path.normalize(); }
                    case "--output" -> { if (output != null) throw new IllegalArgumentException(); output = path.normalize(); }
                    default -> throw new IllegalArgumentException();
                }
            }
            if (scratch == null) throw new IllegalArgumentException();
            return new Options(scratch, output);
        }
    }
    private record SystemAccess(Path scratchDirectory) implements Access {
        public boolean linux() { return System.getProperty("os.name", "").equals("Linux"); }
        public boolean amd64() { return Set.of("amd64", "x86_64").contains(System.getProperty("os.arch", "")); }
        public long pid() { return ProcessHandle.current().pid(); }
        public String read(Control control) { return readFixed(control.path, control == Control.STATUS ? STATUS_BYTES : CONTROL_BYTES); }
        public Scratch scratch() {
            try {
                var real = scratchDirectory.toRealPath(); var store = Files.getFileStore(real);
                return new Scratch(store.type(), store.getTotalSpace(), mountFlags(readFixed("/proc/self/mountinfo", MOUNT_BYTES), real.toString()));
            } catch (Exception error) { return null; }
        }
        private static String readFixed(String path, int maximum) {
            try (var input = Files.newInputStream(Path.of(path), LinkOption.NOFOLLOW_LINKS)) {
                var bytes = input.readNBytes(maximum + 1);
                if (bytes.length == 0 || bytes.length > maximum) return null;
                return new String(bytes, StandardCharsets.US_ASCII);
            } catch (Exception error) { return null; }
        }
        @Override public String toString() { return "ProbeAccess[redacted]"; }
    }
}
