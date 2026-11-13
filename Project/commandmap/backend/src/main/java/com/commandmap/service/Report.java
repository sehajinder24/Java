package com.commandmap.service;

import com.commandmap.dto.ValidationResultDTO;
import java.util.ArrayList;
import java.util.List;

/** Collects validation errors (blocking) and warnings (informational). */
public final class Report {
    private final List<String> errors = new ArrayList<>();
    private final List<String> warnings = new ArrayList<>();

    public void error(String message, Object... args) {
        errors.add(args.length == 0 ? message : String.format(message, args));
    }

    public void warn(String message, Object... args) {
        warnings.add(args.length == 0 ? message : String.format(message, args));
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }

    public List<String> errors() {
        return List.copyOf(errors);
    }

    public List<String> warnings() {
        return List.copyOf(warnings);
    }

    public ValidationResultDTO toDto() {
        return new ValidationResultDTO(errors.isEmpty(), errors(), warnings());
    }
}
