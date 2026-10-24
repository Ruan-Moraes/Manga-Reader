package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.concurrent.TimeUnit;

/** Only the selected native renderer uses this preparation; it cannot target a host/foreign process. */
final class NativeWorkerParentPreparation {
    private NativeWorkerParentPreparation() { }

    static LinuxWorkerMemoryAdmission prepare(Path directory, NativeProcessLimits limits) {
        Path staging = null;
        try {
            LinuxNativeProcessGuard.requirePlatform();
            NativeCodecPlatform.runtime().requireParentEnvironment(System.getenv());
            LinuxOomPolicy.requireSupervisor();
            var real = directory.toRealPath();
            LinuxWorkerMemoryAdmission.requirePreparationEnvironment(real, limits);
            try { return LinuxWorkerMemoryAdmission.admit(real, limits); }
            catch (RenderFileException notPrepared) {
                // An inherited, confirmed cap needs no helper. Unlimited/invalid cap must never be silently accepted.
            }
            staging = Files.createTempDirectory(real, "render-parent-",
                PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")));
            runOwnedHelper(staging, owned -> RenderJvmLauncher.parentLimiter(owned).start());
            // The file is not authority: the parent must independently observe its real kernel limit.
            return LinuxWorkerMemoryAdmission.admit(real, limits);
        } catch (Throwable ignored) { throw unavailable(); }
        finally {
            if (staging != null) {
                try {
                    Files.deleteIfExists(staging.resolve(NativeWorkerParentLimitMain.CONFIRMATION));
                    Files.delete(staging);
                } catch (IOException | RuntimeException ignored) { throw unavailable(); }
            }
        }
    }

    static void runOwnedHelper(Path directory, HelperLauncher launcher) {
        Process process = null;
        try {
            process = launcher.start(directory);
            process.getOutputStream().close();
            if (!process.waitFor(10, TimeUnit.SECONDS) || process.exitValue() != 0) throw unavailable();
            try (var input = Files.newInputStream(directory.resolve(NativeWorkerParentLimitMain.CONFIRMATION), LinkOption.NOFOLLOW_LINKS)) {
                NativeWorkerParentLimitMain.confirm(input.readNBytes(13));
            }
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt(); throw unavailable();
        } catch (IOException | RuntimeException ignored) { throw unavailable(); }
        finally { if (process != null) stopOwnedHelper(process); }
    }

    private static void stopOwnedHelper(Process process) {
        boolean interrupted = Thread.interrupted();
        try {
            try { process.destroyForcibly(); }
            finally {
                while (true) {
                    try { process.waitFor(); break; }
                    catch (InterruptedException ignored) { interrupted = true; }
                }
            }
        } catch (RuntimeException ignored) { throw unavailable(); }
        finally { if (interrupted) Thread.currentThread().interrupt(); }
    }

    private static RenderFileException unavailable() { return new RenderFileException(CONFIGURATION); }
    @FunctionalInterface interface HelperLauncher { Process start(Path directory) throws IOException; }
}
