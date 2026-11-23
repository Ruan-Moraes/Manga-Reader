-- Supports the daily trending job windowed aggregation without scanning user_libraries.
CREATE INDEX idx_user_libraries_saved_at_title
    ON user_libraries (saved_at, title_id);
