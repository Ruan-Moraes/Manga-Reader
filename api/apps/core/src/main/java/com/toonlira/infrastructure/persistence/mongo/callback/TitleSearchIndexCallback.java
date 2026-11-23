package com.toonlira.infrastructure.persistence.mongo.callback;

import org.springframework.data.mongodb.core.mapping.event.BeforeConvertCallback;
import org.springframework.stereotype.Component;

import com.toonlira.application.manga.service.TitleSearchText;
import com.toonlira.domain.manga.entity.Title;

@Component
public class TitleSearchIndexCallback implements BeforeConvertCallback<Title> {
    @Override
    public Title onBeforeConvert(Title title, String collection) {
        title.setSearchIndex(TitleSearchText.buildIndex(title.getName(), title.getAliases()));
        return title;
    }
}
