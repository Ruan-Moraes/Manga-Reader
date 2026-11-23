package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.CleanupLifecycleObjectsUseCase;
import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.application.OcrManifestService;
import com.toonlira.translationgateway.application.ProcessRenderingTaskUseCase;
import com.toonlira.translationgateway.application.RenderManifestService;
import com.toonlira.translationgateway.application.TranslationManifestService;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.infrastructure.storage.GoogleCloudStorageAdapter;
import com.toonlira.translationgateway.infrastructure.storage.LocalObjectStorageAdapter;
import java.nio.channels.FileChannel;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Clock;
import java.time.Instant;
import org.springframework.beans.factory.support.StaticListableBeanFactory;

/** No Spring context, SQL, OCR or translation client. Only this owned JVM performs page I/O. */
public final class RenderingTaskChildMain {
    private RenderingTaskChildMain() { }
    public static void main(String[] args) {
        try {
            if (args.length != 0) throw new IllegalStateException();
            var directory = Path.of("").toAbsolutePath().toRealPath();
            try (var channel = FileChannel.open(directory.resolve(".owner.lock"), StandardOpenOption.WRITE, LinkOption.NOFOLLOW_LINKS);
                 var lock = channel.tryLock()) {
                if (lock == null) throw new IllegalStateException();
                var start = RenderingSessionProtocol.read(System.in, RenderingSessionProtocol.Start.class);
                LinuxNativeProcessGuard.apply(NativeProcessLimits.initial());
                if (!Instant.now().isBefore(start.deadline())) throw new IllegalStateException();
                var properties = new GatewayProperties();
                properties.getStorage().setMode(start.storageMode());
                properties.getStorage().setBucket(start.bucket());
                if (start.storageDirectory() != null) properties.getStorage().setLocalDirectory(Path.of(start.storageDirectory()));
                properties.getMedia().setMaxBytes(start.maxBytes());
                properties.getMedia().setMaxWidthPx(start.maxWidth());
                properties.getMedia().setMaxHeightPx(start.maxHeight());
                properties.getMedia().setMaxPixels(start.maxPixels());
                properties.getRendering().setMode(GatewayProperties.Rendering.Mode.LOCAL);
                properties.getRendering().setTemporaryDirectory(directory);
                ObjectStoragePort storage = switch (start.storageMode()) {
                    case "local" -> new LocalObjectStorageAdapter(properties);
                    case "gcs" -> new GoogleCloudStorageAdapter(properties);
                    default -> throw new IllegalStateException();
                };
                storage = new RenderingSessionStorage(storage);
                var codec = new NativeFileRenderAdapter(start.codec(), new PageRasterPainter(new BundledRenderingFonts()), directory);
                var beans = new StaticListableBeanFactory();
                beans.addBean("renderer", codec);
                var mapper = GatewayJsonMapper.create();
                var cleanup = new CleanupLifecycleObjectsUseCase(new RenderingSessionCleanupPersistence(), storage, Clock.systemUTC());
                new ProcessRenderingTaskUseCase(new RenderingSessionPersistence(), storage, new MediaInspectionService(),
                    new OcrManifestService(mapper), new TranslationManifestService(mapper), new RenderManifestService(mapper),
                    beans.getBeanProvider(RenderPort.class), properties, Clock.systemUTC(), cleanup).execute(start.job().jobRef());
                RenderingSessionPersistence.call("DONE", null, null);
            }
        } catch (Throwable unavailable) { System.exit(1); }
    }
}
