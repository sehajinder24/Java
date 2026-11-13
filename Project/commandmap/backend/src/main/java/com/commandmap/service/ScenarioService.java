package com.commandmap.service;

import static com.commandmap.service.Validators.blank;
import static com.commandmap.service.Validators.trim;

import com.commandmap.dto.ValidationResultDTO;
import com.commandmap.exception.ScenarioValidationException;
import com.commandmap.model.Metadata;
import com.commandmap.model.Scenario;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import org.springframework.stereotype.Service;

/** Validates, migrates and normalises complete scenarios. Holds no state. */
@Service
public class ScenarioService {
    private final TeamService teamService;
    private final UnitService unitService;
    private final FormationService formationService;
    private final TerritoryService territoryService;
    private final DrawingService drawingService;

    public ScenarioService(TeamService teamService, UnitService unitService, FormationService formationService,
            TerritoryService territoryService, DrawingService drawingService) {
        this.teamService = teamService;
        this.unitService = unitService;
        this.formationService = formationService;
        this.territoryService = territoryService;
        this.drawingService = drawingService;
    }

    public ValidationResultDTO validate(Scenario scenario) {
        return check(scenario).toDto();
    }

    /** Validates, then returns a migrated and normalised copy. Throws if the scenario has errors. */
    public Processed<Scenario> process(Scenario scenario) {
        Report report = check(scenario);
        if (report.hasErrors()) {
            throw new ScenarioValidationException(report);
        }

        String now = Instant.now().toString();
        Metadata meta = scenario.metadata();
        String createdAt = blank(meta.createdAt()) ? now : meta.createdAt().trim();

        Scenario normalised = new Scenario(
                scenario.scenarioId().trim(),
                scenario.scenarioName().trim(),
                trim(scenario.description()),
                scenario.mapTemplate().trim(),
                teamService.normalize(scenario.teams()),
                unitService.normalize(scenario.units()),
                formationService.normalize(scenario.formations()),
                territoryService.normalize(scenario.territories()),
                drawingService.normalize(scenario.drawings()),
                new Metadata(MapConstants.CURRENT_VERSION, createdAt, now));

        return new Processed<>(migrate(normalised, meta.version()), report.warnings());
    }

    /**
     * Upgrades scenarios written by older versions of the application.
     * Only version 1.x exists so far; add a step per future major version here.
     */
    Scenario migrate(Scenario scenario, String fromVersion) {
        return scenario;
    }

    Report check(Scenario s) {
        Report r = new Report();
        if (s == null) {
            r.error("The scenario is empty");
            return r;
        }

        if (blank(s.scenarioId())) {
            r.error("scenarioId is required");
        }
        if (blank(s.scenarioName())) {
            r.error("scenarioName is required");
        }
        if (blank(s.mapTemplate())) {
            r.error("mapTemplate is required");
        }
        checkVersion(s.metadata(), r);

        teamService.validate(s.teams(), r);
        Set<String> teamIds = teamService.ids(s.teams());

        formationService.validate(s.formations(), teamIds, r);
        Set<String> formationIds = new HashSet<>();
        s.formations().forEach(f -> {
            if (f != null && f.formationId() != null) {
                formationIds.add(f.formationId());
            }
        });

        unitService.validate(s.units(), teamIds, formationIds, r);
        territoryService.validate(s.territories(), teamIds, r);
        drawingService.validate(s.drawings(), r);

        if (s.teams().isEmpty()) {
            r.warn("The scenario has no teams");
        }
        return r;
    }

    private void checkVersion(Metadata meta, Report r) {
        if (meta == null || blank(meta.version())) {
            r.error("metadata.version is required so the file can be read by future versions");
            return;
        }
        int[] v = parseVersion(meta.version());
        if (v == null) {
            r.error("metadata.version '%s' is not a valid version (expected something like 1.0)", meta.version());
        } else if (v[0] > MapConstants.CURRENT_MAJOR
                || (v[0] == MapConstants.CURRENT_MAJOR && v[1] > MapConstants.CURRENT_MINOR)) {
            r.error("This scenario was saved by a newer version of CommandMap (file version %s, supported up to %s)",
                    meta.version(), MapConstants.CURRENT_VERSION);
        }
    }

    static int[] parseVersion(String version) {
        String[] parts = version.trim().split("\\.");
        if (parts.length != 2) {
            return null;
        }
        try {
            return new int[] {Integer.parseInt(parts[0]), Integer.parseInt(parts[1])};
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
