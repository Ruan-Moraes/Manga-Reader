package com.mangareader.domain.event.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import com.mangareader.domain.event.valueobject.EventLocation;
import com.mangareader.domain.event.valueobject.EventOrganizer;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.event.valueobject.EventTimeline;
import com.mangareader.domain.event.valueobject.EventType;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Evento da plataforma (PostgreSQL).
 * <p>
 * Compatível com o frontend ({@code EventData} em event.types.ts).
 */
@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 500)
    private String subtitle;

    @Column(length = 5000)
    private String description;

    private String image;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> gallery = new ArrayList<>();

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(length = 50)
    private String timezone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventTimeline timeline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EventStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventType type;

    @Embedded
    private EventLocation location;

    @Embedded
    private EventOrganizer organizer;

    @Column(name = "price_label", length = 100)
    private String priceLabel;

    @Builder.Default
    private int participants = 0;

    @Builder.Default
    private int interested = 0;

    @Column(name = "is_featured")
    @Builder.Default
    private boolean isFeatured = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> schedule = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "special_guests", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> specialGuests = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EventTicket> tickets = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "social_links", columnDefinition = "jsonb")
    private Object socialLinks;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "related_event_ids", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> relatedEventIds = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
