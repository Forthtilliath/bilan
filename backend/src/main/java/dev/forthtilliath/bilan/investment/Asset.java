package dev.forthtilliath.bilan.investment;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Titre cotable (ETF, action, obligation, crypto). Ses cours sont dans {@code asset_prices}. */
@Entity
@Table(name = "assets")
public class Asset {

	@Id
	private UUID id;

	@Column(nullable = false, unique = true, length = 12)
	private String symbol;

	@Column(nullable = false, length = 80)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(name = "asset_class", nullable = false, length = 20)
	private AssetClass assetClass;

	protected Asset() {
	}

	public Asset(UUID id, String symbol, String name, AssetClass assetClass) {
		this.id = id;
		this.symbol = symbol;
		this.name = name;
		this.assetClass = assetClass;
	}

	public UUID getId() {
		return id;
	}

	public String getSymbol() {
		return symbol;
	}

	public String getName() {
		return name;
	}

	public AssetClass getAssetClass() {
		return assetClass;
	}
}
