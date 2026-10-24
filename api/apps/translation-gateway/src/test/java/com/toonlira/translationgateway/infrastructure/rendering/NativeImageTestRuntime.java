package com.toonlira.translationgateway.infrastructure.rendering;

/** Explicit diagnostic runtime selection; never changes a production image or its defaults. */
final class NativeImageTestRuntime {
    private NativeImageTestRuntime() { }

    static String executable(String family, String image, String armImage, String amdImage) {
        if (family == null || family.equals("temurin")) return "/opt/java/openjdk/bin/java";
        if (!family.equals("ubuntu") || !pinned(armImage) || !pinned(amdImage)
            || armImage.equals(amdImage)) invalid();
        if (armImage.equals(image)) return "/usr/lib/jvm/java-25-openjdk-arm64/bin/java";
        if (amdImage.equals(image)) return "/usr/lib/jvm/java-25-openjdk-amd64/bin/java";
        invalid(); return null;
    }

    static String configuredExecutable(String image) {
        return executable(System.getProperty("renderer.native.image.runtime"), image,
            System.getProperty("renderer.native.image.arm64.id"), System.getProperty("renderer.native.image.amd64.id"));
    }

    private static boolean pinned(String image) { return image != null && image.matches("sha256:[a-f0-9]{64}"); }
    private static void invalid() { throw new IllegalArgumentException("linux-render-test-configuration"); }
}
