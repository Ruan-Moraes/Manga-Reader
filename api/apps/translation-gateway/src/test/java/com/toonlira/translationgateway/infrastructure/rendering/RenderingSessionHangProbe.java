package com.toonlira.translationgateway.infrastructure.rendering;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.CountDownLatch;

/** Test-owned JVM whose stream ignores interrupt and close. */
public final class RenderingSessionHangProbe {
    public static void main(String[] args) throws Exception {
        RenderingSessionProtocol.read(System.in, RenderingSessionProtocol.Start.class);
        if (Files.exists(Path.of("success"))) {
            RenderingSessionProtocol.write(System.out, new RenderingSessionProtocol.Request("DONE", null, null));
            RenderingSessionProtocol.read(System.in, RenderingSessionProtocol.Reply.class);
            return;
        }
        var entered = new CountDownLatch(1);
        var stream = new InputStream() {
            @Override public int read() {
                entered.countDown();
                while (true) {
                    try { new CountDownLatch(1).await(); } catch (InterruptedException ignored) { }
                }
            }
            @Override public void close() { }
        };
        var reader = Thread.ofPlatform().start(stream::read);
        entered.await(); reader.interrupt(); stream.close();
        Files.writeString(Path.of("blocked"), "interrupt-and-close-ignored");
        reader.join();
    }
}
