package com.toonlira.translationgateway.infrastructure.ocr;

import com.google.api.gax.core.NoCredentialsProvider;
import com.google.cloud.vision.v1.BatchAnnotateImagesRequest;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.ImageAnnotatorSettings;
import com.toonlira.translationgateway.domain.OcrLimits;
import io.grpc.MethodDescriptor;
import io.grpc.Server;
import io.grpc.ServerServiceDefinition;
import io.grpc.netty.shaded.io.grpc.netty.NettyServerBuilder;
import io.grpc.protobuf.ProtoUtils;
import io.grpc.stub.ServerCalls;
import io.grpc.stub.StreamObserver;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.BiConsumer;

/** Local synthetic service only: no ADC, GCS access or provider connection. */
public final class FakeVisionServer implements AutoCloseable {
    public final AtomicInteger calls = new AtomicInteger();
    public volatile BatchAnnotateImagesRequest lastRequest;
    public volatile BiConsumer<BatchAnnotateImagesRequest, StreamObserver<BatchAnnotateImagesResponse>> handler;
    private final Server server;

    public FakeVisionServer() throws IOException {
        handler = (request, observer) -> {
            observer.onNext(VisionResponseMapperTest.response());
            observer.onCompleted();
        };
        var method = MethodDescriptor.<BatchAnnotateImagesRequest, BatchAnnotateImagesResponse>newBuilder()
            .setType(MethodDescriptor.MethodType.UNARY)
            .setFullMethodName("google.cloud.vision.v1.ImageAnnotator/BatchAnnotateImages")
            .setRequestMarshaller(ProtoUtils.marshaller(BatchAnnotateImagesRequest.getDefaultInstance()))
            .setResponseMarshaller(ProtoUtils.marshaller(BatchAnnotateImagesResponse.getDefaultInstance())).build();
        server = NettyServerBuilder.forAddress(new InetSocketAddress("127.0.0.1", 0))
            .addService(ServerServiceDefinition.builder("google.cloud.vision.v1.ImageAnnotator")
                .addMethod(method, ServerCalls.asyncUnaryCall((request, observer) -> {
                    calls.incrementAndGet();
                    lastRequest = request;
                    handler.accept(request, observer);
                })).build()).build().start();
    }

    public ImageAnnotatorClient client(Duration deadline) throws IOException {
        return client(deadline, null);
    }

    public ImageAnnotatorClient client(Duration deadline, EvaluationVisionCapture capture) throws IOException {
        var settings = VisionClientFactory.settings().setEndpoint("127.0.0.1:" + server.getPort())
            .setCredentialsProvider(NoCredentialsProvider.create())
            .setTransportChannelProvider(ImageAnnotatorSettings.defaultGrpcTransportProviderBuilder()
                .setMaxInboundMessageSize(OcrLimits.MAX_RESPONSE_BYTES)
                .setInterceptorProvider(() -> capture == null ? List.of() : List.of(capture))
                .setChannelConfigurator(channel -> VisionClientFactory.configureChannel(channel).usePlaintext()).build());
        var call = settings.batchAnnotateImagesSettings();
        call.setRetrySettings(call.getRetrySettings().toBuilder().setInitialRpcTimeoutDuration(deadline)
            .setMaxRpcTimeoutDuration(deadline).setTotalTimeoutDuration(deadline).build());
        return ImageAnnotatorClient.create(settings.build());
    }

    @Override
    public void close() throws InterruptedException {
        server.shutdownNow().awaitTermination(5, TimeUnit.SECONDS);
    }
}
