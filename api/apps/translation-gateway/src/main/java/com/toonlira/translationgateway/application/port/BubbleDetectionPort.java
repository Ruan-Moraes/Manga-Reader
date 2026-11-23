package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.layout.Bubble;
import com.toonlira.translationgateway.domain.layout.Detections;
import com.toonlira.translationgateway.domain.layout.PixelImage;
import java.time.Duration;
import java.util.List;

public interface BubbleDetectionPort {
    List<Bubble> detect(PixelImage image, Duration remaining);

    /** Balloons plus text boxes; detectors without text classes report balloons only. */
    default Detections detectAll(PixelImage image, Duration remaining) {
        return new Detections(detect(image, remaining), List.of());
    }
}
