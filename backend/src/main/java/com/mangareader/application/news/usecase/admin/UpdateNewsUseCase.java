package com.mangareader.application.news.usecase.admin;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza uma notícia existente (admin).
 */
@Service
@RequiredArgsConstructor
public class UpdateNewsUseCase {

    private final NewsRepositoryPort newsRepository;

    public NewsItem execute(String newsId, String title, String subtitle, String excerpt,
                            List<String> content, String coverImage, NewsCategory category,
                            List<String> tags, NewsAuthor author, String source,
                            Integer readTime, Boolean isExclusive, Boolean isFeatured) {
        NewsItem news = newsRepository.findById(newsId)
                .orElseThrow(() -> new ResourceNotFoundException("News", "id", newsId));

        if (title != null) news.setTitle(title);
        if (subtitle != null) news.setSubtitle(subtitle);
        if (excerpt != null) news.setExcerpt(excerpt);
        if (content != null) news.setContent(content);
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
