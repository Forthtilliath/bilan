package dev.forthtilliath.bilan;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.fields;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.Repository;
import org.springframework.web.bind.annotation.RestController;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import jakarta.persistence.Entity;

/** Regles d'architecture verifiees a chaque build. */
@SuppressWarnings("PMD.TestClassWithoutTestCases") // les regles @ArchTest sont les cas de test
@AnalyzeClasses(packages = "dev.forthtilliath.bilan", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

	/** Les controleurs delegent aux services : aucun acces direct aux depots. */
	@ArchTest
	static final ArchRule controllersDoNotTouchRepositories = noClasses()
			.that().areAnnotatedWith(RestController.class)
			.should().dependOnClassesThat().areAssignableTo(Repository.class);

	/** Le socle commun ne connait aucun domaine. */
	@ArchTest
	static final ArchRule commonIsDomainFree = noClasses()
			.that().resideInAPackage("..bilan.common..")
			.should().dependOnClassesThat().resideInAnyPackage("..bilan.account..", "..bilan.category..",
					"..bilan.transaction..", "..bilan.investment..", "..bilan.wealth..", "..bilan.dashboard..",
					"..bilan.demo..");

	/** Les entites ne dependent ni des services ni du web. */
	@ArchTest
	static final ArchRule entitiesStayPersistenceOnly = noClasses()
			.that().areAnnotatedWith(Entity.class)
			.should().dependOnClassesThat().haveSimpleNameEndingWith("Service")
			.orShould().dependOnClassesThat().resideInAPackage("org.springframework.web..");

	/** Injection par constructeur uniquement (dependances explicites, classes testables). */
	@ArchTest
	static final ArchRule noFieldInjection = fields().should().notBeAnnotatedWith(Autowired.class);

	/** Le calcul de positions reste pur : aucune dependance a JPA ni a Spring. */
	@ArchTest
	static final ArchRule positionsArePure = classes()
			.that().resideInAPackage("..investment.position..")
			.should().onlyDependOnClassesThat().resideInAnyPackage("java..", "..investment.position..",
					"dev.forthtilliath.bilan.investment");

	/** Seul le controleur de demo et le demarrage utilisent le generateur de donnees. */
	@ArchTest
	static final ArchRule demoIsIsolated = noClasses()
			.that().resideOutsideOfPackage("..bilan.demo..")
			.should().dependOnClassesThat().resideInAPackage("..bilan.demo..");
}
