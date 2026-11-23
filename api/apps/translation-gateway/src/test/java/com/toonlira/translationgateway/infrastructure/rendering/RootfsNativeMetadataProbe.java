package com.toonlira.translationgateway.infrastructure.rendering;

import java.lang.foreign.Arena;
import java.lang.foreign.FunctionDescriptor;
import java.lang.foreign.Linker;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.MemoryLayout;
import java.lang.foreign.ValueLayout;
import java.lang.invoke.MethodHandle;
import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.UserDefinedFileAttributeView;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

/** Test-only Linux metadata reader. No attribute mutation, file payload read, Spring, credentials or provider. */
public final class RootfsNativeMetadataProbe {
    private static final int MAX_ENTRIES = 10000, MAX_PATH_BYTES = 4096, MAX_LIST_BYTES = 2 * 1024 * 1024;
    private static final int MAX_ATTRIBUTE_BYTES = 65536, MAX_ATTRIBUTES = 256, MAX_REPORT_BYTES = 4 * 1024 * 1024;
    private static final int ATTRIBUTE_RECORD_BYTES = 128;
    private static final Set<PosixFilePermission> WRITABLE = Set.of(PosixFilePermission.OWNER_WRITE,
        PosixFilePermission.GROUP_WRITE, PosixFilePermission.OTHERS_WRITE);
    private RootfsNativeMetadataProbe() { }

    public static void main(String[] arguments) {
        NativeAccess observed = null;
        String phase = "arguments";
        try {
            require((arguments.length == 0 || arguments.length == 1 && arguments[0].equals("--self-check"))
                && System.getProperty("os.name").equals("Linux"));
            phase = "runtime-controls";
            String status = control("/proc/self/status", 16384);
            require(status.matches("(?s).*\nCapEff:\\s+0{16}\n.*") && status.matches("(?s).*\nNoNewPrivs:\\s+1\n.*"));
            if (arguments.length == 1) { selfCheck(); return; }
            phase = "path-list-open";
            var source = Path.of("/audit/paths.list");
            require(Files.isRegularFile(source, LinkOption.NOFOLLOW_LINKS)
                && Files.getPosixFilePermissions(source, LinkOption.NOFOLLOW_LINKS).stream().noneMatch(WRITABLE::contains));
            byte[] bytes;
            try (var input = Files.newInputStream(source)) { bytes = input.readNBytes(MAX_LIST_BYTES + 1); }
            require(bytes.length > 0 && bytes.length <= MAX_LIST_BYTES);
            phase = "path-list-decode";
            var paths = new ArrayList<String>();
            String text = decode(bytes);
            require(text.endsWith("\n"));
            for (var line : text.substring(0, text.length() - 1).split("\n", -1)) {
                var decoded = Base64.getDecoder().decode(line);
                require(Base64.getEncoder().encodeToString(decoded).equals(line)); paths.add(decode(decoded));
            }
            phase = "native-init";
            var access = new NativeAccess(); observed = access;
            int uid = expectedUid(); require(access.uid() == uid);
            String architecture = switch (System.getProperty("os.arch")) {
                case "aarch64" -> "arm64";
                case "amd64" -> "amd64";
                default -> throw unavailable();
            };
            phase = "scan";
            var result = scan(paths, access);
            phase = "report";
            Files.write(Path.of("/work/metadata.json"), report(result, hash(bytes), architecture, List.copyOf(access.gaps.values()), uid), StandardOpenOption.CREATE_NEW);
            System.out.println("{\"status\":\"visible-metadata-read-not-security-approved\",\"entries\":" + result.entries() + "}");
        } catch (Throwable ignored) {
            try {
                var details = observed != null && observed.failure != null ? observed.failure :
                    ("{\"format\":\"rootfs-validation-failure-1\",\"phase\":\"" + phase + "\",\"pathSha256\":\""
                    + (observed != null && observed.lastPath != null ? hash(observed.lastPath.getBytes(StandardCharsets.UTF_8)) : "")
                    + "\",\"listQueryBytes\":" + (observed == null ? -1 : observed.listQueryBytes)
                    + ",\"listReadBytes\":" + (observed == null ? -1 : observed.listReadBytes)
                    + ",\"securityApproved\":false}\n").getBytes(StandardCharsets.UTF_8);
                Files.write(Path.of("/work/failure.json"), details, StandardOpenOption.CREATE_NEW);
            } catch (Exception unavailable) { /* A diagnostic failure does not fabricate a successful scan. */ }
            System.err.println("rootfs-metadata-unavailable"); System.exit(1);
        }
    }

