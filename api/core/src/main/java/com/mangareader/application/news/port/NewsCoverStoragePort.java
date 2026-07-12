package com.mangareader.application.news.port;

import java.net.URI;

/** Extensão planejada para substituir URLs externas por object storage. */
public interface NewsCoverStoragePort {
    URI store(String newsId, byte[] content, String contentType);
    void delete(URI coverUri);
}
