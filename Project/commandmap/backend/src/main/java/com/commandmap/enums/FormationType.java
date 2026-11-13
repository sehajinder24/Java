package com.commandmap.enums;

/** Ordered from highest to lowest command level. A child formation must sit below its parent. */
public enum FormationType {
    THEATRE_HQ(0),
    ARMY_GROUP_HQ(1),
    ARMY_HQ(2),
    CORPS_HQ(3),
    DIVISION(4);

    private final int level;

    FormationType(int level) {
        this.level = level;
    }

    public int level() {
        return level;
    }
}