    static byte[] failureReport(String path, String operation, int errno) {
        try {
            validatePath(path); require(Set.of("list-query", "list-read", "value-query", "value-read").contains(operation) && errno > 0 && errno < 4096);
            return ("{\"format\":\"rootfs-native-failure-1\",\"pathSha256\":\"" + hash(path.getBytes(StandardCharsets.UTF_8))
                + "\",\"operation\":\"" + operation + "\",\"errno\":" + errno + ",\"securityApproved\":false}\n").getBytes(StandardCharsets.UTF_8);
        } catch (Throwable ignored) { throw unavailable(); }
    }

    private static void selfCheck() throws Exception {
        var file = Path.of("/work/fixture");
        var link = Path.of("/work/fixture-link");
        Files.write(file, new byte[0], StandardOpenOption.CREATE_NEW);
        Files.createSymbolicLink(link, file);
        byte[] value = {0, (byte) 255, 10, 61};
        var view = Files.getFileAttributeView(file, UserDefinedFileAttributeView.class, LinkOption.NOFOLLOW_LINKS);
        require(view != null && view.write("fixture", ByteBuffer.wrap(value)) == value.length);
        var access = new NativeAccess(); require(access.uid() == expectedUid());
        var result = scan(List.of("work/fixture", "work/fixture-link"), access);
        String expected = hash(value);
        require(result.attributes().get("work/fixture").stream().anyMatch(attribute -> attribute.name().equals("user.fixture")
            && attribute.sha256().equals(expected)));
        require(!result.attributes().containsKey("work/fixture-link"));
        Files.write(Path.of("/work/self-check.json"), ("{\"format\":\"rootfs-native-self-check-1\",\"binaryValueMatched\":true,"
            + "\"symlinkNotFollowed\":true,\"securityApproved\":false}\n").getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE_NEW);
        System.out.println("{\"status\":\"native-self-check-passed-not-security-approved\"}");
    }

    static Snapshot scan(List<String> suppliedPaths, Access access) {
        try {
            require(access != null && suppliedPaths != null && !suppliedPaths.isEmpty() && suppliedPaths.size() <= MAX_ENTRIES);
            var paths = List.copyOf(suppliedPaths);
            var unique = new TreeSet<String>(); int pathBytes = 0;
            for (var path : paths) {
                validatePath(path); require(unique.add(path)); pathBytes = Math.addExact(pathBytes, path.getBytes(StandardCharsets.UTF_8).length + 1);
                require(pathBytes <= MAX_LIST_BYTES);
            }
            var digest = MessageDigest.getInstance("SHA-256");
            var attributes = new LinkedHashMap<String, List<Attribute>>(); long totalBytes = pathBytes;
            for (var path : unique) {
                var names = checkedNames(access.names(path)); var values = new ArrayList<Attribute>();
                update(digest, path);
                for (var name : names) {
                    var value = access.value(path, name);
                    require(value != null && value.length <= MAX_ATTRIBUTE_BYTES);
                    String valueHash = hash(value);
                    totalBytes = Math.addExact(totalBytes, value.length + name.getBytes(StandardCharsets.UTF_8).length + ATTRIBUTE_RECORD_BYTES);
                    require(totalBytes <= MAX_REPORT_BYTES);
                    var again = access.value(path, name); require(again != null && again.length <= MAX_ATTRIBUTE_BYTES && hash(again).equals(valueHash));
                    values.add(new Attribute(name, valueHash, value.length)); update(digest, name); update(digest, valueHash);
                }
                require(names.equals(checkedNames(access.names(path))));
                if (!values.isEmpty()) attributes.put(path, List.copyOf(values));
            }
            return new Snapshot(unique.size(), Map.copyOf(attributes), HexFormat.of().formatHex(digest.digest()));
        } catch (Throwable ignored) { throw unavailable(); }
    }

