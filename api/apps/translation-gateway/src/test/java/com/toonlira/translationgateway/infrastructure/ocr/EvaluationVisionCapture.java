package com.toonlira.translationgateway.infrastructure.ocr;

import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.ImageAnnotatorSettings;
import com.toonlira.translationgateway.domain.OcrLimits;
import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.ClientInterceptor;
import io.grpc.ForwardingClientCall.SimpleForwardingClientCall;
import io.grpc.ForwardingClientCallListener.SimpleForwardingClientCallListener;
import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import io.grpc.Status;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Captures the decoded protobuf before mapping. Only on the test classpath, never in production. */
public final class EvaluationVisionCapture implements ClientInterceptor {
    public static final String FILE = "vision-response.pb";
    private final Path output;
    private final Map<String, Object> evidence = new LinkedHashMap<>();
    private boolean received;

    public EvaluationVisionCapture(Path output, boolean synthetic) {
        this.output = output;
        evidence.put("status", "not-received");
        evidence.put("synthetic", synthetic);
        evidence.put("format", "google.cloud.vision.v1.BatchAnnotateImagesResponse/protobuf");
    }

    public static ImageAnnotatorSettings settings(GoogleCredentials credentials, EvaluationVisionCapture capture) throws IOException {
        return VisionClientFactory.settings().setCredentialsProvider(FixedCredentialsProvider.create(credentials))
            .setQuotaProjectId(credentials.getQuotaProjectId())
            .setTransportChannelProvider(ImageAnnotatorSettings.defaultGrpcTransportProviderBuilder()
                .setMaxInboundMessageSize(OcrLimits.MAX_RESPONSE_BYTES)
                .setChannelConfigurator(VisionClientFactory::configureChannel)
                .setInterceptorProvider(() -> List.of(capture)).build()).build();
    }

    public static ImageAnnotatorClient client(GoogleCredentials credentials, EvaluationVisionCapture capture) throws IOException {
        return ImageAnnotatorClient.create(settings(credentials, capture));
    }

    public synchronized Map<String, Object> metadata() { return Map.copyOf(evidence); }

    synchronized void capture(BatchAnnotateImagesResponse response) {
        try {
            if (received || response.getSerializedSize() > OcrLimits.MAX_RESPONSE_BYTES
                || !Files.isDirectory(output) || Files.isSymbolicLink(output)) throw new IOException();
            received = true;
            var bytes = response.toByteArray();
            try (var channel = Files.newByteChannel(output.resolve(FILE), Set.of(StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE),
                PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")))) {
                var buffer = ByteBuffer.wrap(bytes);
                while (buffer.hasRemaining()) channel.write(buffer);
            }
            evidence.put("bytes", bytes.length);
            evidence.put("sha256", HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)));
            evidence.put("receivedAt", Instant.now().toString());
            evidence.put("status", "captured");
        } catch (Exception ignored) {
            evidence.put("status", "capture-failed");
        }
    }

    @Override public <RequestT, ResponseT> ClientCall<RequestT, ResponseT> interceptCall(
        MethodDescriptor<RequestT, ResponseT> method, CallOptions options, Channel next) {
        return new SimpleForwardingClientCall<>(next.newCall(method, options)) {
            @Override public void start(Listener<ResponseT> listener, Metadata headers) {
                synchronized (EvaluationVisionCapture.this) { evidence.put("startedAt", Instant.now().toString()); }
                super.start(new SimpleForwardingClientCallListener<>(listener) {
                    @Override public void onMessage(ResponseT message) {
                        if (message instanceof BatchAnnotateImagesResponse response) capture(response);
                        super.onMessage(message);
                    }
                    @Override public void onClose(Status status, Metadata trailers) {
                        synchronized (EvaluationVisionCapture.this) {
                            evidence.put("grpcStatus", status.getCode().name());
                            evidence.put("finishedAt", Instant.now().toString());
                        }
                        super.onClose(status, trailers);
                    }
                }, headers);
            }
        };
    }
}
