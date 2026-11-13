package com.commandmap.service;

import com.commandmap.dto.DrawingDTO;
import com.commandmap.dto.FormationDTO;
import com.commandmap.dto.ScenarioDTO;
import com.commandmap.dto.TeamDTO;
import com.commandmap.dto.TerritoryDTO;
import com.commandmap.dto.UnitDTO;
import com.commandmap.model.Drawing;
import com.commandmap.model.Formation;
import com.commandmap.model.MilitaryUnit;
import com.commandmap.model.Scenario;
import com.commandmap.model.Team;
import com.commandmap.model.Territory;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Converts between wire DTOs and model classes. The two share field names, so Jackson does the
 * structural copy and the mapping stays in one place.
 */
@Component
public class ModelMapper {
    private final ObjectMapper objectMapper;

    public ModelMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Scenario toModel(ScenarioDTO dto) {
        return dto == null ? null : objectMapper.convertValue(dto, Scenario.class);
    }

    public ScenarioDTO toDto(Scenario scenario) {
        return objectMapper.convertValue(scenario, ScenarioDTO.class);
    }

    public List<Team> teamsToModel(List<TeamDTO> dtos) {
        return dtos == null ? List.of() : objectMapper.convertValue(dtos, new TypeReference<List<Team>>() { });
    }

    public List<TeamDTO> teamsToDto(List<Team> models) {
        return objectMapper.convertValue(models, new TypeReference<List<TeamDTO>>() { });
    }

    public List<MilitaryUnit> unitsToModel(List<UnitDTO> dtos) {
        return dtos == null ? List.of() : objectMapper.convertValue(dtos, new TypeReference<List<MilitaryUnit>>() { });
    }

    public List<UnitDTO> unitsToDto(List<MilitaryUnit> models) {
        return objectMapper.convertValue(models, new TypeReference<List<UnitDTO>>() { });
    }

    public List<Formation> formationsToModel(List<FormationDTO> dtos) {
        return dtos == null ? List.of() : objectMapper.convertValue(dtos, new TypeReference<List<Formation>>() { });
    }

    public List<FormationDTO> formationsToDto(List<Formation> models) {
        return objectMapper.convertValue(models, new TypeReference<List<FormationDTO>>() { });
    }

    public List<Territory> territoriesToModel(List<TerritoryDTO> dtos) {
        return dtos == null ? List.of() : objectMapper.convertValue(dtos, new TypeReference<List<Territory>>() { });
    }

    public List<TerritoryDTO> territoriesToDto(List<Territory> models) {
        return objectMapper.convertValue(models, new TypeReference<List<TerritoryDTO>>() { });
    }

    public List<Drawing> drawingsToModel(List<DrawingDTO> dtos) {
        return dtos == null ? List.of() : objectMapper.convertValue(dtos, new TypeReference<List<Drawing>>() { });
    }

    public List<DrawingDTO> drawingsToDto(List<Drawing> models) {
        return objectMapper.convertValue(models, new TypeReference<List<DrawingDTO>>() { });
    }
}
