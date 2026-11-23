package com.toonlira.translationgateway.infrastructure.rendering;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/** Loopback-only test helper. No images, credentials, provider endpoints or raw response output. */
public final class NativeImageHttpProbe {
    public static void main(String[] arguments) {
        try (var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build()) {
            if (arguments.length != 0) throw new IllegalArgumentException();
            int health = get(client, "/actuator/health");
            int publicRoute = get(client, "/v1/capabilities");
            var request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:8084/internal/tasks/ocr"))
                .timeout(Duration.ofSeconds(3)).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"jobRef\":\"00000000-0000-0000-0000-000000000001\"}")).build();
            int task = client.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
            if (health != 200 || publicRoute != 403 || task != 503) throw new IllegalStateException();
            System.out.println("{\"health\":200,\"publicRoute\":403,\"disabledOcrTask\":503}");
        } catch (Exception ignored) { System.out.println("{\"failure\":\"native-image-http-probe-failed\"}"); System.exit(1); }
    }
    private static int get(HttpClient client, String path) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:8084" + path))
            .timeout(Duration.ofSeconds(3)).GET().build(), HttpResponse.BodyHandlers.discarding()).statusCode();
    }
}
