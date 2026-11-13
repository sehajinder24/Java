package com.commandmap.model;

import com.commandmap.enums.DrawingType;
import java.util.List;

public record Drawing(
        String drawingId,
        DrawingType drawingType,
        List<Point> points,
        String color,
        Double strokeWidth,
        String text,
        String description) {

    public Drawing {
        points = points == null ? List.of() : points;
    }
}
