ALTER TABLE users
    ADD CONSTRAINT chk_users_role
        CHECK (role IN ('ADMIN', 'MODERATOR', 'MEMBER')),
    ADD CONSTRAINT chk_users_adult_content_preference
        CHECK (adult_content_preference IN ('BLUR', 'SHOW', 'HIDE')),
    ADD CONSTRAINT chk_users_comment_visibility
        CHECK (comment_visibility IN ('PUBLIC', 'PRIVATE', 'DO_NOT_TRACK')),
    ADD CONSTRAINT chk_users_view_history_visibility
        CHECK (view_history_visibility IN ('PUBLIC', 'PRIVATE', 'DO_NOT_TRACK'));

ALTER TABLE groups
    ADD CONSTRAINT chk_groups_status
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'HIATUS'));

ALTER TABLE group_users
    ADD CONSTRAINT chk_group_users_type
        CHECK (type IN ('MEMBER', 'SUPPORTER')),
    ADD CONSTRAINT chk_group_users_role
        CHECK (role IN ('LIDER', 'TRADUTOR', 'REVISOR', 'QC', 'CLEANER', 'TYPESETTER'));

ALTER TABLE group_works
    ADD CONSTRAINT chk_group_works_status
        CHECK (status IN ('ONGOING', 'COMPLETED'));

ALTER TABLE forum_topics
    ADD CONSTRAINT chk_forum_topics_category
        CHECK (category IN ('GERAL', 'RECOMENDACOES', 'SPOILERS', 'SUPORTE',
                            'OFF_TOPIC', 'TEORIAS', 'FANART', 'NOTICIAS'));

ALTER TABLE user_libraries
    ADD CONSTRAINT chk_user_libraries_list
        CHECK (list IN ('LENDO', 'QUERO_LER', 'CONCLUIDO'));

ALTER TABLE events
    ADD CONSTRAINT chk_events_timeline
        CHECK (timeline IN ('UPCOMING', 'ONGOING', 'PAST')),
    ADD CONSTRAINT chk_events_status
        CHECK (status IN ('HAPPENING_NOW', 'REGISTRATIONS_OPEN', 'COMING_SOON', 'ENDED')),
    ADD CONSTRAINT chk_events_type
        CHECK (type IN ('CONVENCAO', 'LANCAMENTO', 'LIVE', 'WORKSHOP', 'MEETUP'));

ALTER TABLE payments
    ADD CONSTRAINT chk_payments_status
        CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'));

ALTER TABLE stores
    ADD CONSTRAINT chk_stores_availability
        CHECK (availability IN ('IN_STOCK', 'OUT_OF_STOCK', 'PRE_ORDER'));
