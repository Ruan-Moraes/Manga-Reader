ALTER TABLE users
    ADD COLUMN settings JSONB NOT NULL DEFAULT '{
        "reader": {
            "direction": "RTL",
            "mode": "VERTICAL",
            "fit": "WIDTH",
            "quality": "AUTO",
            "gap": 8,
            "background": "DARK",
            "autoMarkRead": true,
            "preload": 3
        },
        "appearance": {
            "theme": "DARK",
            "fontSize": "DEFAULT",
            "density": "COMFORTABLE",
            "animations": true
        },
        "locale": {
            "dateFormat": "D_MON",
            "timezone": "America/Sao_Paulo"
        },
        "accessibility": {
            "reduceMotion": false,
            "highContrast": false,
            "captions": false
        }
    }'::jsonb;
