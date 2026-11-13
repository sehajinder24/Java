package com.commandmap.model;

import com.commandmap.enums.FormationType;

public record Formation(
        String formationId,
        String name,
        FormationType formationType,
        String teamId,
        String parentFormationId,
        String description,
        Double x,
        Double y) {
}
