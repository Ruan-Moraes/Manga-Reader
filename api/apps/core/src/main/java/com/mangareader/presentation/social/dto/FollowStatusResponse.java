package com.mangareader.presentation.social.dto;

import com.mangareader.application.social.port.SocialGraphPort.ProfileSocial;

/**
 * Estado do follow após POST/DELETE (DT-48) — permite reconciliação otimista
 * no frontend (padrão do voto de resenha).
 */
public record FollowStatusResponse(boolean following, long followersCount) {

    public static FollowStatusResponse from(ProfileSocial social) {
        return new FollowStatusResponse(social.followedByViewer(), social.followers());
    }
}
