package dev.forthtilliath.bilan.investment;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssetRepository extends JpaRepository<Asset, UUID> {

	List<Asset> findAllByOrderByAssetClassAscSymbolAsc();

	/** Tous les cours, en une requete : la demo en compte quelques milliers. */
	@Query(value = "select asset_id, priced_on, close from asset_prices order by asset_id, priced_on", nativeQuery = true)
	List<Object[]> findAllPriceRows();

	@Query(value = "select priced_on, close from asset_prices where asset_id = :assetId order by priced_on",
			nativeQuery = true)
	List<Object[]> findPriceRows(@Param("assetId") UUID assetId);
}
