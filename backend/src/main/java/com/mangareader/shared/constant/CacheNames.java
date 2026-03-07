package com.mangareader.shared.constant;

/**
 * Nomes das caches Redis utilizadas pela aplicação.
 * <p>
 * Centralizados aqui para evitar strings mágicas nos {@code @Cacheable}
 * e {@code @CacheEvict} dos use cases.
 */
public final class CacheNames {
    private CacheNames() {}

    public static final String TITLES = "titles";
    public static final String TITLE = "title";
    public static final String TAG = "tag";
    public static final String RATING_AVERAGE = "rating-average";
}
