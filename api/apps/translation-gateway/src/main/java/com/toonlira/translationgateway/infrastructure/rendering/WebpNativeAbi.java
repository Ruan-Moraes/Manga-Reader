package com.toonlira.translationgateway.infrastructure.rendering;

import static java.lang.foreign.ValueLayout.ADDRESS;
import static java.lang.foreign.ValueLayout.JAVA_FLOAT;
import static java.lang.foreign.ValueLayout.JAVA_INT;
import java.lang.foreign.MemoryLayout;
import java.lang.foreign.StructLayout;
import java.util.ArrayList;

/** Official libwebp 1.6.0 LP64 layouts, checked against upstream AArch64 DWARF. */
final class WebpNativeAbi {
    static final int ENCODER_VERSION = 0x0210;
    static final StructLayout CONFIG = structure(
        integer("lossless"), JAVA_FLOAT.withName("quality"), integer("method"), integer("image_hint"),
        integer("target_size"), JAVA_FLOAT.withName("target_PSNR"), integer("segments"), integer("sns_strength"),
        integer("filter_strength"), integer("filter_sharpness"), integer("filter_type"), integer("autofilter"),
        integer("alpha_compression"), integer("alpha_filtering"), integer("alpha_quality"), integer("pass"),
        integer("show_compressed"), integer("preprocessing"), integer("partitions"), integer("partition_limit"),
        integer("emulate_jpeg_size"), integer("thread_level"), integer("low_memory"), integer("near_lossless"),
        integer("exact"), integer("use_delta_palette"), integer("use_sharp_yuv"), integer("qmin"), integer("qmax"));
    static final StructLayout PICTURE = structure(
        integer("use_argb"), integer("colorspace"), integer("width"), integer("height"),
        pointer("y"), pointer("u"), pointer("v"), integer("y_stride"), integer("uv_stride"),
        pointer("a"), integer("a_stride"), integers("pad1", 2), pointer("argb"), integer("argb_stride"),
        integers("pad2", 3), pointer("writer"), pointer("custom_ptr"), integer("extra_info_type"),
        pointer("extra_info"), pointer("stats"), integer("error_code"), pointer("progress_hook"),
        pointer("user_data"), integers("pad3", 3), pointer("pad4"), pointer("pad5"), integers("pad6", 8),
        pointer("memory_"), pointer("memory_argb_"), MemoryLayout.sequenceLayout(2, ADDRESS).withName("pad7"));
    private WebpNativeAbi() { }
    private static MemoryLayout integer(String name) { return JAVA_INT.withName(name); }
    private static MemoryLayout pointer(String name) { return ADDRESS.withName(name); }
    private static MemoryLayout integers(String name, int count) { return MemoryLayout.sequenceLayout(count, JAVA_INT).withName(name); }
    private static StructLayout structure(MemoryLayout... fields) {
        var members = new ArrayList<MemoryLayout>();
        long offset = 0, alignment = 1;
        for (var field : fields) {
            long padding = (field.byteAlignment() - offset % field.byteAlignment()) % field.byteAlignment();
            if (padding != 0) members.add(MemoryLayout.paddingLayout(padding));
            members.add(field); offset += padding + field.byteSize(); alignment = Math.max(alignment, field.byteAlignment());
        }
        long padding = (alignment - offset % alignment) % alignment;
        if (padding != 0) members.add(MemoryLayout.paddingLayout(padding));
        return MemoryLayout.structLayout(members.toArray(MemoryLayout[]::new));
    }
}
