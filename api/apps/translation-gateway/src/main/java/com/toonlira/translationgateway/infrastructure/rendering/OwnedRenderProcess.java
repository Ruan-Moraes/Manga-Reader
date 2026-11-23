package com.toonlira.translationgateway.infrastructure.rendering;

import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.LockSupport;

/** Capacity stays owned until the directly launched JVM and observed descendants have terminated. */
final class OwnedRenderProcess {
    private OwnedRenderProcess() { }
    static void stop(Process process, Set<ProcessHandle> descendants) {
        boolean interrupted = Thread.interrupted();
        try {
            try { if (process.isAlive()) descendants.addAll(process.descendants().toList()); }
            catch (RuntimeException ignored) { /* Always terminate the directly owned process. */ }
            finally { process.destroyForcibly(); }
            descendants.forEach(child -> { if (child.isAlive()) child.destroyForcibly(); });
            while (true) {
                try { process.waitFor(); break; }
                catch (InterruptedException error) { interrupted = true; }
            }
            while (descendants.stream().anyMatch(ProcessHandle::isAlive)) {
                descendants.forEach(child -> { if (child.isAlive()) child.destroyForcibly(); });
                LockSupport.parkNanos(TimeUnit.MILLISECONDS.toNanos(20));
                interrupted |= Thread.interrupted();
            }
        } finally { if (interrupted) Thread.currentThread().interrupt(); }
    }
}
