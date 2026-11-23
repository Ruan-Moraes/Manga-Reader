package com.toonlira.translationgateway.application.port;

/** Holds one-page ownership until work and cancellation have actually ended. */
public interface VolatileSessionPort {
    interface Fence { void checkActive(); }
    void execute(java.util.function.Consumer<Fence> operation, Runnable cancellation);
}
