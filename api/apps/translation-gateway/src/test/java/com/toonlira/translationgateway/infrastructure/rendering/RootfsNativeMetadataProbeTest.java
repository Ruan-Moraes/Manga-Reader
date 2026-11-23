package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;

class RootfsNativeMetadataProbeTest {
    private static final byte[] VALUE = {0, (byte) 255, 10, 61};

    @Test void hashesBinaryAttributesWithoutRecordingValuesOrFollowingLinks() {
        var access = new FakeAccess();
        access.names = List.of("system.posix_acl_access", "security.capability");
        var result = RootfsNativeMetadataProbe.scan(List.of("usr/linked", "etc/cert-Főtanúsítvány.pem"), access);
        assertThat(result.entries()).isEqualTo(2);
        assertThat(result.attributes()).hasSize(2);
        assertThat(result.attributes().get("usr/linked").getFirst().name()).isEqualTo("security.capability");
        assertThat(result.attributes().get("usr/linked").getFirst().sha256()).matches("[a-f0-9]{64}");
        assertThat(result.metadataSha256()).matches("[a-f0-9]{64}");
        assertThat(result.toString()).doesNotContain("linked", "capability", "VALUE");
    }

    @Test void neverEquatesUnicodeNamesAndCopiesInputCollections() {
        var paths = new ArrayList<>(List.of("etc/Fő", "etc/Fő".replace("ő", "o\u030b")));
        var result = RootfsNativeMetadataProbe.scan(paths, new FakeAccess());
        paths.clear();
        assertThat(result.entries()).isEqualTo(2);
        assertThatThrownBy(() -> result.attributes().put("extra", List.of())).isInstanceOf(UnsupportedOperationException.class);
        assertThat(RootfsNativeMetadataProbe.scan(List.of("etc/Fő"), new FakeAccess()).metadataSha256())
            .isNotEqualTo(RootfsNativeMetadataProbe.scan(List.of("etc/Fo\u030b"), new FakeAccess()).metadataSha256());
    }

    @Test void rejectsUnsafeDuplicateOrOversizedPathsBeforeNativeAccess() {
        var calls = new AtomicInteger();
        RootfsNativeMetadataProbe.Access access = new RootfsNativeMetadataProbe.Access() {
            @Override public List<String> names(String path) { calls.incrementAndGet(); return List.of(); }
            @Override public byte[] value(String path, String name) { throw new AssertionError(); }
        };
        for (var paths : List.of(List.of("../secret"), List.of("/outside"), List.of("a//b"), List.of("a", "a"),
                List.of("a\nsecret"), List.of("a/./b"), List.of("x".repeat(4097)))) {
            assertUnavailable(() -> RootfsNativeMetadataProbe.scan(paths, access));
        }
        assertUnavailable(() -> RootfsNativeMetadataProbe.scan(null, access));
        assertThat(calls.get()).isZero();
    }

    @Test void listOrValueFailuresNeverBecomeEmptyAttributeProofs() {
        var denied = new FakeAccess() {
            @Override public List<String> names(String path) { throw new IllegalStateException("private path denied"); }
        };
        assertUnavailable(() -> RootfsNativeMetadataProbe.scan(List.of("private-path"), denied));
        var unreadable = new FakeAccess() {
            @Override public byte[] value(String path, String name) { throw new IllegalStateException("private value"); }
        };
        unreadable.names = List.of("security.capability");
        assertUnavailable(() -> RootfsNativeMetadataProbe.scan(List.of("private-path"), unreadable));
    }

    @Test void rejectsInvalidNamesDuplicateAttributesAndSizeExcessWithoutTruncation() {
        for (var names : List.of(List.of("security.a", "security.a"), List.of("no-namespace"),
                List.of("user.a\0hidden"), List.of("user." + "x".repeat(256)))) {
            var access = new FakeAccess(); access.names = names;
            assertUnavailable(() -> RootfsNativeMetadataProbe.scan(List.of("usr/file"), access));
        }
        var access = new FakeAccess() {
            @Override public byte[] value(String path, String name) { return new byte[65537]; }
        };
        access.names = List.of("security.capability");
        assertUnavailable(() -> RootfsNativeMetadataProbe.scan(List.of("usr/file"), access));
    }