    static byte[] report(Snapshot result, String pathListSha256, String architecture) {
        return report(result, pathListSha256, architecture, List.of());
    }
    static byte[] report(Snapshot result, String pathListSha256, String architecture, List<ListGap> suppliedGaps) {
        return report(result,pathListSha256,architecture,suppliedGaps,0);
    }
    static byte[] report(Snapshot result, String pathListSha256, String architecture, List<ListGap> suppliedGaps, int uid) {
        try {
            require(uid == 0 || uid == 1000);
            require(result != null && pathListSha256 != null && pathListSha256.matches("[a-f0-9]{64}") && Set.of("arm64", "amd64").contains(architecture));
            var json = new StringBuilder("{\"format\":\"rootfs-visible-native-metadata-1\",\"architecture\":\"").append(architecture)
                .append("\",\"entries\":").append(result.entries()).append(",\"pathListSha256\":\"").append(pathListSha256)
                .append("\",\"metadataSha256\":\"").append(result.metadataSha256())
                .append("\",\"uid\":").append(uid).append(",\"effectiveCapabilities\":\"0000000000000000\",\"trustedNamespaceVerified\":false,\"absenceOfAllAttributesProven\":false,\"securityApproved\":false,\"attributes\":[");
            boolean firstPath = true;
            for (var path : new TreeSet<>(result.attributes().keySet())) {
                if (!firstPath) json.append(','); firstPath = false;
                json.append("{\"pathBase64\":\"").append(encoded(path)).append("\",\"values\":["); boolean firstAttribute = true;
                for (var attribute : result.attributes().get(path)) {
                    if (!firstAttribute) json.append(','); firstAttribute = false;
                    json.append("{\"nameBase64\":\"").append(encoded(attribute.name())).append("\",\"sha256\":\"")
                        .append(attribute.sha256()).append("\",\"bytes\":").append(attribute.bytes()).append('}');
                }
                json.append("]}"); require(json.length() <= MAX_REPORT_BYTES);
            }
            json.append("],\"listGaps\":[");
            require(suppliedGaps != null && suppliedGaps.size() <= MAX_ENTRIES);
            boolean firstGap = true;
            for (var gap : List.copyOf(suppliedGaps)) {
                validatePath(gap.path()); checkedListRead(gap.queryBytes(),gap.readBytes()); require(gap.readBytes() < gap.queryBytes());
                if (!firstGap) json.append(','); firstGap = false;
                json.append("{\"pathBase64\":\"").append(encoded(gap.path())).append("\",\"queryBytes\":").append(gap.queryBytes())
                    .append(",\"readBytes\":").append(gap.readBytes()).append('}'); require(json.length() <= MAX_REPORT_BYTES);
            }
            var bytes = json.append("]}\n").toString().getBytes(StandardCharsets.UTF_8);
            require(bytes.length <= MAX_REPORT_BYTES); return bytes;
        } catch (Throwable ignored) { throw unavailable(); }
    }

    static int checkedListRead(long declared, long copied) {
        require(declared >= 0 && declared <= MAX_ATTRIBUTE_BYTES && copied >= 0 && copied <= declared);
        return (int) copied;
    }

