package com.toonlira.translationgateway.application.port;

import java.util.UUID;

public interface TaskDispatchPort {
    DispatchResult dispatch(UUID jobRef);

    enum DispatchResult {
        CREATED,
        ALREADY_EXISTS
    }
}
