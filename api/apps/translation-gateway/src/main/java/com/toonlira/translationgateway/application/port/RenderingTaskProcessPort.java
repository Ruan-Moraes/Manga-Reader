package com.toonlira.translationgateway.application.port;

/** Whole-page process boundary. Persistence remains in the supervising JVM. */
public interface RenderingTaskProcessPort {
    void execute(RenderingJobRepository.WorkItem job);
}
