package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import java.lang.foreign.Arena;
import java.lang.foreign.FunctionDescriptor;
import java.lang.foreign.Linker;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.ValueLayout;
import java.lang.invoke.MethodHandle;

/** Self-only Linux LP64 limits before decode. No privileges, child cgroup, RSS limit or parent native load. */
final class LinuxNativeProcessGuard {
    private static final int CPU = 0, FILE_SIZE = 1, CORE = 4, OPEN_FILES = 7, ADDRESS_SPACE = 9;
    private static final int GET_DUMPABLE = 3, SET_DUMPABLE = 4;
    private static final long LIMIT_PAIR_BYTES = 16, HARD_LIMIT_OFFSET = 8;

    private LinuxNativeProcessGuard() { }

    static void requirePlatform() {
        NativeCodecPlatform.runtime();
    }

    static void apply(NativeProcessLimits policy) {
        requirePlatform();
        try (var access = new NativeAccess()) { apply(policy, access); }
        catch (Throwable error) { throw new RenderFileException(CONFIGURATION); }
    }

    static void apply(NativeProcessLimits policy, Access access) {
        try {
            if (policy == null || access == null) throw new RenderFileException(CONFIGURATION);
            access.prepareChildOom();
            access.disableDumping();
            if (access.dumpability() != 0) throw new RenderFileException(CONFIGURATION);
            tighten(access, CORE, 0);
            tighten(access, OPEN_FILES, policy.openFiles());
            tighten(access, CPU, policy.cpuSeconds());
            tighten(access, FILE_SIZE, policy.fileBytes());
            tighten(access, ADDRESS_SPACE, policy.addressSpaceBytes());
        } catch (Throwable error) { throw new RenderFileException(CONFIGURATION); }
    }

    private static void tighten(Access access, int resource, long ceiling) {
        var previous = access.read(resource);
        var actual = minimumUnsigned(ceiling, minimumUnsigned(previous.soft(), previous.hard()));
        var tightened = new Limits(actual, actual);
        access.write(resource, tightened);
        if (!tightened.equals(access.read(resource))) throw new RenderFileException(CONFIGURATION);
    }

    private static long minimumUnsigned(long first, long second) {
        return Long.compareUnsigned(first, second) <= 0 ? first : second;
    }

    interface Access {
        void prepareChildOom();
        void disableDumping();
        int dumpability();
        Limits read(int resource);
        void write(int resource, Limits limits);
    }
    record Limits(long soft, long hard) { }

    private static final class NativeAccess implements Access, AutoCloseable {
        private final Arena arena;
        private final MemorySegment pair;
        private final MethodHandle getter, setter, processControl;

        NativeAccess() {
            var linker = Linker.nativeLinker();
            if (linker.canonicalLayouts().get("long").byteSize() != Long.BYTES
                || linker.canonicalLayouts().get("int").byteSize() != Integer.BYTES)
                throw new RenderFileException(CONFIGURATION);
            var descriptor = FunctionDescriptor.of(ValueLayout.JAVA_INT, ValueLayout.JAVA_INT, ValueLayout.ADDRESS);
            getter = linker.downcallHandle(linker.defaultLookup().findOrThrow("getrlimit"), descriptor);
            setter = linker.downcallHandle(linker.defaultLookup().findOrThrow("setrlimit"), descriptor);
            // libc prctl is variadic: unused parameters must have the native unsigned-long width, not int zero.
            processControl = linker.downcallHandle(linker.defaultLookup().findOrThrow("prctl"),
                FunctionDescriptor.of(ValueLayout.JAVA_INT, ValueLayout.JAVA_INT, ValueLayout.JAVA_LONG,
                    ValueLayout.JAVA_LONG, ValueLayout.JAVA_LONG, ValueLayout.JAVA_LONG), Linker.Option.firstVariadicArg(1));
            arena = Arena.ofConfined();
            pair = arena.allocate(LIMIT_PAIR_BYTES, Long.BYTES);
        }

        @Override public void prepareChildOom() { LinuxOomPolicy.prepareChild(); }

        @Override public void disableDumping() {
            if (control(SET_DUMPABLE) != 0) throw new RenderFileException(CONFIGURATION);
        }

        @Override public int dumpability() { return control(GET_DUMPABLE); }

        private int control(int operation) {
            try { return (int) processControl.invokeExact(operation, 0L, 0L, 0L, 0L); }
            catch (Throwable error) { throw new RenderFileException(CONFIGURATION); }
        }

        @Override public Limits read(int resource) {
            try {
                if ((int) getter.invokeExact(resource, pair) != 0) throw new RenderFileException(CONFIGURATION);
                return new Limits(pair.get(ValueLayout.JAVA_LONG, 0), pair.get(ValueLayout.JAVA_LONG, HARD_LIMIT_OFFSET));
            } catch (Throwable error) { throw new RenderFileException(CONFIGURATION); }
        }

        @Override public void write(int resource, Limits limits) {
            try {
                pair.set(ValueLayout.JAVA_LONG, 0, limits.soft());
                pair.set(ValueLayout.JAVA_LONG, HARD_LIMIT_OFFSET, limits.hard());
                if ((int) setter.invokeExact(resource, pair) != 0) throw new RenderFileException(CONFIGURATION);
            } catch (Throwable error) { throw new RenderFileException(CONFIGURATION); }
        }

        @Override public void close() { arena.close(); }
    }
}
