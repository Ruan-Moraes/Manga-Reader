package com.mangareader.application.user.usecase;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.entity.ViewHistory;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.shared.application.i18n.LocaleResolutionService;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Registra visualização de um título no histórico do usuário.
 * <p>
 * Upsert: se (userId, titleId) já existe, atualiza viewedAt. Não registra se
 * viewHistoryVisibility == DO_NOT_TRACK.
 * <p>
 * Trata corrida entre requisições concorrentes (ex.: front disparando a mesma
 * chamada duas vezes, como o double-invoke do React StrictMode em dev): dentro
 * de {@code @Transactional("mongoTransactionManager")}, duas inserções
 * concorrentes do mesmo documento não colidem como {@link DataIntegrityViolationException}
 * simples (E11000) — o MongoDB detecta o conflito antes disso, na camada de
 * transação/storage engine, e retorna {@code WriteConflict} (código 112,
 * {@code TransientTransactionError}), que o Spring também traduz para
 * {@code DataIntegrityViolationException}. Por isso o catch cobre essa
 * superclasse (que também cobre {@code DuplicateKeyException}), e a
 * recuperação NÃO tenta um segundo {@code save()} na mesma transação — a
 * transação perdedora já está em estado de conflito, então só recarrega o
 * documento vencedor sem escrever de novo (whichever ganhou já registrou um
 * {@code viewedAt} praticamente no mesmo instante).
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class RecordViewHistoryUseCase {
    private final UserRepositoryPort userRepository;
    private final ViewHistoryRepositoryPort viewHistoryRepository;
    private final TitleRepositoryPort titleRepository;
    private final LocaleResolutionService localeResolutionService;
    private final UserProfileSettingsResolver profileSettingsResolver;

    public void execute(UUID userId, String titleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        UserProfileSettings settings = profileSettingsResolver.getOrDefault(user);

        if (settings.getViewHistoryVisibility() == VisibilitySetting.DO_NOT_TRACK) {
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

            return;
        }

        ViewHistory vh = ViewHistory.builder()
                .userId(userIdStr)
                .titleId(titleId)
                .titleName(localeResolutionService.resolve(title.getName()))
                .titleCover(title.getCover())
                .viewedAt(LocalDateTime.now())
                .build();

        try {
            viewHistoryRepository.save(vh);
        } catch (DataIntegrityViolationException e) {
            // Corrida: outra requisição criou o mesmo documento entre o check
            // e o save (DuplicateKeyException) ou colidiu na própria transação
            // (WriteConflict). Em ambos os casos, não tenta escrever de novo
            // nesta transação — a requisição concorrente já registrou o
            // viewedAt, praticamente no mesmo instante.
            viewHistoryRepository.findByUserIdAndTitleId(userIdStr, titleId).orElseThrow(() -> e);
        }
    }
}
