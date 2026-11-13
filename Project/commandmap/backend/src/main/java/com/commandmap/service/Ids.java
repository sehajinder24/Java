package com.commandmap.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class Ids {
    private Ids() {
    }

    /** Converts an optional id list to a set; null means "do not check references". */
    public static Set<String> toSetOrNull(List<String> ids) {
        return ids == null ? null : new HashSet<>(ids);
    }
}