    private static List<String> checkedNames(List<String> supplied) {
        require(supplied != null && supplied.size() <= MAX_ATTRIBUTES);
        var names = new TreeSet<String>();
        for (var name : supplied) {
            require(name != null && name.getBytes(StandardCharsets.UTF_8).length <= 255 && !name.matches("(?s).*[\\x00-\\x1f\\x7f].*")
                && name.matches("(?:user|trusted|system|security)\\..+") && names.add(name));
        }
        return List.copyOf(names);
    }
    private static void validatePath(String path) {
        require(path != null && !path.isEmpty() && path.getBytes(StandardCharsets.UTF_8).length <= MAX_PATH_BYTES
            && !path.startsWith("/") && !path.matches("(?s).*[\\x00-\\x1f\\x7f].*"));
        if (path.equals(".")) return;
        for (var component : path.split("/", -1)) require(!component.isEmpty() && !component.equals(".") && !component.equals(".."));
    }
    private static String control(String path, int limit) throws Exception {
        try (var input = Files.newInputStream(Path.of(path))) {
            var bytes = input.readNBytes(limit + 1); require(bytes.length > 0 && bytes.length <= limit); return decode(bytes);
        }
    }
    private static String decode(byte[] bytes) throws Exception {
        return StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
            .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes)).toString();
    }
    private static String encoded(String value) { return Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8)); }
    private static int expectedUid() {
        String value = System.getProperty("rootfs.metadata.expected.uid", "0"); require(value.equals("0") || value.equals("1000")); return Integer.parseInt(value);
    }
    private static String hash(byte[] bytes) throws Exception { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
    private static void update(MessageDigest digest, String value) { digest.update(value.getBytes(StandardCharsets.UTF_8)); digest.update((byte) 0); }
    private static void require(boolean value) { if (!value) throw unavailable(); }
    private static IllegalStateException unavailable() { return new IllegalStateException("rootfs-metadata-unavailable"); }

    interface Access { List<String> names(String path); byte[] value(String path, String name); }
    record Attribute(String name, String sha256, int bytes) { @Override public String toString() { return "Attribute[redacted]"; } }
    record ListGap(String path, long queryBytes, long readBytes) { @Override public String toString() { return "ListGap[redacted]"; } }
    record Snapshot(int entries, Map<String, List<Attribute>> attributes, String metadataSha256) {
        @Override public String toString() { return "Snapshot[redacted]"; }
    }

    private static final class NativeAccess implements Access {
        private final MethodHandle list, get, uid;
        private final MemoryLayout capture = Linker.Option.captureStateLayout();
        private final long errnoOffset = capture.byteOffset(MemoryLayout.PathElement.groupElement("errno"));
        private byte[] failure;
        private String lastPath;
        private final Map<String,ListGap> gaps = new LinkedHashMap<>();
        private long listQueryBytes = -1, listReadBytes = -1;
        NativeAccess() {
            var linker = Linker.nativeLinker();
            require(linker.canonicalLayouts().get("size_t").byteSize() == 8 && linker.canonicalLayouts().get("long").byteSize() == 8);
            list = linker.downcallHandle(linker.defaultLookup().findOrThrow("llistxattr"),
                FunctionDescriptor.of(ValueLayout.JAVA_LONG, ValueLayout.ADDRESS, ValueLayout.ADDRESS, ValueLayout.JAVA_LONG), Linker.Option.captureCallState("errno"));
            get = linker.downcallHandle(linker.defaultLookup().findOrThrow("lgetxattr"),
                FunctionDescriptor.of(ValueLayout.JAVA_LONG, ValueLayout.ADDRESS, ValueLayout.ADDRESS, ValueLayout.ADDRESS, ValueLayout.JAVA_LONG), Linker.Option.captureCallState("errno"));
            uid = linker.downcallHandle(linker.defaultLookup().findOrThrow("getuid"), FunctionDescriptor.of(ValueLayout.JAVA_INT));
        }
        int uid() { try { return (int) uid.invokeExact(); } catch (Throwable ignored) { throw unavailable(); } }
        @Override public List<String> names(String relative) {
            lastPath = relative;
            try (var arena = Arena.ofConfined()) {
                var path = arena.allocateFrom(relative.equals(".") ? "/" : "/" + relative);
                var state = arena.allocate(capture);
                long size = (long) list.invokeExact(state, path, MemorySegment.NULL, 0L); listQueryBytes = size;
                checkNative(size, state, relative, "list-query"); require(size <= MAX_ATTRIBUTE_BYTES);
                if (size == 0) return List.of();
                var buffer = arena.allocate(size);
                long read = (long) list.invokeExact(state, path, buffer, size); listReadBytes = read;
                checkNative(read, state, relative, "list-read");
                int copied = checkedListRead(size, read);
                if (read < size) {
                    var gap = new ListGap(relative,size,read);
                    var previous = gaps.putIfAbsent(relative,gap);
                    require(previous == null || previous.equals(gap));
                }
                if (copied == 0) return List.of();
                var bytes = buffer.asSlice(0,copied).toArray(ValueLayout.JAVA_BYTE); require(bytes[bytes.length - 1] == 0);
                var result = new ArrayList<String>(); int from = 0;
                for (int i = 0; i < bytes.length; i++) if (bytes[i] == 0) {
                    require(i > from); result.add(decode(Arrays.copyOfRange(bytes, from, i))); from = i + 1;
                }
                return checkedNames(result);
            } catch (Throwable ignored) { throw unavailable(); }
        }
        @Override public byte[] value(String relative, String name) {
            lastPath = relative;
            try (var arena = Arena.ofConfined()) {
                var path = arena.allocateFrom(relative.equals(".") ? "/" : "/" + relative);
                var attribute = arena.allocateFrom(name);
                var state = arena.allocate(capture);
                long size = (long) get.invokeExact(state, path, attribute, MemorySegment.NULL, 0L); checkNative(size, state, relative, "value-query"); require(size <= MAX_ATTRIBUTE_BYTES);
                if (size == 0) return new byte[0];
                var buffer = arena.allocate(size);
                long read = (long) get.invokeExact(state, path, attribute, buffer, size); checkNative(read, state, relative, "value-read"); require(read == size); return buffer.toArray(ValueLayout.JAVA_BYTE);
            } catch (Throwable ignored) { throw unavailable(); }
        }
        private void checkNative(long result, MemorySegment state, String path, String operation) {
            if (result < 0) { failure = failureReport(path, operation, state.get(ValueLayout.JAVA_INT, errnoOffset)); throw unavailable(); }
        }
    }
}