    @Test void metadataChangedBetweenReadsIsUnresolved() {
        var count = new AtomicInteger();
        var access = new FakeAccess() {
            @Override public byte[] value(String path, String name) { return new byte[] {(byte) count.incrementAndGet()}; }
        };
        access.names = List.of("user.fixture");
        assertUnavailable(() -> RootfsNativeMetadataProbe.scan(List.of("usr/file"), access));
        var changed = new FakeAccess() {
            @Override public List<String> names(String path) { return count.incrementAndGet() % 2 == 0 ? List.of() : List.of("user.fixture"); }
        };
        assertUnavailable(() -> RootfsNativeMetadataProbe.scan(List.of("usr/file"), changed));
    }

    @Test void outputIsBoundedAndStatesUnverifiedTrustedNamespaceExplicitly() {
        var result = RootfsNativeMetadataProbe.scan(List.of("."), new FakeAccess());
        var json = RootfsNativeMetadataProbe.report(result, "a".repeat(64), "amd64");
        assertThat(new String(json, StandardCharsets.UTF_8)).contains("\"trustedNamespaceVerified\":false", "\"securityApproved\":false")
            .doesNotContain("private");
        assertUnavailable(() -> RootfsNativeMetadataProbe.report(result, "invalid", "amd64"));
        assertUnavailable(() -> RootfsNativeMetadataProbe.report(result, "a".repeat(64), "unknown"));
    }
    @Test void failureEvidenceContainsOnlyPathHashOperationAndErrno() {
        var bytes = RootfsNativeMetadataProbe.failureReport("private-path", "list-query", 13);
        assertThat(new String(bytes, StandardCharsets.UTF_8)).contains("\"errno\":13", "\"operation\":\"list-query\"")
            .doesNotContain("private-path");
        assertUnavailable(() -> RootfsNativeMetadataProbe.failureReport("private-path", "raw-private-operation", 13));
    }
    @Test void shortNativeListReadIsBoundedButNeverProofOfAbsentMetadata() {
        assertThat(RootfsNativeMetadataProbe.checkedListRead(44, 0)).isZero();
        assertThat(RootfsNativeMetadataProbe.checkedListRead(44, 20)).isEqualTo(20);
        assertThat(RootfsNativeMetadataProbe.checkedListRead(44, 44)).isEqualTo(44);
        assertUnavailable(() -> RootfsNativeMetadataProbe.checkedListRead(44, 45));
        assertUnavailable(() -> RootfsNativeMetadataProbe.checkedListRead(44, -1));
        assertUnavailable(() -> RootfsNativeMetadataProbe.checkedListRead(65537, 0));
        var result=RootfsNativeMetadataProbe.scan(List.of("."),new FakeAccess());
        var bytes=RootfsNativeMetadataProbe.report(result,"a".repeat(64),"arm64",List.of(new RootfsNativeMetadataProbe.ListGap(".",44,0)));
        assertThat(new String(bytes,StandardCharsets.UTF_8)).contains("\"listGaps\":[", "\"queryBytes\":44", "\"absenceOfAllAttributesProven\":false");
    }
    @Test void reportIdentifiesOnlyTheExplicitUnprivilegedImageUsers() {
        var result=RootfsNativeMetadataProbe.scan(List.of("home/ubuntu"),new FakeAccess());
        assertThat(new String(RootfsNativeMetadataProbe.report(result,"a".repeat(64),"arm64",List.of(),1000),StandardCharsets.UTF_8))
            .contains("\"uid\":1000", "\"effectiveCapabilities\":\"0000000000000000\"");
        assertUnavailable(()->RootfsNativeMetadataProbe.report(result,"a".repeat(64),"arm64",List.of(),42));
    }
    @Test void emptyAttributeValuesStillConsumeTheMetadataBudget() {
        var access=new FakeAccess() {
            @Override public byte[] value(String path,String name){return new byte[0];}
        };
        access.names=IntStream.range(0,256).mapToObj(i->"user."+i+"x".repeat(240)).toList();
        var paths=IntStream.range(0,80).mapToObj(i->"usr/file-"+i).toList();
        assertUnavailable(()->RootfsNativeMetadataProbe.scan(paths,access));
    }

    private static void assertUnavailable(Runnable action) {
        assertThatThrownBy(action::run).isInstanceOf(IllegalStateException.class)
            .hasMessage("rootfs-metadata-unavailable").hasNoCause();
    }
    private static class FakeAccess implements RootfsNativeMetadataProbe.Access {
        List<String> names = List.of();
        @Override public List<String> names(String path) { return names; }
        @Override public byte[] value(String path, String name) { return VALUE.clone(); }
    }
}
