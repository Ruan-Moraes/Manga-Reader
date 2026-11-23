package com.toonlira.translationgateway.infrastructure.rendering;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.LinkedHashMap;
import java.util.Map;

/** Test-only allowlist of actual OS counters. Missing counters stay null, never invented zeroes. */
final class RenderResourceMetrics {
    private static final int MAX_BYTES = 4096;
    private RenderResourceMetrics() { }

    static void write(Path work, Path export, long started, String outcome, String failure,
                      RenderSource source, Map<String, Object> details) throws Exception {
        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("outcome", outcome); metrics.put("failure", failure);
        metrics.put("elapsedNanos", System.nanoTime() - started);
        metrics.put("memoryLimitBytes", number(Path.of("/sys/fs/cgroup/memory.max")));
        metrics.put("swapLimitBytes", number(Path.of("/sys/fs/cgroup/memory.swap.max")));
        metrics.put("memoryPeakBytes", number(Path.of("/sys/fs/cgroup/memory.peak")));
        metrics.put("oomGroup", number(Path.of("/sys/fs/cgroup/memory.oom.group")));
        metrics.put("oomKillCount", event("oom_kill"));
        metrics.put("oomGroupKillCount", event("oom_group_kill"));
        metrics.put("pidsLimit", number(Path.of("/sys/fs/cgroup/pids.max")));
        metrics.put("jvmPeakRssKiB", peakRss());
        metrics.put("scratchCapacityBytes", Files.getFileStore(work).getTotalSpace());
        metrics.put("scratchUsableBytes", Files.getFileStore(work).getUsableSpace());
        metrics.put("javaVersion", Runtime.version().toString());
        metrics.put("widthPx", source == null ? null : source.widthPx());
        metrics.put("heightPx", source == null ? null : source.heightPx());
        metrics.put("originalBytes", source == null ? null : source.byteSize());
        metrics.put("originalSha256", source == null ? null : source.sha256());
        metrics.putAll(details);
        var bytes = GatewayJsonMapper.create().writeValueAsBytes(metrics);
        if (bytes.length > MAX_BYTES) throw new IllegalArgumentException();
        Files.write(export.resolve("resource-metrics.json"), bytes, StandardOpenOption.CREATE_NEW);
    }

    private static Long number(Path path) {
        try {
            String value = bounded(path).strip();
            return value.matches("[0-9]{1,19}") ? Long.valueOf(value) : null;
        } catch (Exception ignored) { return null; }
    }

    private static Long peakRss() {
        try {
            for (var line : bounded(Path.of("/proc/self/status")).lines().toList()) {
                if (line.matches("VmHWM:\\s+[0-9]+\\s+kB")) return Long.valueOf(line.split("\\s+")[1]);
            }
        } catch (Exception ignored) { }
        return null;
    }

    private static Long event(String key) {
        try { return eventCount(bounded(Path.of("/sys/fs/cgroup/memory.events")), key); }
        catch (Exception ignored) { return null; }
    }

    static Long eventCount(String value, String key) {
        if (value == null || value.length() > MAX_BYTES || !("oom_kill".equals(key) || "oom_group_kill".equals(key))) return null;
        Long result = null;
        try {
            for (String line : value.lines().toList()) {
                if (!line.matches("[a-z_]+ [0-9]{1,19}")) return null;
                if (line.startsWith(key + " ")) {
                    if (result != null) return null;
                    result = Long.valueOf(line.substring(key.length() + 1));
                }
            }
            return result;
        } catch (NumberFormatException ignored) { return null; }
    }

    private static String bounded(Path path) throws Exception {
        try (var input = Files.newInputStream(path)) {
            var bytes = input.readNBytes(MAX_BYTES + 1);
            if (bytes.length > MAX_BYTES) throw new IllegalArgumentException();
            return new String(bytes, StandardCharsets.US_ASCII);
        }
    }
}
