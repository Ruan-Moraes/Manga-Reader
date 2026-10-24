package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class NativeProcessLimitsTest {
    @Test void policyIsFiniteAndCannotIncreaseBeyondTheExperimentalBudget() {
        var policy = NativeProcessLimits.initial();
        assertThat(policy.addressSpaceBytes()).isEqualTo(3L * 1024 * 1024 * 1024);
        assertThat(policy.cpuSeconds()).isEqualTo(120);
        assertThat(policy.fileBytes()).isEqualTo(64L * 1024 * 1024);
        assertThat(policy.openFiles()).isEqualTo(128);
        assertThat(policy.toString()).isEqualTo("NativeProcessLimits[bounded]");
        for (long bytes : new long[]{0, 64L * 1024 * 1024 - 1, 4L * 1024 * 1024 * 1024 + 1})
            assertThatThrownBy(() -> new NativeProcessLimits(bytes, 1, 1024, 32))
                .hasMessage("render-configuration").hasNoCause();
        for (long seconds : new long[]{0, 121})
            assertThatThrownBy(() -> new NativeProcessLimits(policy.addressSpaceBytes(), seconds, 1024, 32))
                .hasMessage("render-configuration").hasNoCause();
        for (long bytes : new long[]{0, policy.fileBytes() + 1})
            assertThatThrownBy(() -> new NativeProcessLimits(policy.addressSpaceBytes(), 1, bytes, 32))
                .hasMessage("render-configuration").hasNoCause();
        for (long descriptors : new long[]{0, 129})
            assertThatThrownBy(() -> new NativeProcessLimits(policy.addressSpaceBytes(), 1, 1024, descriptors))
                .hasMessage("render-configuration").hasNoCause();
    }

    @Test void tightensBothLimitsWithoutEverRaisingAnInheritedSoftOrHardCeiling() {
        var access = new FakeAccess();
        access.values.put(0, new LinuxNativeProcessGuard.Limits(10, 20));
        access.values.put(1, new LinuxNativeProcessGuard.Limits(-1, 8192));
        access.values.put(4, new LinuxNativeProcessGuard.Limits(0, -1));
        access.values.put(7, new LinuxNativeProcessGuard.Limits(64, 64));
        access.values.put(9, new LinuxNativeProcessGuard.Limits(-1, -1));
        LinuxNativeProcessGuard.apply(NativeProcessLimits.initial(), access);
        assertThat(access.values).containsEntry(0, new LinuxNativeProcessGuard.Limits(10, 10))
            .containsEntry(1, new LinuxNativeProcessGuard.Limits(8192, 8192))
            .containsEntry(4, new LinuxNativeProcessGuard.Limits(0, 0))
            .containsEntry(7, new LinuxNativeProcessGuard.Limits(64, 64))
            .containsEntry(9, new LinuxNativeProcessGuard.Limits(3L * 1024 * 1024 * 1024, 3L * 1024 * 1024 * 1024));
        assertThat(access.writes).isEqualTo(5);
    }

    @Test void refusalAndUnconfirmedWritesFailClosedWithoutRawCauses() {
        var refusal = new FakeAccess(); refusal.fail = true;
        assertThatThrownBy(() -> LinuxNativeProcessGuard.apply(NativeProcessLimits.initial(), refusal))
            .hasMessage("render-configuration").hasNoCause();
        var ignored = new FakeAccess(); ignored.ignore = true;
        assertThatThrownBy(() -> LinuxNativeProcessGuard.apply(NativeProcessLimits.initial(), ignored))
            .hasMessage("render-configuration").hasNoCause();
        assertThatThrownBy(() -> LinuxNativeProcessGuard.apply(null, ignored))
            .hasMessage("render-configuration").hasNoCause();
    }

    @Test void disablesAndConfirmsDumpabilityBeforeAnyLimitOrMediaOperation() {
        var access = new FakeAccess();
        LinuxNativeProcessGuard.apply(NativeProcessLimits.initial(), access);
        assertThat(access.dumpability).isZero();
        assertThat(access.dumpingDisabledAtWrite).isZero();
        assertThat(access.writes).isEqualTo(5);
    }

    @Test void dumpabilityRefusalOrIgnoredChangeCannotContinueToLimits() {
        for (var refusal : new boolean[]{false, true}) {
            var access = new FakeAccess(); access.dumpRefused = refusal; access.dumpIgnored = !refusal;
            assertThatThrownBy(() -> LinuxNativeProcessGuard.apply(NativeProcessLimits.initial(), access))
                .hasMessage("render-configuration").hasNoCause();
            assertThat(access.writes).isZero();
        }
    }

    @Test void establishesChildOomPreferenceBeforeChangingProcOwnershipOrLimits() {
        var access = new FakeAccess();
        LinuxNativeProcessGuard.apply(NativeProcessLimits.initial(), access);
        assertThat(access.oomPrepared).isTrue();
        assertThat(access.oomPreparedAtDump).isTrue();
        var refused = new FakeAccess(); refused.oomRefused = true;
        assertThatThrownBy(() -> LinuxNativeProcessGuard.apply(NativeProcessLimits.initial(), refused))
            .hasMessage("render-configuration").hasNoCause();
        assertThat(refused.dumpability).isEqualTo(1);
        assertThat(refused.writes).isZero();
    }

    private static final class FakeAccess implements LinuxNativeProcessGuard.Access {
        final Map<Integer, LinuxNativeProcessGuard.Limits> values = new HashMap<>();
        int writes, dumpability = 1, dumpingDisabledAtWrite = -1;
        boolean fail, ignore, dumpRefused, dumpIgnored;
        boolean oomPrepared, oomPreparedAtDump, oomRefused;
        @Override public void prepareChildOom() {
            if (oomRefused) throw new IllegalStateException("private-kernel-path");
            oomPrepared = true;
        }
        @Override public void disableDumping() {
            if (dumpRefused) throw new IllegalStateException("private-capture-path");
            dumpingDisabledAtWrite = writes;
            oomPreparedAtDump = oomPrepared;
            if (!dumpIgnored) dumpability = 0;
        }
        @Override public int dumpability() { return dumpability; }
        @Override public LinuxNativeProcessGuard.Limits read(int resource) {
            if (fail) throw new IllegalStateException("private-path-and-token");
            return values.getOrDefault(resource, new LinuxNativeProcessGuard.Limits(-1, -1));
        }
        @Override public void write(int resource, LinuxNativeProcessGuard.Limits limits) {
            writes++;
            if (!ignore) values.put(resource, limits);
        }
    }
}
