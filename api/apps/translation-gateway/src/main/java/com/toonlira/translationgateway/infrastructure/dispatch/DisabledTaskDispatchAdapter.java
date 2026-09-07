package com.toonlira.translationgateway.infrastructure.dispatch;

import com.toonlira.translationgateway.application.port.TaskDispatchPort;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "gateway.dispatch", name = "mode", havingValue = "disabled", matchIfMissing = true)
public class DisabledTaskDispatchAdapter implements TaskDispatchPort {
    @Override
    public DispatchResult dispatch(UUID jobRef) {
        throw new IllegalStateException("Dispatch is disabled");
    }
}
