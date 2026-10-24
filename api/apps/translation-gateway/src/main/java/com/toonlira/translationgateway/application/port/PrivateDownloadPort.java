package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.rendering.PrivateDownload;
import com.toonlira.translationgateway.domain.rendering.PrivateDownloadRequest;

/** Metadata verification and signing are I/O and must run outside a database transaction. */
public interface PrivateDownloadPort {
    PrivateDownload sign(PrivateDownloadRequest request);
}
