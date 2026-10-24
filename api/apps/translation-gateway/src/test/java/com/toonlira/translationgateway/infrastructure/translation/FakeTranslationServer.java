package com.toonlira.translationgateway.infrastructure.translation;

import com.google.api.gax.core.NoCredentialsProvider;
import com.google.cloud.translate.v3.TranslateTextRequest;
import com.google.cloud.translate.v3.TranslateTextResponse;
import com.google.cloud.translate.v3.TranslationServiceClient;
import com.google.cloud.translate.v3.TranslationServiceSettings;
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
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.BiConsumer;

/** Synthetic loopback service only; no credentials or Google connection. */
public final class FakeTranslationServer implements AutoCloseable {
    public final AtomicInteger calls = new AtomicInteger();
    public volatile TranslateTextRequest lastRequest;
    public volatile BiConsumer<TranslateTextRequest, StreamObserver<TranslateTextResponse>> handler;
    private final Server server;

    public FakeTranslationServer() throws IOException {
        handler = (request, observer) -> {
            var response = TranslateTextResponse.newBuilder();
            response.addTranslationsBuilder().setModel(request.getModel()).setTranslatedText(request.getContents(0));
            observer.onNext(response.build());
            observer.onCompleted();
        };
        var method = MethodDescriptor.<TranslateTextRequest, TranslateTextResponse>newBuilder()
            .setType(MethodDescriptor.MethodType.UNARY)
            .setFullMethodName("google.cloud.translation.v3.TranslationService/TranslateText")
            .setRequestMarshaller(ProtoUtils.marshaller(TranslateTextRequest.getDefaultInstance()))
            .setResponseMarshaller(ProtoUtils.marshaller(TranslateTextResponse.getDefaultInstance())).build();
        server = NettyServerBuilder.forAddress(new InetSocketAddress("127.0.0.1", 0))
            .addService(ServerServiceDefinition.builder("google.cloud.translation.v3.TranslationService")
                .addMethod(method, ServerCalls.asyncUnaryCall((request, observer) -> {
                    calls.incrementAndGet();
                    lastRequest = request;
                    handler.accept(request, observer);
                })).build()).build().start();
    }

    public TranslationServiceClient client(Duration deadline) throws IOException {
        var settings = TranslationClientFactory.settings().setEndpoint("127.0.0.1:" + server.getPort())
            .setCredentialsProvider(NoCredentialsProvider.create())
            .setTransportChannelProvider(TranslationServiceSettings.defaultGrpcTransportProviderBuilder()
                .setMaxInboundMessageSize(TranslationClientFactory.MAX_RESPONSE_BYTES)
                .setChannelConfigurator(channel -> TranslationClientFactory.configureChannel(channel).usePlaintext()).build());
        var call = settings.translateTextSettings();
        call.setRetrySettings(call.getRetrySettings().toBuilder().setInitialRpcTimeoutDuration(deadline)
            .setMaxRpcTimeoutDuration(deadline).setTotalTimeoutDuration(deadline).build());
        return TranslationServiceClient.create(settings.build());
    }

    @Override
    public void close() throws InterruptedException {
        if (!server.shutdown().awaitTermination(5, TimeUnit.SECONDS)) {
            server.shutdownNow().awaitTermination(5, TimeUnit.SECONDS);
        }
    }
}
