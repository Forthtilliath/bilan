package dev.forthtilliath.bilan.wealth;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

/** Grilles de dates pour les series temporelles. Le dernier point est toujours {@code today}. */
public final class SampleDates {

	private SampleDates() {
	}

	/** Un point tous les 7 jours en remontant depuis {@code today}, sans descendre sous {@code from}. */
	public static List<LocalDate> weekly(LocalDate from, LocalDate today) {
		List<LocalDate> dates = new ArrayList<>();
		for (LocalDate date = today; !date.isBefore(from); date = date.minusWeeks(1)) {
			dates.add(date);
		}
		if (dates.isEmpty() || dates.getLast().isAfter(from)) {
			dates.add(from);
		}
		return dates.reversed();
	}

	/** Fins des {@code count - 1} mois precedents, puis {@code today}. */
	public static List<LocalDate> monthEnds(LocalDate today, int count) {
		List<LocalDate> dates = new ArrayList<>(count);
		YearMonth current = YearMonth.from(today);
		for (int i = count - 1; i >= 1; i--) {
			dates.add(current.minusMonths(i).atEndOfMonth());
		}
		dates.add(today);
		return dates;
	}
}
