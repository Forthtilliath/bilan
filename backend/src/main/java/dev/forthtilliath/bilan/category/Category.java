package dev.forthtilliath.bilan.category;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "categories")
public class Category {

	@Id
	private UUID id;

	@Column(nullable = false, length = 60)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private CategoryKind kind;

	@Column(nullable = false)
	private short color;

	@Column(length = 20)
	private String icon;

	@Column(name = "monthly_budget", precision = 12, scale = 2)
	private BigDecimal monthlyBudget;

	protected Category() {
	}

	public Category(String name, CategoryKind kind, int color) {
		this.id = UUID.randomUUID();
		this.name = name;
		this.kind = kind;
		this.color = (short) color;
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

	public CategoryKind getKind() {
		return kind;
	}

	public void setKind(CategoryKind kind) {
		this.kind = kind;
	}

	public int getColor() {
		return color;
	}

	public void setColor(int color) {
		this.color = (short) color;
	}

	public String getIcon() {
		return icon;
	}

	public void setIcon(String icon) {
		this.icon = icon;
	}

	public BigDecimal getMonthlyBudget() {
		return monthlyBudget;
	}

	public void setMonthlyBudget(BigDecimal monthlyBudget) {
		this.monthlyBudget = monthlyBudget;
	}
}
