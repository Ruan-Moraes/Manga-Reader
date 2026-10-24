package com.toonlira.translationgateway.application;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import tools.jackson.databind.node.ObjectNode;
import com.toonlira.translationgateway.application.port.LayoutPort;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.layout.LayoutFailure;
import com.toonlira.translationgateway.domain.layout.Bubble;
import com.toonlira.translationgateway.domain.layout.LayoutBox;
import com.toonlira.translationgateway.domain.layout.LayoutInterpreter;
import com.toonlira.translationgateway.domain.layout.LayoutManifest;
import com.toonlira.translationgateway.domain.layout.LayoutOutcome;
import com.toonlira.translationgateway.domain.layout.ReadingDirection;
import com.toonlira.translationgateway.infrastructure.layout.ComicDetectorModel;
import org.junit.jupiter.api.Test;
import java.nio.file.Path;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ShadowLayoutServiceTest {
    private final LayoutPort port = mock(LayoutPort.class);
    private final ObjectStoragePort storage = mock(ObjectStoragePort.class);
    private final OcrManifest ocr = new OcrManifest("1.0", UUID.randomUUID(), "pt-BR", 10, 10, List.of());
    private final ShadowLayoutService service = new ShadowLayoutService(port, storage, GatewayJsonMapper.create(), Clock.systemUTC());

    @Test void disabledDoesNotAccessImageOrStorage() {
        assertThat(prepare()).isNull();
        verify(port, never()).analyze(any(), any(), any(), any());
        verifyNoInteractions(storage);
    }

    @Test void timeoutAndUnknownNativeFailureAreSanitized() {
        when(port.available()).thenReturn(true);
        when(port.analyze(any(), any(), any(), any())).thenThrow(new LayoutFailure(LayoutFailure.Code.TIMEOUT));
        assertThat(prepare().errorCode()).isEqualTo("layout-timeout");
        doThrow(new IllegalStateException("sensitive provider text")).when(port).analyze(any(), any(), any(), any());
        assertThat(prepare().errorCode()).isEqualTo("layout-unavailable");
        verifyNoInteractions(storage);
    }

    @Test void nullOrHashMismatchedLayoutNeverUploads() {
        when(port.available()).thenReturn(true);
        assertThat(prepare().errorCode()).isEqualTo("layout-invalid-response");
        var result = new LayoutInterpreter().interpret(ocr, "f".repeat(64), "b".repeat(64), ComicDetectorModel.METADATA,
            ReadingDirection.ltr, List.of(), List.of());
        when(port.analyze(any(), any(), any(), any())).thenReturn(result);
        assertThat(prepare().errorCode()).isEqualTo("layout-invalid-response");
        verifyNoInteractions(storage);
    }

    @Test void oversizedArtifactFailsWithoutTruncation() {
        when(port.available()).thenReturn(true);
        var oversized = new LayoutManifest("1.0", "a".repeat(64), "b".repeat(64), "x".repeat(1048576),
            ComicDetectorModel.METADATA, Map.of(), ReadingDirection.ltr, LayoutManifest.State.inconclusive,
            List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
        when(port.analyze(any(), any(), any(), any())).thenReturn(oversized);
        assertThat(prepare().errorCode()).isEqualTo("layout-limit-exceeded");
        verifyNoInteractions(storage);
    }

    @Test void auditedArtifactUploadsButForgedSuppressionNeverDoes() throws Exception {
        when(port.available()).thenReturn(true);
        var result = new LayoutInterpreter().interpret(ocr, "a".repeat(64), "b".repeat(64), ComicDetectorModel.METADATA,
            ReadingDirection.ltr, List.of(), List.of(
                new Bubble("winner", new LayoutBox(0, 0, 1, 1), .9),
                new Bubble("loser", new LayoutBox(0, 0, 1, 1), .8)));
        when(port.analyze(any(), any(), any(), any())).thenReturn(result);
        assertThat(prepare().status()).isEqualTo(LayoutOutcome.Status.SUCCEEDED);
        verify(storage).store(any(), any(), any(), any(), any());
        clearInvocations(storage);
        var mapper = GatewayJsonMapper.create();
        ObjectNode tree = mapper.valueToTree(result);
        ((ObjectNode) tree.get("suppressedBubbles").get(0)).put("retainedBubbleId", "missing");
        when(port.analyze(any(), any(), any(), any())).thenReturn(mapper.treeToValue(tree, LayoutManifest.class));
        assertThat(prepare().errorCode()).isEqualTo("layout-invalid-response");
        verifyNoInteractions(storage);
    }

    @Test void oldArtifactRemainsReadableWithoutSuppressionField() throws Exception {
        var mapper = GatewayJsonMapper.create();
        var result = new LayoutInterpreter().interpret(ocr, "a".repeat(64), "b".repeat(64), ComicDetectorModel.METADATA,
            ReadingDirection.ltr, List.of(), List.of());
        ObjectNode tree = mapper.valueToTree(result);
        tree.put("layoutVersion", "1.0");
        tree.remove("suppressedBubbles");
        when(port.available()).thenReturn(true);
        when(port.analyze(any(), any(), any(), any())).thenReturn(mapper.treeToValue(tree, LayoutManifest.class));
        assertThat(prepare().status()).isEqualTo(LayoutOutcome.Status.SUCCEEDED);
    }

    @Test void uncertainUploadIsRemovedBestEffortAndCannotTurnOcrIntoFailure() {
        when(port.available()).thenReturn(true);
        var result = new LayoutInterpreter().interpret(ocr, "a".repeat(64), "b".repeat(64), ComicDetectorModel.METADATA,
            ReadingDirection.ltr, List.of(), List.of());
        when(port.analyze(any(), any(), any(), any())).thenReturn(result);
        doThrow(new IllegalStateException("upload acknowledgement lost")).when(storage).store(any(), any(), any(), any(), any());
        var outcome = prepare();
        assertThat(outcome.status()).isEqualTo(LayoutOutcome.Status.FAILED);
        assertThat(outcome.objectKey()).isNull();
        assertThat(outcome.errorCode()).isEqualTo("layout-unavailable");
        verify(storage).delete(any());
    }

    private LayoutOutcome prepare() {
        return service.prepare(UUID.randomUUID(), Path.of("missing-image"), ocr, "a".repeat(64), "b".repeat(64));
    }
}
