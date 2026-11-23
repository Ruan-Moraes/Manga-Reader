package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class LinuxOomPolicyTest {
    @Test void supervisorIsOnlyInspectedAndNeverMadeUnkillable() {
        for (String score : new String[]{"0\n", "-1000\n"}) {
            var access = new FakeAccess(); access.score = score;
            LinuxOomPolicy.requireSupervisor(access);
            assertThat(access.writes).isZero();
            assertThat(access.score).isEqualTo(score);
        }
    }

    @Test void onlyTheChildRaisesItsOwnPreferenceAndConfirmsTheKernelValue() {
        var access = new FakeAccess();
        LinuxOomPolicy.prepareChild(access);
        assertThat(access.writes).isEqualTo(1);
        assertThat(access.score).isEqualTo("1000");
    }

    @Test void groupedOomUnknownNamespaceAndUnsupportedParentFailBeforeAnyWrite() {
        for (var value : new String[]{"1", "", "max", "-1"}) {
            var access = new FakeAccess(); access.group = value;
            assertThatThrownBy(() -> LinuxOomPolicy.prepareChild(access)).hasMessage("render-configuration").hasNoCause();
            assertThat(access.writes).isZero();
        }
        for (var value : new String[]{"0::/unowned", "1:memory:/", "0::/\n1:cpu:/", "", null}) {
            var access = new FakeAccess(); access.namespace = value;
            assertThatThrownBy(() -> LinuxOomPolicy.requireSupervisor(access)).hasMessage("render-configuration").hasNoCause();
            assertThat(access.writes).isZero();
        }
        for (String value : new String[]{"1", "1000", "1001", "-1001", "max", "", "private-token"}) {
            var access = new FakeAccess(); access.score = value;
            assertThatThrownBy(() -> LinuxOomPolicy.requireSupervisor(access)).hasMessage("render-configuration").hasNoCause();
            assertThat(access.writes).isZero();
        }
    }

    @Test void refusedIgnoredOrUnboundedReadsCannotFallBackToAnUnprotectedChild() {
        for (var refusal : new boolean[]{false, true}) {
            var access = new FakeAccess(); access.refuse = refusal; access.ignore = !refusal;
            assertThatThrownBy(() -> LinuxOomPolicy.prepareChild(access)).hasMessage("render-configuration").hasNoCause();
        }
        var access = new FakeAccess(); access.namespace = "x".repeat(4097);
        assertThatThrownBy(() -> LinuxOomPolicy.prepareChild(access)).hasMessage("render-configuration").hasNoCause();
        assertThat(access.writes).isZero();
        assertThatThrownBy(() -> LinuxOomPolicy.requireSupervisor(null)).hasMessage("render-configuration").hasNoCause();
    }

    private static final class FakeAccess implements LinuxOomPolicy.Access {
        String namespace = "0::/\n", group = "0\n", score = "0\n";
        int writes;
        boolean refuse, ignore;
        @Override public String namespace() { return namespace; }
        @Override public String group() { return group; }
        @Override public String adjustment() { return score; }
        @Override public void preferSelf() {
            writes++;
            if (refuse) throw new IllegalStateException("private-path-and-secret");
            if (!ignore) score = "1000";
        }
    }
}
