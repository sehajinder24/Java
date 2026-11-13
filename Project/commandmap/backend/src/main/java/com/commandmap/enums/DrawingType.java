package com.commandmap.enums;

public enum DrawingType {
    LINE,
    BOUNDARY,
    DEFENCE_LINE,
    ARROW,
    TEXT;

    /** Minimum number of points a drawing of this type needs. */
    public int minPoints() {
        return this == TEXT ? 1 : 2;
    }
}
