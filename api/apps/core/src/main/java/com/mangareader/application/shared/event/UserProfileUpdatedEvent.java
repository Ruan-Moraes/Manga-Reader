package com.mangareader.application.shared.event;

/**
 * Evento emitido quando o perfil de um usuário é atualizado.
 * <p>
 * Utilizado pelo consumer de desnormalização para propagar
 * alterações de nome/foto nos documentos MongoDB (comments, ratings).
 *
 * @param userId      ID do usuário (UUID como String)
 * @param newName     novo nome (null se não mudou)
 * @param newPhotoUrl nova URL da foto (null se não mudou)
 */
public record UserProfileUpdatedEvent(
        String userId,
        String newName,
        String newPhotoUrl
) {
}
