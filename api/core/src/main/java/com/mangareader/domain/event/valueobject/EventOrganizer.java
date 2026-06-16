package com.mangareader.domain.event.valueobject;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Organizador de um evento (PostgreSQL, tabela {@code event_organizers}).
 * <p>
 * Era um {@code @Embeddable} em {@code events}; normalizado (BCNF-01) para entidade própria,
 * referenciada por FK {@code events.organizer_ref}, de modo que os dados de um organizador
 * vivam uma única vez e fiquem consistentes entre todos os seus eventos.
 * <p>
 * Nomes de campo preservados do VO original; {@code organizerId} é a chave externa de negócio
 * ({@code external_id}, única). Compatível com o frontend ({@code EventData.organizer}).
 */
@Entity
@Table(name = "event_organizers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventOrganizer {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "external_id", unique = true)
    private String organizerId;

    @Column(name = "name")
    private String organizerName;

    @Column(name = "avatar")
    private String organizerAvatar;

    @Column(name = "profile_link")
    private String organizerProfileLink;

    @Column(name = "contact")
    private String organizerContact;
}
