package dev.forthtilliath.bilan.wealth;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Point d'une serie temporelle a une valeur (solde, cours...). */
public record SeriesPoint(LocalDate date, BigDecimal value) {
}
