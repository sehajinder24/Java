package com.commandmap.model;

import java.util.List;

/** The complete scenario, exactly as stored in a local .json file. */
public record Scenario(
        String scenarioId,
        String scenarioName,
        String description,
        String mapTemplate,
        List<Team> teams,
        List<MilitaryUnit> units,
        List<Formation> formations,
        List<Territory> territories,
        List<Drawing> drawings,
        Metadata metadata) {

    public Scenario {
        teams = teams == null ? List.of() : teams;
        units = units == null ? List.of() : units;
        formations = formations == null ? List.of() : formations;
        territories = territories == null ? List.of() : territories;
        drawings = drawings == null ? List.of() : drawings;
    }
}
