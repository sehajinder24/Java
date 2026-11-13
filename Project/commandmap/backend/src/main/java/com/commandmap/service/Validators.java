package com.commandmap.service;

import com.commandmap.model.Point;
import java.util.regex.Pattern;

/** Small helpers shared by the validation services. */
final class Validators {
    private static final Pattern HEX_COLOR = Pattern.compile("^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$");

    private Validators() {
    }

    static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    static boolean validColor(String s) {
        return s != null && HEX_COLOR.matcher(s.trim()).matches();
    }

    static boolean finite(Double d) {
        return d != null && !d.isNaN() && !d.isInfinite();
    }

    static boolean finite(Point p) {
        return p != null && finite(p.x()) && finite(p.y());
    }

    static boolean insideMap(Double x, Double y) {
        return x >= 0 && y >= 0 && x <= MapConstants.MAP_WIDTH && y <= MapConstants.MAP_HEIGHT;
    }

    static String trim(String s) {
        return s == null ? null : s.trim();
    }

    static Double round2(Double v) {
        return v == null ? null : Math.round(v * 100.0) / 100.0;
    }

    static Point round(Point p) {
        return p == null ? null : new Point(round2(p.x()), round2(p.y()));
    }

    /** Human readable label for messages, e.g. {@code Unit #3 "1st Infantry"}. */
    static String label(String kind, int index, String name) {
        return blank(name) ? kind + " #" + (index + 1) : kind + " #" + (index + 1) + " \"" + name.trim() + "\"";
    }
}
