package com.toonlira.application.forum.usecase;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.forum.port.ForumRepositoryPort;
import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.domain.forum.entity.ForumTopic;
import com.toonlira.domain.forum.valueobject.ForumCategory;
import com.toonlira.domain.user.entity.User;
import com.toonlira.shared.application.i18n.LocaleResolutionService;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Cria um novo tópico no fórum (MongoDB). Requer autenticação.
 * <p>
 * O autor é gravado como snapshot ({@code authorId}/{@code authorName}/
 * {@code authorPhoto}), padrão dos UGC do Mongo.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class CreateForumTopicUseCase {
    private final ForumRepositoryPort forumRepository;
    private final UserRepositoryPort userRepository;
    private final LocaleResolutionService localeResolver;

    public record CreateTopicInput(UUID userId, String title, String content, ForumCategory category, List<String> tags) {}

    public ForumTopic execute(CreateTopicInput input) {
        User author = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));

        LocalDateTime now = LocalDateTime.now();

        ForumTopic topic = ForumTopic.builder()
                .authorId(author.getId().toString())
                .authorName(author.getName())
                .authorPhoto(author.getPhotoUrl())
                .title(input.title())
                .content(input.content())
                .category(input.category())
                .tags(input.tags() != null ? input.tags() : new ArrayList<>())
                .language(localeResolver.currentLanguageTag())
                .lastActivityAt(now)
                .updatedAt(now)
                .build();

        return forumRepository.save(topic);
    }
}
