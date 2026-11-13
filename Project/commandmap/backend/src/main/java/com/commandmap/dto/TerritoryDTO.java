package com.commandmap.dto;

import com.commandmap.enums.ShapeType;
import java.util.List;

public record TerritoryDTO(
        String territoryId,
        String name,
        String teamId,
        ShapeType shapeType,
        List<PointDTO> points,
        PointDTO center,
        Double radius,
        String fillColor,
        Double opacity,
        Integer layerPriority) {
}
