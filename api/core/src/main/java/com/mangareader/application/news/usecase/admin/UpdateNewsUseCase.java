package com.mangareader.application.news.usecase.admin;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza uma notícia existente (admin). Mapas multilíngues; nulos mantêm valor.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class UpdateNewsUseCase {
    private final NewsRepositoryPort newsRepository;

    public NewsItem execute(String newsId,
                            Map<String, String> title, Map<String, String> subtitle,
                            Map<String, String> excerpt,
                            Map<String, List<String>> content,
                            String coverImage, NewsCategory category,
                            List<String> tags, NewsAuthor author, String source,
                            Integer readTime, Boolean isExclusive, Boolean isFeatured) {
        NewsItem news = newsRepository.findById(newsId)
                .orElseThrow(() -> new ResourceNotFoundException("News", "id", newsId));

        if (title != null) news.setTitle(LocalizedString.of(title));
        if (subtitle != null) news.setSubtitle(LocalizedString.of(subtitle));
        if (excerpt != null) news.setExcerpt(LocalizedString.of(excerpt));
        if (content != null) news.setContent(LocalizedStringList.of(content));
        if (coverImage != null) news.setCoverImage(coverImage);
        if (category != null) news.setCategory(category);
        if (tags != null) news.setTags(tags);
        if (author != null) news.setAuthor(author);
        if (source != null) news.setSource(source);
        if (readTime != null) news.setReadTime(readTime);
        if (isExclusive != null) news.setExclusive(isExclusive);
        if (isFeatured != null) news.setFeatured(isFeatured);

        return newsRepository.save(news);
    }
}
