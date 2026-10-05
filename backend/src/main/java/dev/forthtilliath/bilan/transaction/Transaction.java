package dev.forthtilliath.bilan.transaction;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** Operation sur un compte. Montant signe ; un virement = deux operations liees par {@code transferId}. */
@Entity
@Table(name = "transactions")
public class Transaction {

	@Id
	private UUID id;

	@Column(name = "account_id", nullable = false)
	private UUID accountId;

	@Column(name = "category_id")
	private UUID categoryId;

	@Column(name = "booked_on", nullable = false)
	private LocalDate bookedOn;

	@Column(nullable = false, precision = 14, scale = 2)
	private BigDecimal amount;

	@Column(nullable = false, length = 140)
	private String label;

	@Column(length = 500)
	private String note;

	@Column(name = "transfer_id")
	private UUID transferId;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected Transaction() {
	}

	public Transaction(UUID accountId, LocalDate bookedOn, BigDecimal amount, String label) {
		this.id = UUID.randomUUID();
		this.accountId = accountId;
		this.bookedOn = bookedOn;
		this.amount = amount;
		this.label = label;
	}

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public boolean isTransfer() {
		return transferId != null;
	}

	public UUID getId() {
		return id;
	}

	public UUID getAccountId() {
		return accountId;
	}

	public void setAccountId(UUID accountId) {
		this.accountId = accountId;
	}

	public UUID getCategoryId() {
		return categoryId;
	}

	public void setCategoryId(UUID categoryId) {
		this.categoryId = categoryId;
	}

	public LocalDate getBookedOn() {
		return bookedOn;
	}

	public void setBookedOn(LocalDate bookedOn) {
		this.bookedOn = bookedOn;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public void setAmount(BigDecimal amount) {
		this.amount = amount;
	}

	public String getLabel() {
		return label;
	}

	public void setLabel(String label) {
		this.label = label;
	}

	public String getNote() {
		return note;
	}

	public void setNote(String note) {
		this.note = note;
	}

	public UUID getTransferId() {
		return transferId;
	}

	public void setTransferId(UUID transferId) {
		this.transferId = transferId;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	/** Le generateur de demo etale les dates de creation pour garder un tri stable a date egale. */
	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}
