package dev.forthtilliath.bilan.demo;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import dev.forthtilliath.bilan.demo.DemoCatalog.AssetDef;
import dev.forthtilliath.bilan.investment.AssetClass;

/**
 * Cours fictifs : marche aleatoire gaussienne sur le log du prix, « epinglee » (pont brownien) pour arriver
 * exactement a la performance cible du titre. Les crypto cotent tous les jours, les autres en semaine.
 */
final class PriceSimulator {

	private PriceSimulator() {
	}

	record Close(LocalDate date, BigDecimal price) {
	}

	static List<Close> simulate(AssetDef asset, LocalDate from, LocalDate to) {
		boolean everyDay = asset.assetClass() == AssetClass.CRYPTO;
		List<LocalDate> days = new ArrayList<>();
		for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
			if (everyDay || (day.getDayOfWeek() != DayOfWeek.SATURDAY && day.getDayOfWeek() != DayOfWeek.SUNDAY)) {
				days.add(day);
			}
		}
		int steps = days.size() - 1;
		double sigma = asset.volatility() / Math.sqrt(everyDay ? 365 : 252);
		Random random = new Random(asset.seed());
		double[] walk = new double[days.size()];
		for (int i = 1; i <= steps; i++) {
			walk[i] = walk[i - 1] + sigma * random.nextGaussian();
		}
		double target = Math.log(1 + asset.totalReturn());
		List<Close> closes = new ArrayList<>(days.size());
		for (int i = 0; i <= steps; i++) {
			double progress = steps == 0 ? 1 : (double) i / steps;
			double logReturn = walk[i] - progress * walk[steps] + progress * target;
			double price = asset.start() * Math.exp(logReturn);
			closes.add(new Close(days.get(i), BigDecimal.valueOf(price).setScale(price < 10 ? 4 : 2,
					RoundingMode.HALF_UP)));
		}
		return closes;
	}
}
