package com.mangareader.application.news.usecase.admin;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza uma notícia existente (admin). Mapas *I18n, quando presentes,
 * sobrescrevem campos i18n correspondentes.
 */
@Service
@RequiredArgsConstructor
public class UpdateNewsUseCase {
    private final NewsRepositoryPort newsRepository;

    public NewsItem execute(String newsId, String title, String subtitle, String excerpt,
                            List<String> content,
                            Map<String, String> titleI18n,
                            Map<String, String> subtitleI18n,
                            Map<String, String> excerptI18n,
                            Map<String, List<String>> contentI18n,
                            String coverImage, NewsCategory category,
                            List<String> tags, NewsAuthor author, String source,
                            Integer readTime, Boolean isExclusive, Boolean isFeatured) {
        NewsItem news = newsRepository.findById(newsId)
                .orElseThrow(() -> new ResourceNotFoundException("News", "id", newsId));

        if (title != null) news.setTitle(title);
        if (subtitle != null) news.setSubtitle(subtitle);
        if (excerpt != null) news.setExcerpt(excerpt);
        if (content != null) news.setContent(content);
        if (titleI18n != null) news.setTitleI18n(LocalizedString.of(titleI18n));
        if (subtitleI18n != null) news.setSubtitleI18n(LocalizedString.of(subtitleI18n));
        if (excerptI18n != null) news.setExcerptI18n(LocalizedString.of(excerptI18n));
        if (contentI18n != null) news.setContentI18n(LocalizedStringList.of(contentI18n));
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
