package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class LinuxWorkerMemoryAdmissionTest {
    private static final long GIB = 1024L * 1024 * 1024;
    private static final long MIB = 1024L * 1024;

    @Test void admitsOnlyFiniteOwnedBudgetWithoutChangingAnyLimits() {
        var calls = new AtomicInteger();
        var admission = LinuxWorkerMemoryAdmission.admit(() -> { calls.incrementAndGet(); return valid(); },
            NativeProcessLimits.initial());
        assertThat(calls).hasValue(1);
        admission.requireAvailable();
        assertThat(calls).hasValue(2);
        assertThat(admission.toString()).isEqualTo("LinuxWorkerMemoryAdmission[redacted]");
    }

    @Test void rejectsInsufficientTotalMemoryAndCurrentPressureBeforeStartingChild() {
        invalid(copy(1, "0::/", GIB, 512 * MIB, 0, 64, "tmpfs", 512 * MIB, 3 * GIB, GIB));
        invalid(copy(1, "0::/", 4 * GIB, GIB, 0, 64, "tmpfs", 512 * MIB, 3 * GIB, GIB));
        invalid(copy(1, "0::/", 8 * GIB, 5 * GIB, 0, 64, "tmpfs", 512 * MIB, 3 * GIB, GIB));
    }

    @Test void rejectsForeignScopeSwapUnboundedProcessesOrUnboundedScratch() {
        invalid(copy(2, "0::/", 8 * GIB, GIB, 0, 64, "tmpfs", 512 * MIB, 3 * GIB, GIB));
        invalid(copy(1, "0::/other", 8 * GIB, GIB, 0, 64, "tmpfs", 512 * MIB, 3 * GIB, GIB));
        invalid(copy(1, "0::/", 8 * GIB, GIB, 1, 64, "tmpfs", 512 * MIB, 3 * GIB, GIB));
        invalid(copy(1, "0::/", 8 * GIB, GIB, 0, 65, "tmpfs", 512 * MIB, 3 * GIB, GIB));
        invalid(copy(1, "0::/", 8 * GIB, GIB, 0, 64, "ext4", 512 * MIB, 3 * GIB, GIB));
        invalid(copy(1, "0::/", 8 * GIB, GIB, 0, 64, "tmpfs", 513 * MIB, 3 * GIB, GIB));
    }

    @Test void rejectsParentWithoutFiniteAddressCeilingAndChildOutsidePolicy() {
        invalid(copy(1, "0::/", 8 * GIB, GIB, 0, 64, "tmpfs", 512 * MIB, 4 * GIB, GIB));
        invalid(copy(1, "0::/", 8 * GIB, GIB, 0, 64, "tmpfs", 512 * MIB, 2 * GIB, GIB));
        invalid(copy(1, "0::/", 8 * GIB, GIB, 0, 64, "tmpfs", 512 * MIB, 3 * GIB, 3 * GIB + 1));
        invalid(copy(1, "0::/", 8 * GIB, GIB, 0, 64, "tmpfs", 512 * MIB, 0, GIB));
        assertThatThrownBy(() -> LinuxWorkerMemoryAdmission.admit(() -> valid(),
            new NativeProcessLimits(4 * GIB, 120, 64 * MIB, 128))).isInstanceOf(RenderFileException.class);
        assertThatThrownBy(() -> LinuxWorkerMemoryAdmission.admit(() -> valid(), null)).isInstanceOf(RenderFileException.class);
    }

    @Test void rereadsBudgetAndFailsClosedWhenPressureChangesOrReadingFails() {
        var calls = new AtomicInteger();
        var admission = LinuxWorkerMemoryAdmission.admit(() -> calls.incrementAndGet() == 1 ? valid()
            : copy(1, "0::/", 8 * GIB, 5 * GIB, 0, 64, "tmpfs", 512 * MIB, 3 * GIB, GIB), NativeProcessLimits.initial());
        assertThatThrownBy(admission::requireAvailable).isInstanceOf(RenderFileException.class);
        var secret = "private-job-and-path";
        assertThatThrownBy(() -> LinuxWorkerMemoryAdmission.admit(() -> { throw new IllegalStateException(secret); },
            NativeProcessLimits.initial())).isInstanceOf(RenderFileException.class)
            .hasMessageNotContaining(secret).hasNoCause();
    }

    @Test void controlParserRequiresCanonicalFiniteUnsignedDecimalAndBoundedInput() {
        assertThat(LinuxWorkerMemoryAdmission.finite("8589934592\n", false)).isEqualTo(8 * GIB);
        assertThat(LinuxWorkerMemoryAdmission.finite("0\n", true)).isZero();
        for (var value : new String[] { "max", "-1", "+1", "01", "1 kB", "1\n2", "9223372036854775808", "1".repeat(4097) })
            assertThatThrownBy(() -> LinuxWorkerMemoryAdmission.finite(value, false)).isInstanceOf(RenderFileException.class);
        assertThatThrownBy(() -> LinuxWorkerMemoryAdmission.finite(null, true)).isInstanceOf(RenderFileException.class);
        assertThatThrownBy(() -> LinuxWorkerMemoryAdmission.finite("0", false)).isInstanceOf(RenderFileException.class);
    }

    @Test void procParsersRejectInfiniteMixedUnitsDuplicateAndOverflow() {
        assertThat(LinuxWorkerMemoryAdmission.addressLimit("Max address space 3221225472 3221225472 bytes\n")).isEqualTo(3 * GIB);
        assertThat(LinuxWorkerMemoryAdmission.virtualBytes("VmSize:\t1048576 kB\n")).isEqualTo(GIB);
        for (var value : new String[] { "", "Max address space unlimited unlimited bytes", "Max address space 1 2 bytes",
            "Max address space 1 1 bytes\nMax address space 1 1 bytes", "x".repeat(4097) })
            assertThatThrownBy(() -> LinuxWorkerMemoryAdmission.addressLimit(value)).isInstanceOf(RenderFileException.class);
        for (var value : new String[] { "", "VmSize: 1 MB", "VmSize: 1 kB\nVmSize: 1 kB", "VmSize: 9223372036854775807 kB" })
            assertThatThrownBy(() -> LinuxWorkerMemoryAdmission.virtualBytes(value)).isInstanceOf(RenderFileException.class);
    }

    private static LinuxWorkerMemoryAdmission.Snapshot valid() {
        return copy(1, "0::/", 8 * GIB, GIB, 0, 64, "tmpfs", 512 * MIB, 3 * GIB, GIB);
    }
    private static LinuxWorkerMemoryAdmission.Snapshot copy(long pid, String group, long maximum, long current, long swap,
            long pids, String type, long scratch, long parentLimit, long parentVirtual) {
        return new LinuxWorkerMemoryAdmission.Snapshot(pid, group, maximum, current, swap, pids, type, scratch,
            parentLimit, parentVirtual);
    }
    private static void invalid(LinuxWorkerMemoryAdmission.Snapshot snapshot) {
        assertThatThrownBy(() -> LinuxWorkerMemoryAdmission.admit(() -> snapshot, NativeProcessLimits.initial()))
            .isInstanceOf(RenderFileException.class).hasNoCause();
    }
}
