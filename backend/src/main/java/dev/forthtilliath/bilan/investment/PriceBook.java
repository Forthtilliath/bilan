package dev.forthtilliath.bilan.investment;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.TreeMap;
import java.util.UUID;

/**
 * Historique des cours de cloture par titre. Un jour sans cotation (week-end, ferie) prend le dernier cours connu ;
 * avant la premiere cotation, le premier cours sert de reference.
 */
public final class PriceBook {

	private final Map<UUID, NavigableMap<LocalDate, BigDecimal>> closes = new HashMap<>();

	public void put(UUID assetId, LocalDate date, BigDecimal close) {
		closes.computeIfAbsent(assetId, id -> new TreeMap<>()).put(date, close);
	}

	public static PriceBook fromRows(List<Object[]> rows) {
		PriceBook book = new PriceBook();
		for (Object[] row : rows) {
			book.put((UUID) row[0], toLocalDate(row[1]), (BigDecimal) row[2]);
		}
		return book;
	}

	public BigDecimal priceAt(UUID assetId, LocalDate date) {
		NavigableMap<LocalDate, BigDecimal> series = closes.get(assetId);
		if (series == null || series.isEmpty()) {
			return BigDecimal.ZERO;
		}
		Map.Entry<LocalDate, BigDecimal> entry = series.floorEntry(date);
		return entry != null ? entry.getValue() : series.firstEntry().getValue();
	}

	public BigDecimal latest(UUID assetId) {
		NavigableMap<LocalDate, BigDecimal> series = closes.get(assetId);
		return series == null || series.isEmpty() ? BigDecimal.ZERO : series.lastEntry().getValue();
	}

	/** Cours de la seance precedant la derniere cotation (pour la variation du jour). */
	public BigDecimal previousClose(UUID assetId) {
		NavigableMap<LocalDate, BigDecimal> series = closes.get(assetId);
		if (series == null || series.size() < 2) {
			return latest(assetId);
		}
		return series.lowerEntry(series.lastKey()).getValue();
	}

	public LocalDate latestDate(UUID assetId) {
		NavigableMap<LocalDate, BigDecimal> series = closes.get(assetId);
		return series == null || series.isEmpty() ? null : series.lastKey();
	}

	public NavigableMap<LocalDate, BigDecimal> series(UUID assetId) {
		return closes.getOrDefault(assetId, new TreeMap<>());
	}

	static LocalDate toLocalDate(Object value) {
		return value instanceof Date date ? date.toLocalDate() : (LocalDate) value;
	}
}
