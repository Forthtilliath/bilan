package dev.forthtilliath.bilan.transaction;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

	@Query("select new dev.forthtilliath.bilan.transaction.TransactionLine(t.accountId, t.categoryId, t.transferId,"
			+ " t.bookedOn, t.amount) from Transaction t")
	List<TransactionLine> findAllLines();

	List<Transaction> findAllByTransferId(UUID transferId);

	List<Transaction> findAllByTransferIdIn(Collection<UUID> transferIds);

	List<Transaction> findTop12ByOrderByBookedOnDescCreatedAtDesc();

	@Query("select distinct t.transferId from Transaction t where t.accountId = :accountId and t.transferId is not null")
	List<UUID> findTransferIdsByAccountId(UUID accountId);

	@Modifying
	@Query("delete from Transaction t where t.transferId in :transferIds")
	void deleteAllByTransferIdIn(Collection<UUID> transferIds);

	@Query("select max(t.bookedOn) from Transaction t")
	LocalDate findLatestBookedOn();

	@Query("select min(t.bookedOn) from Transaction t where t.accountId = :accountId")
	LocalDate findFirstBookedOn(UUID accountId);

	@Query("select t.accountId as key, count(t) as total from Transaction t group by t.accountId")
	List<KeyCount> countGroupedByAccount();

	@Query("select t.categoryId as key, count(t) as total from Transaction t where t.categoryId is not null"
			+ " group by t.categoryId")
	List<KeyCount> countGroupedByCategory();

	default Map<UUID, Long> countByAccount() {
		return countGroupedByAccount().stream().collect(Collectors.toMap(KeyCount::getKey, KeyCount::getTotal));
	}

	default Map<UUID, Long> countByCategory() {
		return countGroupedByCategory().stream().collect(Collectors.toMap(KeyCount::getKey, KeyCount::getTotal));
	}

	interface KeyCount {
		UUID getKey();

		long getTotal();
	}
}
