package dev.forthtilliath.bilan.investment;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TradeRepository extends JpaRepository<Trade, UUID> {

	List<Trade> findAllByOrderByTradedOnAscCreatedAtAsc();

	List<Trade> findAllByAccountIdAndAssetIdOrderByTradedOnAscCreatedAtAsc(UUID accountId, UUID assetId);

	boolean existsByAccountId(UUID accountId);

	@Query("select min(t.tradedOn) from Trade t where t.accountId = :accountId")
	LocalDate findFirstTradedOn(UUID accountId);
}
