package com.commandmap.dto;

import com.commandmap.enums.DrawingType;
import java.util.List;

public record DrawingDTO(
        String drawingId,
        DrawingType drawingType,
        List<PointDTO> points,
        String color,
        Double strokeWidth,
        String text,
        String description) {
}
