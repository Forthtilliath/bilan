package dev.forthtilliath.bilan.account;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "accounts")
public class Account {

	@Id
	private UUID id;

	@Column(nullable = false, length = 80)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private AccountType type;

	@Column(length = 80)
	private String institution;

	@Column(name = "opening_balance", nullable = false, precision = 14, scale = 2)
	private BigDecimal openingBalance;

	@Column(name = "opened_on", nullable = false)
	private LocalDate openedOn;

	@Column(nullable = false)
	private short color;

	@Column(nullable = false)
	private boolean archived;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected Account() {
	}

	public Account(String name, AccountType type, LocalDate openedOn) {
		this.id = UUID.randomUUID();
		this.name = name;
		this.type = type;
		this.openedOn = openedOn;
		this.openingBalance = BigDecimal.ZERO;
		this.color = 1;
	}

	@PrePersist
	void onCreate() {
		createdAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public AccountType getType() {
		return type;
	}

	public void setType(AccountType type) {
		this.type = type;
	}

	public String getInstitution() {
		return institution;
	}

	public void setInstitution(String institution) {
		this.institution = institution;
	}

	public BigDecimal getOpeningBalance() {
		return openingBalance;
	}

	public void setOpeningBalance(BigDecimal openingBalance) {
		this.openingBalance = openingBalance;
	}

	public LocalDate getOpenedOn() {
		return openedOn;
	}

	public void setOpenedOn(LocalDate openedOn) {
		this.openedOn = openedOn;
	}

	public int getColor() {
		return color;
	}

	public void setColor(int color) {
		this.color = (short) color;
	}

	public boolean isArchived() {
		return archived;
	}

	public void setArchived(boolean archived) {
		this.archived = archived;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
