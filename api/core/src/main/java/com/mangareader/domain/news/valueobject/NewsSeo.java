package com.mangareader.domain.news.valueobject;

import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

public record NewsSeo(
        LocalizedString title,
        LocalizedString description,
        LocalizedStringList keywords
) {
    public NewsSeo {
        title = title == null ? LocalizedString.empty() : title;
        description = description == null ? LocalizedString.empty() : description;
        keywords = keywords == null ? LocalizedStringList.empty() : keywords;
    }

    public static NewsSeo empty() {
        return new NewsSeo(LocalizedString.empty(), LocalizedString.empty(), LocalizedStringList.empty());
    }
}
