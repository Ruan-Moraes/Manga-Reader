DROP INDEX idx_group_users_user_id;

DROP INDEX idx_group_users_group;            -- ⊂ uk_group_users_group_user (group_id, user_id)
DROP INDEX idx_store_titles_store;           -- ⊂ uk_store_titles_store_title (store_id, title_id)
DROP INDEX idx_user_recommendations_user;    -- ⊂ uk_user_recommendations_user_title (user_id, title_id)
DROP INDEX idx_event_participants_event;     -- ⊂ uk_event_participants_event_user (event_id, user_id)
DROP INDEX idx_user_libraries_user;          -- ⊂ uk_user_libraries_user_title + idx_user_libraries_user_list
