package com.mangareader.domain.group.valueobject;

/**
 * Tipo de vínculo entre um usuário e um grupo.
 * <p>
 * MEMBER — integrante efetivo da equipe de tradução.
 * SUPPORTER — acompanha/apoia o grupo sem fazer parte da equipe.
 */
public enum GroupUserType {
    MEMBER,
    SUPPORTER
}
