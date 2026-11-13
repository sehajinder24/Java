package com.commandmap.service;

/** Limits of the fictional map coordinate system. Keep in sync with frontend/src/data/constants.js. */
public final class MapConstants {
    public static final double MAP_WIDTH = 2000;
    public static final double MAP_HEIGHT = 1400;
    public static final double MAX_INFLUENCE_RADIUS = 2000;
    public static final double MAX_STROKE_WIDTH = 50;

    public static final int CURRENT_MAJOR = 1;
    public static final int CURRENT_MINOR = 0;
    public static final String CURRENT_VERSION = CURRENT_MAJOR + "." + CURRENT_MINOR;

    private MapConstants() {
    }
}
