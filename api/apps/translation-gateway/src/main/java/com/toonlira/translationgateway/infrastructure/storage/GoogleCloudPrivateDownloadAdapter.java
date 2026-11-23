package com.toonlira.translationgateway.infrastructure.storage;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE;

import com.google.auth.ServiceAccountSigner;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.HttpMethod;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.Storage.SignUrlOption;
import com.toonlira.translationgateway.application.port.PrivateDownloadPort;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.rendering.PrivateDownload;
import com.toonlira.translationgateway.domain.rendering.PrivateDownloadRequest;
import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/** No ownership decisions, public URLs, downloads or mutation of objects occur here. */
public final class GoogleCloudPrivateDownloadAdapter implements PrivateDownloadPort {
    public static final int MAX_URL_SECONDS = 300;
    private static final DateTimeFormatter SIGNED_DATE = DateTimeFormatter.ofPattern("uuuuMMdd'T'HHmmss'Z'")
        .withResolverStyle(ResolverStyle.STRICT).withZone(ZoneOffset.UTC);
    private final Storage storage;
    private final ServiceAccountSigner signer;
    private final String bucket;
    private final Clock clock;

    public GoogleCloudPrivateDownloadAdapter(Storage storage, ServiceAccountSigner signer, String bucket, Clock clock) {
        if (storage == null || signer == null || clock == null || !validBucket(bucket)) {
            throw new IllegalStateException("Private download preparation unavailable");
        }
        this.storage = storage;
        this.signer = signer;
        this.bucket = bucket;
        this.clock = clock;
    }

    @Override
    public PrivateDownload sign(PrivateDownloadRequest request) {
        try {
            if (request == null) throw unavailable();
            secondsUntil(request.resultExpiresAt());
            var blob = storage.get(BlobId.of(bucket, request.objectKey()));
            validateMetadata(request, blob);
            long seconds = secondsUntil(request.resultExpiresAt());
            var info = BlobInfo.newBuilder(BlobId.of(bucket, request.objectKey(), blob.getGeneration())).build();
            var url = storage.signUrl(info, seconds, TimeUnit.SECONDS,
                SignUrlOption.withV4Signature(), SignUrlOption.httpMethod(HttpMethod.GET),
                SignUrlOption.withPathStyle(), SignUrlOption.withHostName("https://storage.googleapis.com"),
                SignUrlOption.withQueryParams(Map.of("generation", blob.getGeneration().toString())),
                SignUrlOption.signWith(signer)).toURI();
            var expiresAt = validateSignedLocation(url, request, blob.getGeneration(), seconds);
            return new PrivateDownload(url, request.kind().mimeType(), blob.getSize(), request.sha256(), expiresAt);
        } catch (Exception error) {
            // Causes can include URLs, credentials or raw provider responses. Never retain them.
            throw unavailable();
        }
    }

    private long secondsUntil(Instant deadline) {
        long remaining = Duration.between(clock.instant(), deadline).getSeconds();
        if (remaining < 1) throw unavailable();
        return Math.min(remaining, MAX_URL_SECONDS);
    }

    private void validateMetadata(PrivateDownloadRequest request, Blob blob) {
        if (blob == null || !bucket.equals(blob.getBucket()) || !request.objectKey().equals(blob.getName())
            || !request.kind().mimeType().equals(blob.getContentType())
            || blob.getSize() == null || blob.getSize() <= 0 || blob.getSize() > request.kind().maxBytes()
            || (request.expectedByteSize() != null && !request.expectedByteSize().equals(blob.getSize()))
            || blob.getMetadata() == null || !request.sha256().equals(blob.getMetadata().get("sha256"))
            || blob.getGeneration() == null || blob.getGeneration() <= 0) {
            throw unavailable();
        }
    }

    private Instant validateSignedLocation(URI url, PrivateDownloadRequest request, long generation, long seconds) {
        if (!"https".equals(url.getScheme()) || !"storage.googleapis.com".equals(url.getHost())
            || url.getPort() != -1 || url.getUserInfo() != null || url.getFragment() != null
            || !("/" + bucket + "/" + request.objectKey()).equals(url.getRawPath())
            || url.getRawQuery() == null) throw unavailable();
        var query = new HashMap<String, String>();
        for (var part : url.getRawQuery().split("&")) {
            var pair = part.split("=", 2);
            if (pair.length != 2 || query.putIfAbsent(pair[0], pair[1]) != null) throw unavailable();
        }
        if (!"GOOG4-RSA-SHA256".equals(query.get("X-Goog-Algorithm"))
            || !Long.toString(generation).equals(query.get("generation"))
            || !Long.toString(seconds).equals(query.get("X-Goog-Expires"))
            || query.get("X-Goog-Signature") == null || query.get("X-Goog-Signature").isBlank()) throw unavailable();
        var signedAt = Instant.from(SIGNED_DATE.parse(query.get("X-Goog-Date")));
        var expiresAt = signedAt.plusSeconds(seconds);
        var now = clock.instant();
        if (signedAt.isAfter(now) || !expiresAt.isAfter(now) || expiresAt.isAfter(request.resultExpiresAt())
            || expiresAt.isAfter(now.plusSeconds(MAX_URL_SECONDS))) throw unavailable();
        return expiresAt;
    }

    static boolean validBucket(String bucket) {
        return bucket != null && bucket.matches("[a-z0-9][a-z0-9-]{1,61}[a-z0-9]");
    }

    private GatewayException unavailable() { return new GatewayException(STORAGE_UNAVAILABLE, 503, true); }
    @Override public String toString() { return "GoogleCloudPrivateDownloadAdapter[redacted]"; }
}
