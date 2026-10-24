package com.toonlira.translationgateway.infrastructure.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.google.api.core.ApiClock;
import com.google.auth.ServiceAccountSigner;
import com.google.cloud.NoCredentials;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.Storage.SignUrlOption;
import com.google.cloud.storage.StorageException;
import com.google.cloud.storage.StorageOptions;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.rendering.PrivateDownloadRequest;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.Signature;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class GoogleCloudPrivateDownloadAdapterTest {
    private static final String BUCKET = "private-test-bucket";
    private static final String KEY = "private/rendering/image.webp";
    private static final String HASH = "a".repeat(64);
    private static final Instant NOW = Instant.parse("2026-10-04T12:00:00Z");
    private final Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
    private final Storage storage = mock(Storage.class);
    private final ServiceAccountSigner signer = mock(ServiceAccountSigner.class);

    @Test
    void genuineSdkSignsGetWithExactGenerationAndExpiryUsingEphemeralTestKey() throws Exception {
        var keyPair = KeyPairGenerator.getInstance("RSA").generateKeyPair();
        var signed = new AtomicReference<byte[]>();
        var calls = new AtomicInteger();
        var localSigner = new ServiceAccountSigner() {
            @Override public String getAccount() { return "synthetic@test-project.iam.gserviceaccount.com"; }
            @Override public byte[] sign(byte[] bytes) {
                calls.incrementAndGet();
                signed.set(bytes.clone());
                try {
                    var signature = Signature.getInstance("SHA256withRSA");
                    signature.initSign(keyPair.getPrivate());
                    signature.update(bytes);
                    return signature.sign();
                } catch (Exception error) { throw new IllegalStateException("Synthetic signer failure"); }
            }
        };
        var sdk = StorageOptions.newBuilder().setProjectId("synthetic-test-project").setCredentials(NoCredentials.getInstance())
            .setClock(new ApiClock() {
                @Override public long millisTime() { return NOW.toEpochMilli(); }
                @Override public long nanoTime() { return 0; }
            }).build().getService();
        var image = blob(KEY, "image/webp", 12, HASH, 7);
        when(storage.get(BlobId.of(BUCKET, KEY))).thenReturn(image);
        when(storage.signUrl(any(BlobInfo.class), anyLong(), eq(TimeUnit.SECONDS), any(SignUrlOption[].class)))
            .thenAnswer(invocation -> {
                try {
                    var generated = sdk.signUrl(invocation.getArgument(0), invocation.getArgument(1),
                        invocation.getArgument(2), (SignUrlOption[]) invocation.getRawArguments()[3]);
                    assertThat(generated.getHost()).isEqualTo("storage.googleapis.com");
                    return generated;
                } catch (RuntimeException error) { throw new AssertionError("Local SDK fixture call failed", error); }
            });
        var result = new GoogleCloudPrivateDownloadAdapter(storage, localSigner, BUCKET, clock)
            .sign(request(NOW.plusSeconds(70)));
        assertThat(result.expiresAt()).isEqualTo(NOW.plusSeconds(70));
        assertThat(result.byteSize()).isEqualTo(12);
        assertThat(result.sha256()).isEqualTo(HASH);
        assertThat(calls).hasValue(1);
        var uri = result.url();
        assertThat(uri.getHost()).isEqualTo("storage.googleapis.com");
        assertThat(uri.getPath()).isEqualTo("/" + BUCKET + "/" + KEY);
        assertThat(uri.getRawQuery()).contains("generation=7", "X-Goog-Expires=70", "X-Goog-Algorithm=GOOG4-RSA-SHA256");
        var query = Arrays.stream(uri.getRawQuery().split("&")).filter(part -> !part.startsWith("X-Goog-Signature="))
            .sorted().reduce((left, right) -> left + "&" + right).orElseThrow();
        var canonical = "GET\n" + uri.getRawPath() + "\n" + query + "\nhost:storage.googleapis.com\n\nhost\nUNSIGNED-PAYLOAD";
        var expectedHash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8)));
        assertThat(new String(signed.get(), StandardCharsets.UTF_8)).endsWith(expectedHash);
        var signatureHex = Arrays.stream(uri.getRawQuery().split("&"))
            .filter(part -> part.startsWith("X-Goog-Signature=")).findFirst().orElseThrow().substring("X-Goog-Signature=".length());
        var verifier = Signature.getInstance("SHA256withRSA");
        verifier.initVerify(keyPair.getPublic());
        verifier.update(signed.get());
        assertThat(verifier.verify(HexFormat.of().parseHex(signatureHex))).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"missing", "mime", "hash", "size", "generation", "identity", "metadata", "empty", "oversize", "bucket"})
    void invalidObjectFailsBeforeSigning(String defect) {
        var blob = switch (defect) {
            case "missing" -> null;
            case "mime" -> blob(KEY, "image/png", 12, HASH, 7);
            case "hash" -> blob(KEY, "image/webp", 12, "b".repeat(64), 7);
            case "size" -> blob(KEY, "image/webp", 13, HASH, 7);
            case "generation" -> blob(KEY, "image/webp", 12, HASH, 0);
            case "identity" -> blob("private/rendering/another", "image/webp", 12, HASH, 7);
            case "empty" -> blob(KEY, "image/webp", 0, HASH, 7);
            case "oversize" -> blob(KEY, "image/webp", 67108865, HASH, 7);
            case "bucket" -> {
                var foreign = blob(KEY, "image/webp", 12, HASH, 7);
                when(foreign.getBucket()).thenReturn("foreign-bucket");
                yield foreign;
            }
            default -> blob(KEY, "image/webp", 12, null, 7);
        };
        when(storage.get(BlobId.of(BUCKET, KEY))).thenReturn(blob);
        assertSanitized(() -> adapter().sign(request(NOW.plusSeconds(600))));
        verifyNoInteractions(signer);
    }

    @Test
    void expiredDeadlineFailsBeforeAnyStorageOrSignerAccess() {
        assertSanitized(() -> adapter().sign(request(NOW)));
        verifyNoInteractions(storage, signer);
    }

    @Test
    void metadataStorageAndSignerFailuresHaveNoRawCauseOrSecondAttempt() {
        when(storage.get(BlobId.of(BUCKET, KEY))).thenThrow(new StorageException(503, KEY + " synthetic secret"));
        assertSanitized(() -> adapter().sign(request(NOW.plusSeconds(600))));
        verify(storage).get(BlobId.of(BUCKET, KEY));
        verifyNoInteractions(signer);
    }

    @Test
    void manifestUsesObservedBoundedBytesWithoutInventingPersistedSize() throws Exception {
        var key = "private/rendering/manifest.json";
        var manifest = blob(key, "application/json", 4096, HASH, 7);
        when(storage.get(BlobId.of(BUCKET, key))).thenReturn(manifest);
        when(storage.signUrl(any(BlobInfo.class), eq(300L), eq(TimeUnit.SECONDS), any(SignUrlOption[].class)))
            .thenReturn(url(key, 300));
        var result = adapter().sign(new PrivateDownloadRequest(key, PrivateDownloadRequest.Kind.MANIFEST, HASH, null, NOW.plusSeconds(3600)));
        assertThat(result.byteSize()).isEqualTo(4096);
        assertThat(result.expiresAt()).isEqualTo(NOW.plusSeconds(300));
    }

    @Test
    void sdkClockOrSigningDelayMustNotExtendResultDeadline() throws Exception {
        var image = blob(KEY, "image/webp", 12, HASH, 7);
        when(storage.get(BlobId.of(BUCKET, KEY))).thenReturn(image);
        when(storage.signUrl(any(BlobInfo.class), anyLong(), eq(TimeUnit.SECONDS), any(SignUrlOption[].class)))
            .thenReturn(url(KEY, 71));
        assertSanitized(() -> adapter().sign(request(NOW.plusSeconds(70))));
    }

    @Test
    void signingExceptionIsSanitizedAndNotRetried() {
        var image = blob(KEY, "image/webp", 12, HASH, 7);
        when(storage.get(BlobId.of(BUCKET, KEY))).thenReturn(image);
        when(storage.signUrl(any(BlobInfo.class), anyLong(), eq(TimeUnit.SECONDS), any(SignUrlOption[].class)))
            .thenThrow(new IllegalStateException(KEY + " synthetic signature credential"));
        assertSanitized(() -> adapter().sign(request(NOW.plusSeconds(600))));
        verify(storage).signUrl(any(BlobInfo.class), anyLong(), eq(TimeUnit.SECONDS), any(SignUrlOption[].class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"host", "path", "generation", "duplicate", "algorithm", "date", "signature", "fragment"})
    void malformedSignedLocationIsNotReturned(String defect) throws Exception {
        var image = blob(KEY, "image/webp", 12, HASH, 7);
        when(storage.get(BlobId.of(BUCKET, KEY))).thenReturn(image);
        String location = url(KEY, 300).toString();
        location = switch (defect) {
            case "host" -> location.replace("storage.googleapis.com", "evil.test");
            case "path" -> location.replace(KEY, "private/rendering/another");
            case "generation" -> location.replace("generation=7", "generation=8");
            case "duplicate" -> location + "&generation=7";
            case "algorithm" -> location.replace("GOOG4-RSA-SHA256", "unexpected");
            case "date" -> location.replace("20261004T120000Z", "20261004T120001Z");
            case "signature" -> location.replace("X-Goog-Signature=synthetic", "X-Goog-Signature=");
            default -> location + "#fragment";
        };
        var supplied = URI.create(location).toURL();
        when(storage.signUrl(any(BlobInfo.class), anyLong(), eq(TimeUnit.SECONDS), any(SignUrlOption[].class)))
            .thenReturn(supplied);
        assertSanitized(() -> adapter().sign(request(NOW.plusSeconds(600))));
    }

    @Test
    void manifestOverLimitFailsBeforeSigningWithoutTruncation() {
        var key = "private/rendering/manifest.json";
        var manifest = blob(key, "application/json", 4194305, HASH, 7);
        when(storage.get(BlobId.of(BUCKET, key))).thenReturn(manifest);
        assertSanitized(() -> adapter().sign(new PrivateDownloadRequest(key, PrivateDownloadRequest.Kind.MANIFEST,
            HASH, null, NOW.plusSeconds(600))));
        verifyNoInteractions(signer);
    }

    @Test
    void expirationDuringMetadataLookupPreventsSigning() {
        var mutableNow = new AtomicReference<>(NOW);
        var movingClock = new Clock() {
            @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
            @Override public Clock withZone(ZoneId zone) { return this; }
            @Override public Instant instant() { return mutableNow.get(); }
        };
        var image = blob(KEY, "image/webp", 12, HASH, 7);
        when(storage.get(BlobId.of(BUCKET, KEY))).thenAnswer(invocation -> {
            mutableNow.set(NOW.plusSeconds(70));
            return image;
        });
        assertSanitized(() -> new GoogleCloudPrivateDownloadAdapter(storage, signer, BUCKET, movingClock)
            .sign(request(NOW.plusSeconds(70))));
        verifyNoInteractions(signer);
    }

    private GoogleCloudPrivateDownloadAdapter adapter() {
        return new GoogleCloudPrivateDownloadAdapter(storage, signer, BUCKET, clock);
    }
    private PrivateDownloadRequest request(Instant deadline) {
        return new PrivateDownloadRequest(KEY, PrivateDownloadRequest.Kind.IMAGE, HASH, 12L, deadline);
    }
    private Blob blob(String key, String mime, long bytes, String hash, long generation) {
        var blob = mock(Blob.class);
        when(blob.getBucket()).thenReturn(BUCKET);
        when(blob.getName()).thenReturn(key);
        when(blob.getContentType()).thenReturn(mime);
        when(blob.getSize()).thenReturn(bytes);
        when(blob.getMetadata()).thenReturn(hash == null ? null : Map.of("sha256", hash));
        when(blob.getGeneration()).thenReturn(generation);
        return blob;
    }
    private URL url(String key, int expires) throws Exception {
        return URI.create("https://storage.googleapis.com/" + BUCKET + "/" + key
            + "?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Date=20261004T120000Z&X-Goog-Expires=" + expires
            + "&generation=7&X-Goog-Signature=synthetic").toURL();
    }
    private void assertSanitized(Runnable operation) {
        assertThatThrownBy(operation::run).isInstanceOfSatisfying(GatewayException.class, error -> {
            assertThat(error.getMessage()).isEqualTo("storage-unavailable");
            assertThat(error.getCause()).isNull();
            assertThat(error.status()).isEqualTo(503);
            assertThat(error.retryable()).isTrue();
        });
    }
}
