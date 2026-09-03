package com.mangareader.application.search;

import java.util.List;

public record RelatedTitleResult(
        String id,
        String name,
        String cover,
        String type,
        String status,
        boolean adult,
        List<String> roles
) {
}
