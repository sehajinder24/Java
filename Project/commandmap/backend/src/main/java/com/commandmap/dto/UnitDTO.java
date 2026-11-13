package com.commandmap.dto;

import com.commandmap.enums.UnitType;

public record UnitDTO(
        String unitId,
        String name,
        UnitType unitType,
        String designation,
        String teamId,
        String color,
        String parentFormationId,
        Double x,
        Double y,
        Double influenceRadius,
        String description) {
}
