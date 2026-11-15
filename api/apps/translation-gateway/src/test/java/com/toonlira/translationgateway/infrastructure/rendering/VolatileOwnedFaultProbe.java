package com.toonlira.translationgateway.infrastructure.rendering;

import static java.lang.foreign.ValueLayout.ADDRESS;
import static java.lang.foreign.ValueLayout.JAVA_INT;
import static java.lang.foreign.ValueLayout.JAVA_LONG;

import java.lang.foreign.Arena;
import java.lang.foreign.FunctionDescriptor;
import java.lang.foreign.Linker;
import java.lang.foreign.MemorySegment;
import java.lang.invoke.MethodHandle;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

/** Linux fault injection in the mounted test driver only; never packaged in the production JAR. */
final class VolatileOwnedFaultProbe {
    private static final MethodHandle KILL = Linker.nativeLinker().downcallHandle(
        Linker.nativeLinker().defaultLookup().find("kill").orElseThrow(), FunctionDescriptor.of(JAVA_INT, JAVA_INT, JAVA_INT));
    private static final MethodHandle PRLIMIT = Linker.nativeLinker().downcallHandle(
        Linker.nativeLinker().defaultLookup().find("prlimit64").orElseThrow(), FunctionDescriptor.of(JAVA_INT, JAVA_INT, JAVA_INT, ADDRESS, ADDRESS));
    private VolatileOwnedFaultProbe() { }
    static void pause(ProcessHandle child) {
        requireOwned(child);
        signal(child, 19); // Linux SIGSTOP, deliberately non-cooperative child for the real native deadline.
    }
    static void exhaustAddressSpace(ProcessHandle child) {
        requireOwned(child);
        signal(child, 19);
        try (var arena = Arena.ofConfined()) {
            long bytes = LinuxWorkerMemoryAdmission.virtualBytes(Files.readString(Path.of("/proc/" + child.pid() + "/status")));
            if (bytes <= 0 || bytes >= 3L * 1024 * 1024 * 1024) throw new IllegalStateException();
            var limit = arena.allocate(16, 8);
            limit.set(JAVA_LONG, 0, bytes); limit.set(JAVA_LONG, 8, bytes);
            if ((int) PRLIMIT.invokeExact(Math.toIntExact(child.pid()), 9, limit, MemorySegment.NULL) != 0) throw new IllegalStateException();
        } catch (Throwable failure) { throw new IllegalStateException("owned-synthetic-address-fault-unavailable"); }
        finally { signal(child, 18); } // SIGCONT: next native allocation must fail within the owned child.
    }
    private static void requireOwned(ProcessHandle child) {
        if (!"Linux".equals(System.getProperty("os.name")) || child.parent().map(ProcessHandle::pid).orElse(-1L) != ProcessHandle.current().pid()
            || !child.info().arguments().map(args -> Arrays.asList(args).contains("-Dloader.main=" + VolatileRenderChildMain.class.getName())).orElse(false))
            throw new IllegalArgumentException("not-an-owned-native-fixture-child");
    }
    private static void signal(ProcessHandle child, int signal) {
        try { if ((int) KILL.invokeExact(Math.toIntExact(child.pid()), signal) != 0) throw new IllegalStateException(); }
        catch (Throwable failure) { throw new IllegalStateException("owned-synthetic-signal-unavailable"); }
    }
}
