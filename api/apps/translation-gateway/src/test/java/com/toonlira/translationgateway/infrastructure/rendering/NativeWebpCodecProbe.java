package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Arrays;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicReference;

/** Explicit Linux test main; no Spring, SDK, credentials or real images. */
public final class NativeWebpCodecProbe {
    private NativeWebpCodecProbe() { }
    public static void main(String[] arguments) throws Exception {
        if(arguments.length!=5)throw new AssertionError("native-probe-configuration");
        var policy=RenderPolicy.initial(); var work=Path.of(arguments[4]);
        try(var codec=new NativeWebpCodec(Path.of(arguments[0]),arguments[1],Path.of(arguments[2]),arguments[3],Duration.ofSeconds(60))) {
            var foreign=new AtomicReference<Throwable>();
            var thread=Thread.ofPlatform().start(()-> {
                try {codec.close();foreign.set(new AssertionError("foreign-close-accepted"));}
                catch(RenderCodecException error){foreign.set(error);}
            }); thread.join();
            check(foreign.get() instanceof RenderCodecException && foreign.get().getMessage().equals("codec-unavailable")
                && foreign.get().getCause()==null,"foreign-thread-lifetime");
            for(int[] dimensions : new int[][]{{1,1},{13,17},{320,220}}) {
                int width=dimensions[0],height=dimensions[1];
                try(var source=new NativeArgbRaster(width,height,policy);var decoded=new NativeArgbRaster(width,height,policy)) {
                    var image=source.image();
                    for(int y=0;y<height;y++)for(int x=0;x<width;x++)image.setRGB(x,y,
                        ((x+y)%5==0?0:(x*17+y*5)&255)<<24 | ((x*31+y*7)&255)<<16 | ((x*19+y*11)&255)<<8 | (x*13+y*23)&255);
                    int[] expected=image.getRGB(0,0,width,height,null,0,width);
                    long address=source.pixels().address();
                    var result=codec.encode(source,work,policy);
                    check(address==source.pixels().address(),"source-buffer-changed");
                    check(Arrays.equals(expected,image.getRGB(0,0,width,height,null,0,width)),"source-pixels-changed");
                    if(width>1&&height>1)for(var limit:new String[]{"width","height","pixels"}) {
                        var restricted=new RenderPolicy("restricted-1.0",policy.maxOriginalBytes(),
                            limit.equals("width")?width-1:policy.maxWidthPx(),
                            limit.equals("height")?height-1:policy.maxHeightPx(),
                            limit.equals("pixels")?(long)width*height-1:policy.maxPixels(),
                            policy.maxOutputBytes(),policy.maxManifestBytes(),12,48,2);
                        long before;
                        try(var paths=Files.list(work)){before=paths.count();}
                        checkFailure(()->codec.encode(source,work,restricted),"codec-invalid-media");
                        try(var paths=Files.list(work)){check(paths.count()==before,"invalid-media-file-leak");}
                        check(address==source.pixels().address()
                            &&Arrays.equals(expected,image.getRGB(0,0,width,height,null,0,width)),"invalid-media-mutated-source");
                    }
                    long destination=decoded.pixels().address();
                    codec.decodeInto(result.path(),result.image(),policy,decoded);
                    check(destination==decoded.pixels().address(),"decode-buffer-changed");
                    check(Arrays.equals(expected,decoded.image().getRGB(0,0,width,height,null,0,width)),"round-trip-mismatch");
                    var tinyOutput=new RenderPolicy("source-budget-1.0",policy.maxOriginalBytes(),policy.maxWidthPx(),
                        policy.maxHeightPx(),policy.maxPixels(),1,policy.maxManifestBytes(),12,48,2);
                    codec.decodeOriginalInto(result.path(),new RenderSource("image/webp",result.image().byteSize(),width,height,
                        result.image().sha256()),tinyOutput,decoded);
                    check(Arrays.equals(expected,decoded.image().getRGB(0,0,width,height,null,0,width)),"input-budget-coupled-to-output");
                    var capacityField=NativeWebpCodec.class.getDeclaredField("CAPACITY");capacityField.setAccessible(true);
                    var capacity=(Semaphore)capacityField.get(null);capacity.acquire();
                    try {checkFailure(()->codec.encode(source,work,policy),"codec-busy");}
                    finally {capacity.release();}
                    checkFailure(()->codec.decodeInto(result.path(),new RenderedImage("image/webp",result.image().byteSize(),width,height,"0".repeat(64)),policy,decoded),"codec-invalid-media");
                    if(width==320)Files.copy(result.path(),work.resolve("independent-decode.webp"));
                    Files.delete(result.path());
                    checkFailure(()->codec.decodeInto(work.resolve("missing.webp"),result.image(),policy,decoded),"codec-invalid-media");
                    var limited=new RenderPolicy("test-1.0",policy.maxOriginalBytes(),policy.maxWidthPx(),policy.maxHeightPx(),
                        policy.maxPixels(),1,policy.maxManifestBytes(),12,48,2);
                    checkFailure(()->codec.encode(source,work,limited),"codec-output-limit");
                    Thread.currentThread().interrupt();
                    try {checkFailure(()->codec.encode(source,work,policy),"codec-unavailable");}
                    finally {check(Thread.interrupted(),"interrupt-cleared");}
                }
            }
            check(codec.toString().equals("NativeWebpCodec[redacted]"),"sensitive-to-string");
        }
        checkFailure(()->new NativeWebpCodec(Path.of(arguments[0]),"0".repeat(64),Path.of(arguments[2]),arguments[3],Duration.ofSeconds(1)),"codec-configuration");
        try(var immediate=new NativeWebpCodec(Path.of(arguments[0]),arguments[1],Path.of(arguments[2]),arguments[3],Duration.ofNanos(1));
            var source=new NativeArgbRaster(13,17,policy)) {
            checkFailure(()->immediate.encode(source,work,policy),"codec-timeout");
        }
        var closed=new NativeWebpCodec(Path.of(arguments[0]),arguments[1],Path.of(arguments[2]),arguments[3],Duration.ofSeconds(1));
        closed.close();closed.close();
        checkFailure(()->closed.encode(null,work,policy),"codec-unavailable");
        try(var paths=Files.list(work)){check(paths.count()==1,"partial-file-leak");}
        System.out.println("native-codec-probe: exact-alpha-hidden-rgb; borrowed-argb; external-bgra; limits; interrupt; cleanup passed");
    }
    private static void checkFailure(Runnable task,String code) {
        try { task.run();throw new AssertionError("expected-sanitized-failure"); }
        catch(RenderCodecException error){check(code.equals(error.getMessage())&&error.getCause()==null,"unexpected-failure");}
    }
    private static void check(boolean success,String code) {if(!success)throw new AssertionError(code);}
}
