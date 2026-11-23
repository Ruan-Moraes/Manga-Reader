package com.toonlira.translationgateway.infrastructure.rendering;

/** Sanitized internal failure; paths, native diagnostics and image data never become causes. */
public final class RenderCodecException extends RuntimeException {
    private static final int NATIVE_ALLOCATION_ERROR = 1, NATIVE_BITSTREAM_ALLOCATION_ERROR = 2;
    public enum Failure {
        CONFIGURATION("codec-configuration"), INVALID_MEDIA("codec-invalid-media"),
        UNAVAILABLE("codec-unavailable"), TIMEOUT("codec-timeout"), BUSY("codec-busy"),
        OUTPUT_LIMIT("codec-output-limit"), CLEANUP_FAILED("codec-cleanup");

        private final String code;
        Failure(String code) { this.code = code; }
    }

    private final Failure failure;
    enum NativeFailure { ALLOCATION, BITSTREAM_ALLOCATION, OTHER }
    private final NativeFailure nativeFailure;

    public RenderCodecException(Failure failure) {
        this(failure, null);
    }

    private RenderCodecException(Failure failure, NativeFailure nativeFailure) {
        super(failure.code);
        this.failure = failure;
        this.nativeFailure = nativeFailure;
    }

    // libwebp 1.6.0 WebPEncodingError: fixed categories only, never raw diagnostics or caller data.
    static RenderCodecException nativeEncodeFailure(int code) {
        return new RenderCodecException(Failure.UNAVAILABLE, switch (code) {
            case NATIVE_ALLOCATION_ERROR -> NativeFailure.ALLOCATION;
            case NATIVE_BITSTREAM_ALLOCATION_ERROR -> NativeFailure.BITSTREAM_ALLOCATION;
            default -> NativeFailure.OTHER;
        });
    }
    NativeFailure nativeFailure() { return nativeFailure; }

    public Failure failure() { return failure; }
}
