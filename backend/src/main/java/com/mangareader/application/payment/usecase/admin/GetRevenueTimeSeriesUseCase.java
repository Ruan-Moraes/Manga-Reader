package com.mangareader.application.payment.usecase.admin;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.payment.port.PaymentRepositoryPort;

import lombok.RequiredArgsConstructor;

/**
 * Retorna a série temporal de receita mensal (pagamentos COMPLETED) para os últimos N meses.
 */
@Service
@RequiredArgsConstructor
public class GetRevenueTimeSeriesUseCase {

    private final PaymentRepositoryPort paymentRepository;

    @Transactional(readOnly = true)
    public RevenueTimeSeries execute(int months) {
        LocalDateTime since = YearMonth.now().minusMonths(months - 1).atDay(1).atStartOfDay();
        List<Object[]> rows = paymentRepository.getMonthlyRevenue(since);

        Map<String, BigDecimal> revenueMap = new LinkedHashMap<>();
        Map<String, Integer> countMap = new LinkedHashMap<>();

        for (Object[] row : rows) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            String key = String.format("%d-%02d", year, month);
            revenueMap.put(key, (BigDecimal) row[2]);
            countMap.put(key, ((Number) row[3]).intValue());
        }

        List<MonthlyEntry> entries = new ArrayList<>();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        int totalTransactions = 0;
        BigDecimal previousRevenue = null;

        YearMonth current = YearMonth.from(since.toLocalDate());
        YearMonth end = YearMonth.now();

        while (!current.isAfter(end)) {
            String key = current.toString();
            BigDecimal revenue = revenueMap.getOrDefault(key, BigDecimal.ZERO);
            int count = countMap.getOrDefault(key, 0);

            BigDecimal growth = BigDecimal.ZERO;
            if (previousRevenue != null && previousRevenue.compareTo(BigDecimal.ZERO) > 0) {
                growth = revenue.subtract(previousRevenue)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(previousRevenue, 2, RoundingMode.HALF_UP);
            }

            entries.add(new MonthlyEntry(key, revenue, count, growth));
            totalRevenue = totalRevenue.add(revenue);
            totalTransactions += count;
            previousRevenue = revenue;

            current = current.plusMonths(1);
        }

        return new RevenueTimeSeries(entries, totalRevenue, totalTransactions);
    }

    public record RevenueTimeSeries(
            List<MonthlyEntry> entries,
            BigDecimal totalRevenue,
            int totalTransactions
    ) {
    }

    public record MonthlyEntry(
            String yearMonth,
            BigDecimal revenue,
            int count,
            BigDecimal growthPercent
    ) {
    }
}
