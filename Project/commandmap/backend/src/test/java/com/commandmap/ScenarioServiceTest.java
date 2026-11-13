package com.commandmap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.commandmap.dto.ValidationResultDTO;
import com.commandmap.enums.FormationType;
import com.commandmap.enums.UnitType;
import com.commandmap.exception.ScenarioValidationException;
import com.commandmap.model.Formation;
import com.commandmap.model.Metadata;
import com.commandmap.model.MilitaryUnit;
import com.commandmap.model.Scenario;
import com.commandmap.service.DrawingService;
import com.commandmap.service.FileService;
import com.commandmap.service.FormationService;
import com.commandmap.service.Processed;
import com.commandmap.service.ScenarioService;
import com.commandmap.service.TeamService;
import com.commandmap.service.TerritoryService;
import com.commandmap.service.UnitService;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.Test;

class ScenarioServiceTest {
    private final ObjectMapper mapper = new ObjectMapper()
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .enable(MapperFeature.ACCEPT_CASE_INSENSITIVE_ENUMS);
    private final FileService files = new FileService(mapper, 1024 * 1024);
    private final ScenarioService service = new ScenarioService(
            new TeamService(), new UnitService(), new FormationService(), new TerritoryService(), new DrawingService());

    private Scenario sample() throws IOException {
        try (InputStream in = getClass().getResourceAsStream("/sample-scenario.json")) {
            assertNotNull(in, "sample-scenario.json must be on the test classpath");
            return files.parse(new String(in.readAllBytes(), StandardCharsets.UTF_8));
        }
    }

    private Scenario withUnits(Scenario s, List<MilitaryUnit> units) {
        return new Scenario(s.scenarioId(), s.scenarioName(), s.description(), s.mapTemplate(), s.teams(), units,
                s.formations(), s.territories(), s.drawings(), s.metadata());
    }

    @Test
    void sampleScenarioIsValid() throws IOException {
        ValidationResultDTO result = service.validate(sample());
        assertTrue(result.valid(), result.errors().toString());
    }

    @Test
    void exportedFileCanBeLoadedAgainWithEveryObject() throws IOException {
        Scenario original = sample();
        Processed<Scenario> processed = service.process(original);
        Scenario reloaded = files.parse(new String(files.toJsonBytes(processed.data()), StandardCharsets.UTF_8));

        assertEquals(original.units().size(), reloaded.units().size());
        assertEquals(original.formations().size(), reloaded.formations().size());
        assertEquals(original.territories().size(), reloaded.territories().size());
        assertEquals(original.drawings().size(), reloaded.drawings().size());
        assertEquals(original.teams(), reloaded.teams());
        assertEquals("1.0", reloaded.metadata().version());
        assertTrue(service.validate(reloaded).valid());
    }

    @Test
    void rejectsUnitWithUnknownTeamAndBadRadius() throws IOException {
        Scenario s = sample();
        MilitaryUnit u = s.units().get(0);
        MilitaryUnit broken = new MilitaryUnit(u.unitId(), u.name(), UnitType.INFANTRY, u.designation(), "missing-team",
                u.color(), u.parentFormationId(), u.x(), u.y(), -5.0, u.description());

        ValidationResultDTO result = service.validate(withUnits(s, List.of(broken)));

        assertFalse(result.valid());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("does not match any team")));
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("influenceRadius")));
    }

    @Test
    void rejectsFormationCycle() throws IOException {
        Scenario s = sample();
        Formation a = new Formation("f-a", "A", FormationType.ARMY_HQ, "team-a", "f-b", null, null, null);
        Formation b = new Formation("f-b", "B", FormationType.ARMY_HQ, "team-a", "f-a", null, null, null);
        Scenario cyclic = new Scenario(s.scenarioId(), s.scenarioName(), s.description(), s.mapTemplate(), s.teams(),
                List.of(), List.of(a, b), List.of(), List.of(), s.metadata());

        ValidationResultDTO result = service.validate(cyclic);

        assertFalse(result.valid());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("loops back") || e.contains("cannot be subordinate")));
    }

    @Test
    void rejectsFileFromNewerVersion() throws IOException {
        Scenario s = sample();
        Scenario future = new Scenario(s.scenarioId(), s.scenarioName(), s.description(), s.mapTemplate(), s.teams(),
                s.units(), s.formations(), s.territories(), s.drawings(), new Metadata("9.0", null, null));

        assertThrows(ScenarioValidationException.class, () -> service.process(future));
    }

    @Test
    void malformedJsonIsReportedAsValidationError() {
        ScenarioValidationException ex = assertThrows(ScenarioValidationException.class, () -> files.parse("{oops"));
        assertTrue(ex.getMessage().contains("not a valid CommandMap scenario"));
    }

    @Test
    void downloadNameIsSanitised() throws IOException {
        Scenario s = sample();
        Scenario odd = new Scenario(s.scenarioId(), "../Op: \"Iron\" Ford?", s.description(), s.mapTemplate(), s.teams(),
                List.of(), List.of(), List.of(), List.of(), s.metadata());
        String name = files.fileName(odd);
        assertTrue(name.endsWith(".commandmap.json"));
        assertFalse(name.contains("/") || name.contains("\"") || name.contains(":") || name.contains("?"));
    }
}
