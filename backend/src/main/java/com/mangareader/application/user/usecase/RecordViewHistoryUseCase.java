package com.mangareader.application.user.usecase;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.ViewHistory;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Registra visualização de um título no histórico do usuário.
 * <p>
 * Upsert: se (userId, titleId) já existe, atualiza viewedAt.
 * Não registra se viewHistoryVisibility == DO_NOT_TRACK.
 */
@Service
@RequiredArgsConstructor
public class RecordViewHistoryUseCase {

    private final UserRepositoryPort userRepository;
    private final ViewHistoryRepositoryPort viewHistoryRepository;
    private final TitleRepositoryPort titleRepository;

    public void execute(UUID userId, String titleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getViewHistoryVisibility() == VisibilitySetting.DO_NOT_TRACK) {
            return;
        }

        Title title = titleRepository.findById(titleId)
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", titleId));

        String userIdStr = userId.toString();
        var existing = viewHistoryRepository.findByUserIdAndTitleId(userIdStr, titleId);

        if (existing.isPresent()) {
            ViewHistory vh = existing.get();
            vh.setViewedAt(LocalDateTime.now());
            viewHistoryRepository.save(vh);
        } else {
            ViewHistory vh = ViewHistory.builder()
                    .userId(userIdStr)
                    .titleId(titleId)
                    .titleName(title.getName())
                    .titleCover(title.getCover())
                    .viewedAt(LocalDateTime.now())
                    .build();
            viewHistoryRepository.save(vh);
        }
    }
}
