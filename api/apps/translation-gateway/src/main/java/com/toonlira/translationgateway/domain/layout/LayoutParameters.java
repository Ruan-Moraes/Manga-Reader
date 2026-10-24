package com.toonlira.translationgateway.domain.layout;

public final class LayoutParameters {
    public static final String ALGORITHM_REVISION = "white-gutters-1-dedup-1";
    public static final double DUPLICATE_IOU = .95;
    public static final int WHITE_CHANNEL = 240;
    public static final double CLEAR_COVERAGE = .995;
    public static final double MIN_GUTTER_FRACTION = .005;
    public static final double MIN_PANEL_AREA = .02;
    public static final double CONTAINMENT = .9;
    public static final double CONFIDENCE = .5;
    public static final int MAX_PANELS = 128;
    public static final int MAX_BUBBLES = 256;
    public static final int MAX_ASSOCIATIONS = 1024;
    public static final int MAX_BYTES = 1024 * 1024;

    private LayoutParameters() { }
}
