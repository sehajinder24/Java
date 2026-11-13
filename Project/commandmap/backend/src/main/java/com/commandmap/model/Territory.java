package com.commandmap.model;

import com.commandmap.enums.ShapeType;
import java.util.List;

/** A manually drawn territory. POLYGON uses {@code points}; CIRCLE uses {@code center} and {@code radius}. */
public record Territory(
        String territoryId,
        String name,
        String teamId,
        ShapeType shapeType,
        List<Point> points,
        Point center,
        Double radius,
        String fillColor,
        Double opacity,
        Integer layerPriority) {

    public Territory {
        points = points == null ? List.of() : points;
    }
}
