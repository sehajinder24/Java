package com.commandmap.dto;

import java.util.List;

public record ScenarioDTO(
        String scenarioId,
        String scenarioName,
        String description,
        String mapTemplate,
        List<TeamDTO> teams,
        List<UnitDTO> units,
        List<FormationDTO> formations,
        List<TerritoryDTO> territories,
        List<DrawingDTO> drawings,
        MetadataDTO metadata) {
}
