package dev.forthtilliath.bilan.investment;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.forthtilliath.bilan.common.Money;
import dev.forthtilliath.bilan.common.NotFoundException;
import dev.forthtilliath.bilan.investment.dto.AssetView;
import dev.forthtilliath.bilan.wealth.SampleDates;
import dev.forthtilliath.bilan.wealth.SeriesPoint;

@Service
@Transactional(readOnly = true)
public class AssetService {

	private static final int TREND_POINTS = 12;

	private final AssetRepository assets;
	private final Clock clock;

	public AssetService(AssetRepository assets, Clock clock) {
		this.assets = assets;
		this.clock = clock;
	}

	public List<AssetView> list() {
		PriceBook prices = PriceBook.fromRows(assets.findAllPriceRows());
		LocalDate today = LocalDate.now(clock);
		return assets.findAllByOrderByAssetClassAscSymbolAsc().stream().map(a -> view(a, prices, today)).toList();
	}

	public AssetView get(UUID id) {
		return list().stream().filter(a -> a.id().equals(id)).findFirst()
				.orElseThrow(() -> new NotFoundException("Titre introuvable."));
	}

	/** Cours de cloture quotidiens, du plus ancien au plus recent. */
	public List<SeriesPoint> prices(UUID id) {
		if (!assets.existsById(id)) {
			throw new NotFoundException("Titre introuvable.");
		}
		return assets.findPriceRows(id).stream()
				.map(row -> new SeriesPoint(PriceBook.toLocalDate(row[0]), (BigDecimal) row[1])).toList();
	}

	static AssetView view(Asset asset, PriceBook prices, LocalDate today) {
		UUID id = asset.getId();
		BigDecimal latest = prices.latest(id);
		LocalDate latestDate = prices.latestDate(id);
		BigDecimal yearAgo = latestDate == null ? null : prices.priceAt(id, latestDate.minusYears(1));
		List<BigDecimal> trend = SampleDates.monthEnds(today, TREND_POINTS).stream()
				.map(date -> prices.priceAt(id, date)).toList();
		return new AssetView(id, asset.getSymbol(), asset.getName(), asset.getAssetClass(), latest, latestDate,
				Money.percentChange(prices.previousClose(id), latest), Money.percentChange(yearAgo, latest), trend);
	}
}
