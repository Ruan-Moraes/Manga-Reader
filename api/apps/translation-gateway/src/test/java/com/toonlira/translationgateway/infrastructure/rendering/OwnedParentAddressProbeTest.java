package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class OwnedParentAddressProbeTest {
    @Test void onlyTightensOwnedContainerInitAndConfirmsKernelLimit() {
        var access = new FakeAccess();
        var result = OwnedParentAddressProbe.tighten(access);
        assertThat(result.limitBytes()).isEqualTo(3L * 1024 * 1024 * 1024);
        assertThat(access.writes).isEqualTo(1);
        assertThat(access.limits).isEqualTo(new LinuxNativeProcessGuard.Limits(result.limitBytes(), result.limitBytes()));
        access = new FakeAccess(); access.limits = new LinuxNativeProcessGuard.Limits(1024 * 1024 * 1024L, -1);
        assertThat(OwnedParentAddressProbe.tighten(access).limitBytes()).isEqualTo(1024 * 1024 * 1024L);
    }

    @Test void unknownOrUnownedParentAndExistingReservationsFailBeforeWrite() {
        for (int fault = 0; fault < 5; fault++) {
            var access = new FakeAccess();
            if (fault == 0) access.parent = 2;
            if (fault == 1) access.sameExecutable = false;
            if (fault == 2) access.privateGroup = false;
            if (fault == 3) access.virtualBytes = 4L * 1024 * 1024 * 1024;
            if (fault == 4) access.virtualBytes = 0;
            assertThatThrownBy(() -> OwnedParentAddressProbe.tighten(access))
                .hasMessage("owned-parent-limit-unavailable").hasNoCause();
            assertThat(access.writes).isZero();
        }
    }

    @Test void refusalOrIgnoredWriteCannotBecomeApproval() {
        var access = new FakeAccess(); access.ignoreWrite = true;
        assertThatThrownBy(() -> OwnedParentAddressProbe.tighten(access))
            .hasMessage("owned-parent-limit-unavailable").hasNoCause();
        var refused = new FakeAccess(); refused.refuseWrite = true;
        assertThatThrownBy(() -> OwnedParentAddressProbe.tighten(refused))
            .hasMessage("owned-parent-limit-unavailable").hasNoCause();
    }

    @Test void virtualSizeParsingIsBoundedCanonicalUniqueAndNeverFabricatesZero() {
        assertThat(OwnedParentAddressProbe.virtualBytes("Name:\tjava\nVmSize:\t12345 kB\n" )).isEqualTo(12345L * 1024);
        for (var text : new String[]{"Name: java\n", "VmSize: 0 kB\n", "VmSize: 1 MB\n", "VmSize: 1 kB\nVmSize: 2 kB\n",
            "VmSize: 99999999999999999999 kB\n", "x".repeat(16385)})
            assertThatThrownBy(() -> OwnedParentAddressProbe.virtualBytes(text))
                .hasMessage("owned-parent-limit-unavailable").hasNoCause();
    }

    @Test void parentLimitReadbackMustBeFiniteEqualAndUnique() {
        assertThat(OwnedParentAddressProbe.addressLimitBytes("Max address space   3221225472   3221225472   bytes\n"))
            .isEqualTo(3L * 1024 * 1024 * 1024);
        for (var value : new String[]{"", "Max address space unlimited unlimited bytes\n", "Max address space 1 2 bytes\n",
            "Max address space 0 0 bytes\n", "Max address space 1 1 bytes\nMax address space 1 1 bytes\n"})
            assertThatThrownBy(() -> OwnedParentAddressProbe.addressLimitBytes(value))
                .hasMessage("owned-parent-limit-unavailable").hasNoCause();
    }

    private static final class FakeAccess implements OwnedParentAddressProbe.Access {
        int parent = 1, writes;
        boolean sameExecutable = true, privateGroup = true, ignoreWrite, refuseWrite;
        long virtualBytes = 512L * 1024 * 1024;
        LinuxNativeProcessGuard.Limits limits = new LinuxNativeProcessGuard.Limits(-1, -1);
        @Override public int parentPid() { return parent; }
        @Override public boolean sameExecutable() { return sameExecutable; }
        @Override public boolean privateGroup() { return privateGroup; }
        @Override public long parentVirtualBytes() { return virtualBytes; }
        @Override public LinuxNativeProcessGuard.Limits read() { return limits; }
        @Override public void write(LinuxNativeProcessGuard.Limits value) {
            writes++;
            if (refuseWrite) throw new IllegalStateException("private diagnostic");
            if (!ignoreWrite) limits = value;
        }
    }
}
