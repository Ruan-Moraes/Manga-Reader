package com.mangareader.application.subscription.usecase.admin;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionRepositoryPort;

import lombok.RequiredArgsConstructor;

/**
 * Retorna a série temporal de crescimento de assinaturas (novas vs canceladas) para os últimos N meses.
 */
@Service
@RequiredArgsConstructor
public class GetSubscriptionGrowthUseCase {

    private final SubscriptionRepositoryPort subscriptionRepository;

    @Transactional(readOnly = true)
    public SubscriptionGrowth execute(int months) {
        LocalDateTime since = YearMonth.now().minusMonths(months - 1).atDay(1).atStartOfDay();

        Map<String, Long> newMap = toMap(subscriptionRepository.countNewSubscriptionsByMonth(since));
        Map<String, Long> cancelledMap = toMap(subscriptionRepository.countCancelledSubscriptionsByMonth(since));

        List<MonthlyGrowthEntry> entries = new ArrayList<>();
        long totalNew = 0;
        long totalCancelled = 0;

        YearMonth current = YearMonth.from(since.toLocalDate());
        YearMonth end = YearMonth.now();

        while (!current.isAfter(end)) {
            String key = current.toString();
            long newSubs = newMap.getOrDefault(key, 0L);
            long cancelled = cancelledMap.getOrDefault(key, 0L);

            entries.add(new MonthlyGrowthEntry(key, newSubs, cancelled, newSubs - cancelled));
            totalNew += newSubs;
            totalCancelled += cancelled;

            current = current.plusMonths(1);
        }

        return new SubscriptionGrowth(entries, totalNew, totalCancelled);
    }

    private Map<String, Long> toMap(List<Object[]> rows) {
        Map<String, Long> map = new LinkedHashMap<>();
        for (Object[] row : rows) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            String key = String.format("%d-%02d", year, month);
            map.put(key, ((Number) row[2]).longValue());
        }
        return map;
    }

    public record SubscriptionGrowth(
            List<MonthlyGrowthEntry> entries,
            long totalNew,
            long totalCancelled
    ) {
    }

    public record MonthlyGrowthEntry(
            String yearMonth,
            long newSubscriptions,
            long cancelledSubscriptions,
            long netGrowth
    ) {
    }
}
