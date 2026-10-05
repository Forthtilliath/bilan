package dev.forthtilliath.bilan.category;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

	List<Category> findAllByOrderByKindAscNameAsc();

	boolean existsByKindAndNameIgnoreCase(CategoryKind kind, String name);

	boolean existsByKindAndNameIgnoreCaseAndIdNot(CategoryKind kind, String name, UUID id);
}
