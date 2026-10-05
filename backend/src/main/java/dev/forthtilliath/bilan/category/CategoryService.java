package dev.forthtilliath.bilan.category;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.forthtilliath.bilan.category.dto.CategoryRequest;
import dev.forthtilliath.bilan.category.dto.CategoryView;
import dev.forthtilliath.bilan.common.FieldErrorsException;
import dev.forthtilliath.bilan.common.Money;
import dev.forthtilliath.bilan.common.NotFoundException;
import dev.forthtilliath.bilan.transaction.TransactionLine;
import dev.forthtilliath.bilan.transaction.TransactionRepository;

@Service
@Transactional
public class CategoryService {

	/** Nombre de mois complets pris pour la moyenne mensuelle. */
	static final int AVERAGE_MONTHS = 6;

	private final CategoryRepository categories;
	private final TransactionRepository transactions;
	private final Clock clock;

	public CategoryService(CategoryRepository categories, TransactionRepository transactions, Clock clock) {
		this.categories = categories;
		this.transactions = transactions;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public List<CategoryView> list() {
		YearMonth current = YearMonth.now(clock);
		YearMonth firstAveraged = current.minusMonths(AVERAGE_MONTHS);
		Map<UUID, BigDecimal> thisMonth = new HashMap<>();
		Map<UUID, BigDecimal> lastMonths = new HashMap<>();
		for (TransactionLine line : transactions.findAllLines()) {
			if (line.categoryId() == null) {
				continue;
			}
			YearMonth month = YearMonth.from(line.bookedOn());
			if (month.equals(current)) {
				thisMonth.merge(line.categoryId(), line.amount().abs(), BigDecimal::add);
			} else if (!month.isBefore(firstAveraged) && month.isBefore(current)) {
				lastMonths.merge(line.categoryId(), line.amount().abs(), BigDecimal::add);
			}
		}
		Map<UUID, Long> counts = transactions.countByCategory();
		return categories.findAllByOrderByKindAscNameAsc().stream()
				.map(c -> CategoryView.of(c, Money.cents(thisMonth.get(c.getId())),
						lastMonths.getOrDefault(c.getId(), BigDecimal.ZERO)
								.divide(BigDecimal.valueOf(AVERAGE_MONTHS), Money.SCALE, RoundingMode.HALF_UP),
						counts.getOrDefault(c.getId(), 0L)))
				.toList();
	}

	public CategoryView create(CategoryRequest request) {
		if (categories.existsByKindAndNameIgnoreCase(request.kind(), request.name().strip())) {
			throw duplicate();
		}
		Category category = new Category(request.name().strip(), request.kind(), request.color());
		apply(category, request);
		categories.saveAndFlush(category);
		return view(category.getId());
	}

	public CategoryView update(UUID id, CategoryRequest request) {
		Category category = find(id);
		if (categories.existsByKindAndNameIgnoreCaseAndIdNot(request.kind(), request.name().strip(), id)) {
			throw duplicate();
		}
		if (request.kind() != category.getKind() && transactions.countByCategory().getOrDefault(id, 0L) > 0) {
			throw FieldErrorsException.of("kind",
					"Des opérations utilisent cette catégorie : son type ne peut plus changer.");
		}
		apply(category, request);
		categories.saveAndFlush(category);
		return view(id);
	}

	/** Les operations de la categorie deviennent « non categorisees » (ON DELETE SET NULL). */
	public void delete(UUID id) {
		categories.delete(find(id));
	}

	private Category find(UUID id) {
		return categories.findById(id).orElseThrow(() -> new NotFoundException("Catégorie introuvable."));
	}

	private CategoryView view(UUID id) {
		return list().stream().filter(c -> c.id().equals(id)).findFirst().orElseThrow();
	}

	private static void apply(Category category, CategoryRequest request) {
		category.setName(request.name().strip());
		category.setKind(request.kind());
		category.setColor(request.color());
		category.setIcon(request.icon() == null || request.icon().isBlank() ? null : request.icon().strip());
		category.setMonthlyBudget(request.kind() == CategoryKind.EXPENSE && request.monthlyBudget() != null
				? Money.cents(request.monthlyBudget())
				: null);
	}

	private static FieldErrorsException duplicate() {
		return FieldErrorsException.of("name", "Une catégorie de ce type porte déjà ce nom.");
	}
}
