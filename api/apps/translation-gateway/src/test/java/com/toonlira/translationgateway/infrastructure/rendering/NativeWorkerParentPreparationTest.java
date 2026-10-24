package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

import java.io.OutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class NativeWorkerParentPreparationTest {
    @TempDir Path temporary;

    @Test void confirmsOnlyAfterSuccessfulExitAndAlwaysReapsHelper() throws Exception {
        var process = process(true, 0);
        NativeWorkerParentPreparation.runOwnedHelper(temporary, directory -> {
            Files.write(directory.resolve(NativeWorkerParentLimitMain.CONFIRMATION), NativeWorkerParentLimitMain.confirmation());
            return process;
        });
        verify(process).destroyForcibly(); verify(process).waitFor();
        assertThat(Files.exists(temporary.resolve(NativeWorkerParentLimitMain.CONFIRMATION))).isTrue();
    }

    @Test void timeoutFailureOrMalformedConfirmationNeverBecomesApproval() throws Exception {
        for (int fault = 0; fault < 3; fault++) {
            var process = process(fault != 0, fault == 1 ? 1 : 0);
            assertThatThrownBy(() -> NativeWorkerParentPreparation.runOwnedHelper(temporary, directory -> {
                Files.write(directory.resolve(NativeWorkerParentLimitMain.CONFIRMATION), new byte[13]); return process;
            })).hasMessage("render-configuration").hasNoCause();
            verify(process).destroyForcibly(); verify(process).waitFor();
            Files.delete(temporary.resolve(NativeWorkerParentLimitMain.CONFIRMATION));
        }
    }

    private static Process process(boolean completed, int exit) throws Exception {
        var process = mock(Process.class);
        when(process.getOutputStream()).thenReturn(OutputStream.nullOutputStream());
        when(process.waitFor(10, TimeUnit.SECONDS)).thenReturn(completed);
        when(process.exitValue()).thenReturn(exit);
        when(process.waitFor()).thenReturn(exit);
        return process;
    }

    @Test void interruptionIsPreservedAndHelperIsReapedBeforeReturning() throws Exception {
        var process = process(true, 0);
        when(process.waitFor(10, TimeUnit.SECONDS)).thenThrow(new InterruptedException("private diagnostic"));
        try {
            assertThatThrownBy(() -> NativeWorkerParentPreparation.runOwnedHelper(temporary, directory -> process))
                .hasMessage("render-configuration").hasNoCause();
            assertThat(Thread.currentThread().isInterrupted()).isTrue();
            verify(process).destroyForcibly(); verify(process).waitFor();
        } finally { Thread.interrupted(); }
    }

    @Test void missingSymlinkedConfirmationOrFailedStartIsSanitized() throws Exception {
        assertThatThrownBy(() -> NativeWorkerParentPreparation.runOwnedHelper(temporary,
            directory -> { throw new IOException("private executable path"); })).hasMessage("render-configuration").hasNoCause();
        var target = Files.write(temporary.resolve("keep.bin"), NativeWorkerParentLimitMain.confirmation());
        var process = process(true, 0);
        Files.createSymbolicLink(temporary.resolve(NativeWorkerParentLimitMain.CONFIRMATION), target);
        assertThatThrownBy(() -> NativeWorkerParentPreparation.runOwnedHelper(temporary, directory -> process))
            .hasMessage("render-configuration").hasNoCause();
        assertThat(Files.readAllBytes(target)).containsExactly(NativeWorkerParentLimitMain.confirmation());
        verify(process).destroyForcibly(); verify(process).waitFor();
    }
}
