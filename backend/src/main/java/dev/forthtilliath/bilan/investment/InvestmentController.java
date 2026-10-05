package dev.forthtilliath.bilan.investment;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.forthtilliath.bilan.investment.dto.AssetView;
import dev.forthtilliath.bilan.investment.dto.PortfolioView;
import dev.forthtilliath.bilan.investment.dto.TradeRequest;
import dev.forthtilliath.bilan.investment.dto.TradeView;
import dev.forthtilliath.bilan.wealth.SeriesPoint;

/** Titres et cours, ordres de bourse, synthese du portefeuille. */
@RestController
@RequestMapping("/api")
public class InvestmentController {

	private final AssetService assets;
	private final TradeService trades;
	private final PortfolioService portfolio;

	public InvestmentController(AssetService assets, TradeService trades, PortfolioService portfolio) {
		this.assets = assets;
		this.trades = trades;
		this.portfolio = portfolio;
	}

	@GetMapping("/assets")
	public List<AssetView> assets() {
		return assets.list();
	}

	@GetMapping("/assets/{id}")
	public AssetView asset(@PathVariable UUID id) {
		return assets.get(id);
	}

	@GetMapping("/assets/{id}/prices")
	public List<SeriesPoint> prices(@PathVariable UUID id) {
		return assets.prices(id);
	}

	@GetMapping("/portfolio")
	public PortfolioView portfolio(@RequestParam(required = false) UUID accountId) {
		return portfolio.portfolio(accountId);
	}

	@GetMapping("/trades")
	public List<TradeView> trades(@RequestParam(required = false) UUID accountId,
			@RequestParam(required = false) UUID assetId) {
		return trades.list(accountId, assetId);
	}

	@PostMapping("/trades")
	@ResponseStatus(HttpStatus.CREATED)
	public TradeView createTrade(@Validated @RequestBody TradeRequest request) {
		return trades.create(request);
	}

	@DeleteMapping("/trades/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteTrade(@PathVariable UUID id) {
		trades.delete(id);
	}
}
