ALTER TABLE store_titles DROP CONSTRAINT fk_store_titles_store,
    ADD CONSTRAINT fk_store_titles_store
        FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE;

ALTER TABLE group_users DROP CONSTRAINT fk_group_users_group,
    ADD CONSTRAINT fk_group_users_group
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE;
ALTER TABLE group_users DROP CONSTRAINT fk_group_users_user,
    ADD CONSTRAINT fk_group_users_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE group_works DROP CONSTRAINT fk_group_works_group,
    ADD CONSTRAINT fk_group_works_group
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE;

ALTER TABLE event_tickets DROP CONSTRAINT fk_event_tickets_event,
    ADD CONSTRAINT fk_event_tickets_event
        FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE;

ALTER TABLE event_participants DROP CONSTRAINT fk_event_participants_event,
    ADD CONSTRAINT fk_event_participants_event
        FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE;
ALTER TABLE event_participants DROP CONSTRAINT fk_event_participants_user,
    ADD CONSTRAINT fk_event_participants_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE user_social_links DROP CONSTRAINT fk_social_links_user,
    ADD CONSTRAINT fk_social_links_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE user_libraries DROP CONSTRAINT fk_user_libraries_user,
    ADD CONSTRAINT fk_user_libraries_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE user_recommendations DROP CONSTRAINT fk_user_recommendations_user,
    ADD CONSTRAINT fk_user_recommendations_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE forum_replies DROP CONSTRAINT fk_forum_replies_topic,
    ADD CONSTRAINT fk_forum_replies_topic
        FOREIGN KEY (topic_id) REFERENCES forum_topics (id) ON DELETE CASCADE;

ALTER TABLE forum_topics DROP CONSTRAINT fk_forum_topics_author,
    ADD CONSTRAINT fk_forum_topics_author
        FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE RESTRICT;

ALTER TABLE forum_replies DROP CONSTRAINT fk_forum_replies_author,
    ADD CONSTRAINT fk_forum_replies_author
        FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE RESTRICT;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

ALTER TABLE payments
    ADD CONSTRAINT fk_payments_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT;

ALTER TABLE subscriptions DROP CONSTRAINT fk_subscriptions_plan,
    ADD CONSTRAINT fk_subscriptions_plan
        FOREIGN KEY (plan_id) REFERENCES subscription_plans (id) ON DELETE RESTRICT;

ALTER TABLE gift_codes DROP CONSTRAINT fk_gift_codes_plan,
    ADD CONSTRAINT fk_gift_codes_plan
        FOREIGN KEY (plan_id) REFERENCES subscription_plans (id) ON DELETE RESTRICT;

ALTER TABLE subscription_audit_logs DROP CONSTRAINT fk_subscription_audit_sub,
    ADD CONSTRAINT fk_subscription_audit_sub
        FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE RESTRICT;
