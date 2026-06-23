ALTER TABLE stores
    ADD CONSTRAINT chk_stores_category
        CHECK (category IN ('OFICIAL', 'NOVA', 'USADO'));
