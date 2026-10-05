package dev.forthtilliath.bilan.investment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import dev.forthtilliath.bilan.investment.position.TradeEvent;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** Ordre execute sur un compte-titres : achat ou vente d'une quantite a un prix, frais en sus. */
@Entity
@Table(name = "trades")
public class Trade {

	@Id
	private UUID id;

	@Column(name = "account_id", nullable = false)
	private UUID accountId;

	@Column(name = "asset_id", nullable = false)
	private UUID assetId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 4)
	private TradeSide side;

	@Column(name = "traded_on", nullable = false)
	private LocalDate tradedOn;

	@Column(nullable = false, precision = 18, scale = 8)
	private BigDecimal quantity;

	@Column(nullable = false, precision = 16, scale = 4)
	private BigDecimal price;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal fees;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected Trade() {
	}

	public Trade(UUID accountId, UUID assetId, TradeSide side, LocalDate tradedOn, BigDecimal quantity,
			BigDecimal price, BigDecimal fees) {
		this.id = UUID.randomUUID();
		this.accountId = accountId;
		this.assetId = assetId;
		this.side = side;
		this.tradedOn = tradedOn;
		this.quantity = quantity;
		this.price = price;
		this.fees = fees;
	}

	@PrePersist
	void onCreate() {
		createdAt = Instant.now();
	}

	public TradeEvent toEvent() {
		return new TradeEvent(tradedOn, side, quantity, price, fees);
	}

	public UUID getId() {
		return id;
	}

	public UUID getAccountId() {
		return accountId;
	}

	public UUID getAssetId() {
		return assetId;
	}

	public TradeSide getSide() {
		return side;
	}

	public LocalDate getTradedOn() {
		return tradedOn;
	}

	public BigDecimal getQuantity() {
		return quantity;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public BigDecimal getFees() {
		return fees;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
