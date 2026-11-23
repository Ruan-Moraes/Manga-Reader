package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static java.lang.foreign.ValueLayout.JAVA_BYTE;
import java.lang.foreign.Arena;
import java.lang.foreign.MemorySegment;
import java.nio.channels.FileChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class NativeWebpWriterTest {
    @TempDir Path root;
    @Test void chunksAreBoundedCumulativelyAndFailureNeverCrossesCallback() throws Exception {
        var path=root.resolve("output");
        try(var arena=Arena.ofConfined();var channel=FileChannel.open(path,StandardOpenOption.CREATE_NEW,StandardOpenOption.WRITE)) {
            var writer=new NativeWebpCodec.BoundedWriter(channel,4,System.nanoTime(),Duration.ofSeconds(60));
            var data=arena.allocateFrom(JAVA_BYTE,new byte[]{1,2,3});
            assertThat(writer.write(data,3,MemorySegment.NULL)).isEqualTo(1);
            assertThat(writer.write(data,2,MemorySegment.NULL)).isZero();
            assertThat(writer.progress(50,MemorySegment.NULL)).isZero();
            assertThatThrownBy(writer::check).isInstanceOf(RenderCodecException.class).hasMessage("codec-output-limit").hasNoCause();
        }
        assertThat(Files.readAllBytes(path)).containsExactly(1,2,3);
    }
    @Test void closedStorageDoesNotThrowThroughNativeCallback() throws Exception {
        var channel=FileChannel.open(root.resolve("output"),StandardOpenOption.CREATE_NEW,StandardOpenOption.WRITE);channel.close();
        try(var arena=Arena.ofConfined()) {
            var writer=new NativeWebpCodec.BoundedWriter(channel,4,System.nanoTime(),Duration.ofSeconds(60));
            assertThat(writer.write(arena.allocateFrom(JAVA_BYTE,new byte[]{1}),1,MemorySegment.NULL)).isZero();
            assertThatThrownBy(writer::check).isInstanceOf(RenderCodecException.class).hasMessage("codec-unavailable").hasNoCause();
        }
    }
    @Test void timeoutAndInterruptAbortWithoutChangingTheirFailure() throws Exception {
        try(var channel=FileChannel.open(root.resolve("output"),StandardOpenOption.CREATE_NEW,StandardOpenOption.WRITE)) {
            var expired=new NativeWebpCodec.BoundedWriter(channel,4,System.nanoTime()-Duration.ofSeconds(61).toNanos(),Duration.ofSeconds(60));
            assertThat(expired.progress(0,MemorySegment.NULL)).isZero();
            assertThatThrownBy(expired::check).isInstanceOf(RenderCodecException.class).hasMessage("codec-timeout").hasNoCause();
            var interrupted=new NativeWebpCodec.BoundedWriter(channel,4,System.nanoTime(),Duration.ofSeconds(60));
            Thread.currentThread().interrupt();
            try {
                assertThat(interrupted.write(MemorySegment.NULL,1,MemorySegment.NULL)).isZero();
                assertThat(Thread.currentThread().isInterrupted()).isTrue();
                assertThatThrownBy(interrupted::check).isInstanceOf(RenderCodecException.class).hasMessage("codec-unavailable").hasNoCause();
            } finally {Thread.interrupted();}
        }
    }
    @Test void invalidCountsAndNullPointerFailBeforeUnsafeAccess() throws Exception {
        try(var channel=FileChannel.open(root.resolve("output"),StandardOpenOption.CREATE_NEW,StandardOpenOption.WRITE)) {
            for(long count:new long[]{-1,Long.MAX_VALUE}) {
                var writer=new NativeWebpCodec.BoundedWriter(channel,4,System.nanoTime(),Duration.ofSeconds(60));
                assertThat(writer.write(MemorySegment.NULL,count,MemorySegment.NULL)).isZero();
                assertThatThrownBy(writer::check).isInstanceOf(RenderCodecException.class).hasMessage("codec-output-limit").hasNoCause();
            }
            var writer=new NativeWebpCodec.BoundedWriter(channel,4,System.nanoTime(),Duration.ofSeconds(60));
            assertThat(writer.write(MemorySegment.NULL,1,MemorySegment.NULL)).isZero();
            assertThatThrownBy(writer::check).isInstanceOf(RenderCodecException.class).hasMessage("codec-unavailable").hasNoCause();
        }
    }
}
