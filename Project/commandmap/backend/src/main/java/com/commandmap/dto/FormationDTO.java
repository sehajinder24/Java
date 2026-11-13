package com.commandmap.dto;

import com.commandmap.enums.FormationType;

public record FormationDTO(
        String formationId,
        String name,
        FormationType formationType,
        String teamId,
        String parentFormationId,
        String description,
        Double x,
        Double y) {
}
