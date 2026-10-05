package dev.forthtilliath.bilan.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.postgresql.PostgreSQLContainer;

import com.jayway.jsonpath.JsonPath;

import dev.forthtilliath.bilan.demo.DemoDataSeeder;

/**
 * Socle des tests d'API : vrai PostgreSQL (Testcontainers, demarre une fois pour toute la JVM),
 * schema Flyway, donnees de demo regenerees avant chaque test pour que chacun parte du meme etat.
 */
@SuppressWarnings("PMD.AbstractClassWithoutAbstractMethod") // socle partage, jamais instancie seul
@SpringBootTest(properties = "app.demo.reset-cooldown=PT1H")
abstract class ApiIntegrationTest {

	@ServiceConnection
	static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

	static {
		POSTGRES.start();
	}

	@Autowired
	private WebApplicationContext context;

	@Autowired
	private DemoDataSeeder seeder;

	protected MockMvc mvc;

	@BeforeEach
	void resetData() {
		seeder.reset();
		mvc = MockMvcBuilders.webAppContextSetup(context).build();
	}

	/** Aujourd'hui dans le fuseau de l'application (la CI tourne en UTC). */
	protected static LocalDate today() {
		return LocalDate.now(ZoneId.of("Europe/Paris"));
	}

	protected ResultActions getJson(String url) throws Exception {
		return mvc.perform(get(url).accept(MediaType.APPLICATION_JSON));
	}

	protected ResultActions postJson(String url, String body) throws Exception {
		return mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(body));
	}

	protected ResultActions putJson(String url, String body) throws Exception {
		return mvc.perform(put(url).contentType(MediaType.APPLICATION_JSON).content(body));
	}

	protected ResultActions deleteAt(String url) throws Exception {
		return mvc.perform(delete(url));
	}

	/** Lit une valeur JSONPath dans le corps d'une reponse. */
	protected static <T> T read(ResultActions result, String path) throws Exception {
		return JsonPath.read(result.andReturn().getResponse().getContentAsString(), path);
	}

	/** Identifiant d'un element d'une liste JSON, choisi par la valeur d'un champ. */
	protected String idOf(String url, String field, String value) throws Exception {
		List<Map<String, Object>> items = read(getJson(url), "$[?(@." + field + " == \"" + value + "\")]");
		return (String) items.getFirst().get("id");
	}

	protected String accountId(String name) throws Exception {
		return idOf("/api/accounts", "name", name);
	}

	protected String categoryId(String name) throws Exception {
		return idOf("/api/categories", "name", name);
	}

	protected String assetId(String symbol) throws Exception {
		return idOf("/api/assets", "symbol", symbol);
	}
}
