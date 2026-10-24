package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

/** Private cgroup v2 admission and self-only child victim preference; not a quota or universal OOM sandbox. */
final class LinuxOomPolicy {
    private static final int MAX_CONTROL_BYTES = 4096;
    private static final int MIN_ADJUSTMENT = -1000, MAX_ADJUSTMENT = 1000;
    private static final Path NAMESPACE = Path.of("/proc/self/cgroup");
    private static final Path GROUP = Path.of("/sys/fs/cgroup/memory.oom.group");
    private static final Path ADJUSTMENT = Path.of("/proc/self/oom_score_adj");
    private LinuxOomPolicy() { }

    static void requireSupervisor() { requireSupervisor(new SystemAccess()); }
    static void prepareChild() { prepareChild(new SystemAccess()); }
    static int selfAdjustment() {
        try { return adjustment(new SystemAccess().adjustment()); }
        catch (Throwable error) { throw new RenderFileException(CONFIGURATION); }
    }

    static void requireSupervisor(Access access) {
        try {
            requirePrivateUngroupedCgroup(access);
            if (adjustment(access.adjustment()) > 0) invalid();
        } catch (Throwable error) { throw new RenderFileException(CONFIGURATION); }
    }

    static void prepareChild(Access access) {
        try {
            requirePrivateUngroupedCgroup(access);
            adjustment(access.adjustment());
            // Raising only this process is unprivileged; never lower a supervisor/third-party score or disable the killer.
            access.preferSelf();
            if (adjustment(access.adjustment()) != MAX_ADJUSTMENT) invalid();
        } catch (Throwable error) { throw new RenderFileException(CONFIGURATION); }
    }

    private static void requirePrivateUngroupedCgroup(Access access) {
        if (access == null || !"0::/".equals(bounded(access.namespace())) || !"0".equals(bounded(access.group()))) invalid();
    }

    private static int adjustment(String value) {
        value = bounded(value);
        if (!value.matches("-?(0|[1-9][0-9]{0,3})")) { invalid(); }
        int number = Integer.parseInt(value);
        if (number < MIN_ADJUSTMENT || number > MAX_ADJUSTMENT) invalid();
        return number;
    }

    private static String bounded(String value) {
        if (value == null || value.length() > MAX_CONTROL_BYTES) { invalid(); }
        return value.strip();
    }

    private static void invalid() { throw new RenderFileException(CONFIGURATION); }

    interface Access {
        String namespace();
        String group();
        String adjustment();
        void preferSelf();
    }

    private static final class SystemAccess implements Access {
        @Override public String namespace() { return read(NAMESPACE); }
        @Override public String group() { return read(GROUP); }
        @Override public String adjustment() { return read(ADJUSTMENT); }
        @Override public void preferSelf() {
            var value = ByteBuffer.wrap(Integer.toString(MAX_ADJUSTMENT).getBytes(StandardCharsets.US_ASCII));
            try (var output = FileChannel.open(ADJUSTMENT, StandardOpenOption.WRITE, LinkOption.NOFOLLOW_LINKS)) {
                if (output.write(value) != value.capacity()) invalid();
            } catch (Exception error) { throw new RenderFileException(CONFIGURATION); }
        }
        private static String read(Path path) {
            try (var input = Files.newInputStream(path, LinkOption.NOFOLLOW_LINKS)) {
                var bytes = input.readNBytes(MAX_CONTROL_BYTES + 1);
                if (bytes.length > MAX_CONTROL_BYTES) invalid();
                return new String(bytes, StandardCharsets.US_ASCII);
            } catch (Exception error) { throw new RenderFileException(CONFIGURATION); }
        }
    }
}
