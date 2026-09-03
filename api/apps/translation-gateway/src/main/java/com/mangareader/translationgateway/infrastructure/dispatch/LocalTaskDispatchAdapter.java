package com.mangareader.translationgateway.infrastructure.dispatch;

import com.mangareader.translationgateway.application.port.TaskDispatchPort;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "gateway.dispatch", name = "mode", havingValue = "local-ack")
public class LocalTaskDispatchAdapter implements TaskDispatchPort {
    @Override
    public DispatchResult dispatch(UUID jobRef) {
        return DispatchResult.CREATED;
    }
}
