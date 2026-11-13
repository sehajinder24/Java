package com.commandmap.model;

import com.commandmap.enums.UnitType;

public record MilitaryUnit(
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
