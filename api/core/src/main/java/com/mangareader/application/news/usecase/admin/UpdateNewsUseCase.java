package com.mangareader.application.news.usecase.admin;

import java.util.List;
import java.util.Map;
import java.time.Clock;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsSeo;
import com.mangareader.domain.news.valueobject.NewsSlug;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;


/**
 * Atualiza uma notícia existente (admin). Mapas multilíngues; nulos mantêm valor.
 */
@Service
@Transactional("mongoTransactionManager")
public class UpdateNewsUseCase {
    private final NewsRepositoryPort newsRepository;
    private final Clock clock;

    @Autowired
    public UpdateNewsUseCase(NewsRepositoryPort newsRepository, Clock clock) {
        this.newsRepository = newsRepository;
        this.clock = clock;
    }

    public UpdateNewsUseCase(NewsRepositoryPort newsRepository) {
        this(newsRepository, Clock.systemUTC());
    }

    public NewsItem execute(UpdateNewsCommand command) {
        NewsItem news = newsRepository.findById(command.newsId())
                .orElseThrow(() -> new ResourceNotFoundException("News", "id", command.newsId()));

        if (command.title() != null) news.setTitle(LocalizedString.of(command.title()));
        if (command.subtitle() != null) news.setSubtitle(LocalizedString.of(command.subtitle()));
        if (command.excerpt() != null) news.setExcerpt(LocalizedString.of(command.excerpt()));
        if (command.content() != null) news.setContent(LocalizedStringList.of(command.content()));
        if (command.slug() != null) {
            String slug = NewsSlug.from(command.slug());
            if (newsRepository.existsBySlugAndIdNot(slug, news.getId())) {
                throw new IllegalArgumentException("Slug de notícia já está em uso");
            }
            news.setSlug(slug);
        }
        if (command.coverImage() != null) news.setCoverImage(command.coverImage().isBlank() ? null : command.coverImage());
        if (command.coverAlt() != null) news.setCoverAlt(LocalizedString.of(command.coverAlt()));
        if (command.category() != null) news.setCategory(command.category());
        if (command.tags() != null) news.setTags(command.tags());
        if (command.author() != null) news.setAuthor(command.author());
        if (command.source() != null) news.setSource(command.source());
        if (command.readTime() != null) news.setReadTime(command.readTime());
        if (command.isExclusive() != null) news.setExclusive(command.isExclusive());
        if (command.isFeatured() != null) news.setFeatured(command.isFeatured());
        NewsSeo oldSeo = news.getSeo() == null ? NewsSeo.empty() : news.getSeo();
        if (command.seoTitle() != null || command.seoDescription() != null || command.seoKeywords() != null) {
            news.setSeo(new NewsSeo(
                    command.seoTitle() == null ? oldSeo.title() : LocalizedString.of(command.seoTitle()),
                    command.seoDescription() == null ? oldSeo.description() : LocalizedString.of(command.seoDescription()),
                    command.seoKeywords() == null ? oldSeo.keywords() : LocalizedStringList.of(command.seoKeywords())));
        }
        news.setUpdatedAt(clock.instant());
        try {
            return newsRepository.save(news);
        } catch (DuplicateKeyException exception) {
            throw new BusinessRuleException("Slug de notícia já está em uso", 409);
        }
    }

    public NewsItem execute(String newsId,
                            Map<String, String> title, Map<String, String> subtitle,
                            Map<String, String> excerpt,
                            Map<String, List<String>> content,
                            String coverImage, NewsCategory category,
                            List<String> tags, NewsAuthor author, String source,
                            Integer readTime, Boolean isExclusive, Boolean isFeatured) {
        return execute(new UpdateNewsCommand(newsId, title, subtitle, excerpt, content, null,
                coverImage, null, category, tags, author, source, readTime, isExclusive, isFeatured,
                null, null, null));
    }

    public record UpdateNewsCommand(
            String newsId, Map<String, String> title, Map<String, String> subtitle,
            Map<String, String> excerpt, Map<String, List<String>> content, String slug,
            String coverImage, Map<String, String> coverAlt, NewsCategory category,
            List<String> tags, NewsAuthor author, String source, Integer readTime,
            Boolean isExclusive, Boolean isFeatured, Map<String, String> seoTitle,
            Map<String, String> seoDescription, Map<String, List<String>> seoKeywords) {}
}
