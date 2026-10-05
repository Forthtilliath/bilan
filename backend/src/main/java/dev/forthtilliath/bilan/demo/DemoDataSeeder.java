package dev.forthtilliath.bilan.demo;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import dev.forthtilliath.bilan.demo.DemoDataGenerator.DemoData;
import dev.forthtilliath.bilan.transaction.TransactionRepository;

/**
 * Remplit la base au demarrage si elle est vide, ou si les donnees de demo ont vieilli
 * (derniere operation il y a plus de {@code app.demo.stale-after-days} jours) : la demo reste toujours a jour.
 * Insertions JDBC par lots : plusieurs milliers de lignes en quelques centaines de millisecondes.
 */
@Component
public class DemoDataSeeder implements ApplicationRunner {

	private static final Logger LOG = LoggerFactory.getLogger(DemoDataSeeder.class);

	private final JdbcTemplate jdbc;
	private final TransactionRepository transactions;
	private final Clock clock;
	private final TransactionTemplate transaction;
	private final boolean enabled;
	private final int staleAfterDays;

	public DemoDataSeeder(JdbcTemplate jdbc, TransactionRepository transactions, Clock clock,
			PlatformTransactionManager transactionManager,
			@Value("${app.demo.enabled:true}") boolean enabled,
			@Value("${app.demo.stale-after-days:10}") int staleAfterDays) {
		this.jdbc = jdbc;
		this.transactions = transactions;
		this.clock = clock;
		this.transaction = new TransactionTemplate(transactionManager);
		this.enabled = enabled;
		this.staleAfterDays = staleAfterDays;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!enabled) {
			return;
		}
		Integer accounts = jdbc.queryForObject("select count(*) from accounts", Integer.class);
		LocalDate latest = transactions.findLatestBookedOn();
		LocalDate today = LocalDate.now(clock);
		if (accounts == null || accounts == 0) {
			reset();
		} else if (latest != null && latest.isBefore(today.minusDays(staleAfterDays))) {
			LOG.info("Donnees de demo anterieures au {} : regeneration.", latest);
			reset();
		}
	}

	/** Efface tout et regenere un historique se terminant aujourd'hui, en une transaction. */
	public void reset() {
		long started = System.currentTimeMillis();
		DemoData data = DemoDataGenerator.generate(LocalDate.now(clock));
		transaction.executeWithoutResult(status -> write(data));
		LOG.info("Demo generee : {} operations, {} ordres, {} cours en {} ms.", data.transactions().size(),
				data.trades().size(), data.prices().size(), System.currentTimeMillis() - started);
	}

	private void write(DemoData data) {
		jdbc.execute("delete from trades; delete from transactions; delete from asset_prices; delete from assets;"
				+ " delete from categories; delete from accounts");
		Timestamp now = Timestamp.from(Instant.now(clock));

		jdbc.batchUpdate("insert into accounts (id, name, type, institution, opening_balance, opened_on, color,"
				+ " archived, created_at) values (?, ?, ?, ?, ?, ?, ?, false, ?)", data.accounts(), 50, (ps, a) -> {
					ps.setObject(1, a.getId());
					ps.setString(2, a.getName());
					ps.setString(3, a.getType().name());
					ps.setString(4, a.getInstitution());
					ps.setBigDecimal(5, a.getOpeningBalance());
					ps.setDate(6, Date.valueOf(a.getOpenedOn()));
					ps.setInt(7, a.getColor());
					// Ordre d'affichage = ordre du catalogue.
					ps.setTimestamp(8, new Timestamp(now.getTime() + data.accounts().indexOf(a)));
				});
		jdbc.batchUpdate("insert into categories (id, name, kind, color, icon, monthly_budget)"
				+ " values (?, ?, ?, ?, ?, ?)", data.categories(), 50, (ps, c) -> {
					ps.setObject(1, c.getId());
					ps.setString(2, c.getName());
					ps.setString(3, c.getKind().name());
					ps.setInt(4, c.getColor());
					ps.setString(5, c.getIcon());
					ps.setBigDecimal(6, c.getMonthlyBudget());
				});
		jdbc.batchUpdate("insert into assets (id, symbol, name, asset_class) values (?, ?, ?, ?)", data.assets(), 50,
				(ps, a) -> {
					ps.setObject(1, a.getId());
					ps.setString(2, a.getSymbol());
					ps.setString(3, a.getName());
					ps.setString(4, a.getAssetClass().name());
				});
		jdbc.batchUpdate("insert into asset_prices (asset_id, priced_on, close) values (?, ?, ?)", data.prices(), 1000,
				(ps, p) -> {
					ps.setObject(1, p.assetId());
					ps.setDate(2, Date.valueOf(p.date()));
					ps.setBigDecimal(3, p.close());
				});
		jdbc.batchUpdate("insert into transactions (id, account_id, category_id, booked_on, amount, label, note,"
				+ " transfer_id, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)", data.transactions(), 500, (ps, t) -> {
					ps.setObject(1, t.getId());
					ps.setObject(2, t.getAccountId());
					ps.setObject(3, t.getCategoryId());
					ps.setDate(4, Date.valueOf(t.getBookedOn()));
					ps.setBigDecimal(5, t.getAmount());
					ps.setString(6, t.getLabel());
					ps.setString(7, t.getNote());
					ps.setObject(8, t.getTransferId());
					ps.setTimestamp(9, Timestamp.from(t.getCreatedAt()));
				});
		jdbc.batchUpdate("insert into trades (id, account_id, asset_id, side, traded_on, quantity, price, fees,"
				+ " created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)", data.trades(), 500, (ps, t) -> {
					ps.setObject(1, t.getId());
					ps.setObject(2, t.getAccountId());
					ps.setObject(3, t.getAssetId());
					ps.setString(4, t.getSide().name());
					ps.setDate(5, Date.valueOf(t.getTradedOn()));
					ps.setBigDecimal(6, t.getQuantity());
					ps.setBigDecimal(7, t.getPrice());
					ps.setBigDecimal(8, t.getFees());
					// Ordre de saisie = ordre de generation, meme pour deux ordres du meme jour.
					ps.setTimestamp(9, Timestamp.valueOf(t.getTradedOn().atTime(9, 0).plusSeconds(data.trades().indexOf(t))));
				});
	}
}
