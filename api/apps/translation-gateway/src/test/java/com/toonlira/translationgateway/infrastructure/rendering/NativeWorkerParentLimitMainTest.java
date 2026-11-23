package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.ByteBuffer;
import org.junit.jupiter.api.Test;

class NativeWorkerParentLimitMainTest {
    private static final long GIB = 1024L * 1024 * 1024;

    @Test void tightensOnlyOwnedParentAndConfirmsExactExperimentalCeiling() {
        var access = new FakeAccess();
        NativeWorkerParentLimitMain.tighten(access);
        assertThat(access.writes).isEqualTo(1);
        assertThat(access.limits).isEqualTo(new LinuxNativeProcessGuard.Limits(3 * GIB, 3 * GIB));
    }

    @Test void rejectsUnownedUnknownOrAlreadyTooLargeParentBeforeChangingAnything() {
        for (int fault = 0; fault < 6; fault++) {
            var access = new FakeAccess();
            if (fault == 0) access.parent = 2;
            if (fault == 1) access.sameExecutable = false;
            if (fault == 2) access.privateGroup = false;
            if (fault == 3) access.virtualBytes = 3 * GIB;
            if (fault == 4) access.virtualBytes = 0;
            if (fault == 5) access.limits = new LinuxNativeProcessGuard.Limits(2 * GIB, -1);
            assertThatThrownBy(() -> NativeWorkerParentLimitMain.tighten(access)).hasMessage("render-configuration").hasNoCause();
            assertThat(access.writes).isZero();
        }
    }

    @Test void neverRaisesAnInheritedLimitAndNeverApprovesIgnoredRefusedOrLostScopeWrite() {
        var inherited = new FakeAccess(); inherited.limits = new LinuxNativeProcessGuard.Limits(-1, 2 * GIB);
        assertThatThrownBy(() -> NativeWorkerParentLimitMain.tighten(inherited)).hasMessage("render-configuration").hasNoCause();
        assertThat(inherited.writes).isZero();
        for (int fault = 0; fault < 3; fault++) {
            var access = new FakeAccess(); access.fault = fault;
            assertThatThrownBy(() -> NativeWorkerParentLimitMain.tighten(access)).hasMessage("render-configuration").hasNoCause();
        }
    }

    @Test void confirmationIsFixedSizeVersionedAndContainsNoProcessOrJobReference() {
        var bytes = NativeWorkerParentLimitMain.confirmation();
        assertThat(bytes).hasSize(12);
        assertThat(NativeWorkerParentLimitMain.confirm(bytes)).isEqualTo(3 * GIB);
        for (var invalid : new byte[][] { new byte[0], new byte[13], ByteBuffer.allocate(12).putInt(0).putLong(3 * GIB).array(),
            ByteBuffer.allocate(12).putInt(0x57504c31).putLong(2 * GIB).array() })
            assertThatThrownBy(() -> NativeWorkerParentLimitMain.confirm(invalid)).hasMessage("render-configuration").hasNoCause();
    }

    private static final class FakeAccess implements NativeWorkerParentLimitMain.Access {
        int parent = 1, writes, fault = -1;
        boolean sameExecutable = true, privateGroup = true;
        long virtualBytes = GIB;
        LinuxNativeProcessGuard.Limits limits = new LinuxNativeProcessGuard.Limits(-1, -1);
        @Override public int parentPid() { return parent; }
        @Override public boolean sameExecutable() { return sameExecutable; }
        @Override public boolean privateGroup() { return privateGroup; }
        @Override public long parentVirtualBytes() { return virtualBytes; }
        @Override public LinuxNativeProcessGuard.Limits read() { return limits; }
        @Override public void write(LinuxNativeProcessGuard.Limits value) {
            writes++;
            if (fault == 1) throw new IllegalStateException("private diagnostics");
            if (fault != 0) limits = value;
            if (fault == 2) parent = 2;
        }
    }
}
