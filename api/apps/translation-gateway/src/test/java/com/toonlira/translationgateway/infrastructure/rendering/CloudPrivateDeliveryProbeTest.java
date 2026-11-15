package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.URI;
import java.util.Map;
import java.util.UUID;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.domain.rendering.ResultObjectKey;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class CloudPrivateDeliveryProbeTest {
    private static final Map<String, String> ENABLED = Map.of(
        "MOB020_GCS_TEST", "1", "MOB020_GCS_BUCKET", "mob020-synthetic-123",
        "MOB020_GCP_PROJECT", "toonlira-rm",
        "MOB020_GCS_SIGNER", "mob020-sign@toonlira-rm.iam.gserviceaccount.com");

    @Test void requiresExplicitOptInAndDedicatedBucket() {
        assertThat(CloudPrivateDeliveryProbe.configuration(ENABLED).bucket()).isEqualTo("mob020-synthetic-123");
        assertThatThrownBy(() -> CloudPrivateDeliveryProbe.configuration(Map.of())).isInstanceOf(IllegalArgumentException.class);
        var unsafe = new java.util.HashMap<>(ENABLED);
        unsafe.put("MOB020_GCS_BUCKET", "existing-bucket");
        assertThatThrownBy(() -> CloudPrivateDeliveryProbe.configuration(unsafe)).isInstanceOf(IllegalArgumentException.class);
        unsafe.put("MOB020_GCS_BUCKET", "mob020-synthetic-123");
        unsafe.put("GOOGLE_APPLICATION_CREDENTIALS", "/tmp/key.json");
        assertThatThrownBy(() -> CloudPrivateDeliveryProbe.configuration(unsafe)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void refusesNonGcsAndUnexpectedObjectLocations() {
        var valid = URI.create("https://storage.googleapis.com/mob020-synthetic-123/private/image?generation=1");
        CloudPrivateDeliveryProbe.checkLocation(valid, "mob020-synthetic-123", "private/image");
        for (var value : new String[] {"http://storage.googleapis.com/mob020-synthetic-123/private/image?x=1",
            "https://evil.example/mob020-synthetic-123/private/image?x=1",
            "https://storage.googleapis.com/mob020-synthetic-123/private/other?x=1"}) {
            assertThatThrownBy(() -> CloudPrivateDeliveryProbe.checkLocation(URI.create(value), "mob020-synthetic-123", "private/image"))
                .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Test void verifiesDimensionsAndLosslessWebpHeader() {
        byte[] webp = new byte[] {'R', 'I', 'F', 'F', 18, 0, 0, 0, 'W', 'E', 'B', 'P',
            'V', 'P', '8', 'L', 5, 0, 0, 0, 0x2f, 0x3f, (byte) 0xc1, 0x36, 0, 0};
        CloudPrivateDeliveryProbe.checkLosslessDimensions(webp, 320, 220);
        assertThatThrownBy(() -> CloudPrivateDeliveryProbe.checkLosslessDimensions(webp, 321, 220))
            .isInstanceOf(IllegalStateException.class);
        webp[15] = ' ';
        assertThatThrownBy(() -> CloudPrivateDeliveryProbe.checkLosslessDimensions(webp, 320, 220))
            .isInstanceOf(IllegalStateException.class);
    }

    @Test void corruptsTheSignatureWithoutChangingItsEncodingLengthOrOtherParameters() {
        var original = URI.create("https://storage.googleapis.com/mob020-synthetic-123/private/image?X-Goog-Credential=a%40b&X-Goog-Signature=abcdef012345&generation=7");
        var tampered = CloudPrivateDeliveryProbe.tamperedSignature(original);
        assertThat(tampered.getRawQuery()).isEqualTo("X-Goog-Credential=a%40b&X-Goog-Signature=0bcdef012345&generation=7");
        assertThat(tampered.toASCIIString()).hasSameSizeAs(original.toASCIIString());
        assertThatThrownBy(() -> CloudPrivateDeliveryProbe.tamperedSignature(URI.create("https://storage.googleapis.com/b/k?generation=7")))
            .isInstanceOf(IllegalStateException.class);
    }

    @Test void neighboringControlObjectKeepsACanonicalRetentionLocator() {
        var expiry = Instant.parse("2026-10-30T12:00:00Z");
        var key = ResultObjectKey.create(expiry, "webp");
        var neighbor = CloudPrivateDeliveryProbe.neighborKey(key);
        assertThat(neighbor).isNotEqualTo(key).startsWith(key.substring(0, key.lastIndexOf('/') + 1));
        assertThat(ResultObjectKey.expiry(neighbor)).contains(expiry);
    }

    @Test void rejectsManifestForAnotherJobOrImage() throws Exception {
        var mapper = GatewayJsonMapper.create();
        var job = UUID.randomUUID();
        var metadata = mapper.readTree("""
            {"widthPx":320,"heightPx":220,"image":{"sha256":"abc","mimeType":"image/webp","byteSize":26}}
            """);
        var document = mapper.readTree("""
            {"version":"1.0","jobRef":"%s","image":{"sha256":"abc","mimeType":"image/webp","byteSize":26,"widthPx":320,"heightPx":220}}
            """.formatted(job));
        CloudPrivateDeliveryProbe.checkManifest(document, metadata, job);
        assertThatThrownBy(() -> CloudPrivateDeliveryProbe.checkManifest(document, metadata, UUID.randomUUID()))
            .isInstanceOf(IllegalStateException.class);
        for (var field : new String[] {"sha256", "mimeType", "byteSize", "widthPx", "heightPx"}) {
            var altered = mapper.readTree(document.toString().replace('"' + field + '"', '"' + field + "-missing\""));
            assertThatThrownBy(() -> CloudPrivateDeliveryProbe.checkManifest(altered, metadata, job))
                .isInstanceOf(IllegalStateException.class);
        }
    }
}
