package com.commandmap.service;

import com.commandmap.exception.ScenarioValidationException;
import com.commandmap.model.Scenario;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Generates and reads scenario JSON files. Everything happens in memory; nothing touches the disk. */
@Service
public class FileService {
    private final ObjectMapper objectMapper;
    private final long maxScenarioBytes;

    public FileService(ObjectMapper objectMapper,
            @Value("${commandmap.max-scenario-bytes:20971520}") long maxScenarioBytes) {
        this.objectMapper = objectMapper;
        this.maxScenarioBytes = maxScenarioBytes;
    }

    /** Serialises a scenario as pretty-printed UTF-8 JSON. */
    public byte[] toJsonBytes(Scenario scenario) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(scenario);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialise the scenario", e);
        }
    }

    /** Parses the text of a scenario file. Structural problems are reported as validation errors. */
    public Scenario parse(String json) {
        if (json == null || json.isBlank()) {
            throw new ScenarioValidationException("The file is empty");
        }
        if (json.getBytes(StandardCharsets.UTF_8).length > maxScenarioBytes) {
            throw new ScenarioValidationException(
                    "The file is larger than the " + (maxScenarioBytes / (1024 * 1024)) + " MB limit");
        }
        String text = json.startsWith("\uFEFF") ? json.substring(1) : json;
        try {
            Scenario scenario = objectMapper.readValue(text, Scenario.class);
            if (scenario == null) {
                throw new ScenarioValidationException("The file does not contain a scenario");
            }
            return scenario;
        } catch (JsonProcessingException e) {
            String where = e.getLocation() == null ? ""
                    : " (line " + e.getLocation().getLineNr() + ", column " + e.getLocation().getColumnNr() + ")";
            throw new ScenarioValidationException("The file is not a valid CommandMap scenario: "
                    + e.getOriginalMessage() + where);
        }
    }

    /** A safe download name such as {@code Sample-Scenario.commandmap.json}. */
    public String fileName(Scenario scenario) {
        String base = scenario == null || scenario.scenarioName() == null ? "" : scenario.scenarioName();
        base = base.trim().replaceAll("[^A-Za-z0-9._-]+", "-").replaceAll("^-+|-+$", "");
        if (base.isEmpty()) {
            base = "scenario";
        }
        if (base.length() > 80) {
            base = base.substring(0, 80);
        }
        return base + ".commandmap.json";
    }
}
