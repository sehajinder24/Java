package com.commandmap.exception;

import com.commandmap.service.Report;
import java.util.List;

/** Thrown when scenario data is structurally invalid. Mapped to HTTP 422 by {@link GlobalExceptionHandler}. */
public class ScenarioValidationException extends RuntimeException {
    private final List<String> errors;
    private final List<String> warnings;

    public ScenarioValidationException(Report report) {
        super(summary(report.errors()));
        this.errors = report.errors();
        this.warnings = report.warnings();
    }

    public ScenarioValidationException(String message) {
        super(message);
        this.errors = List.of(message);
        this.warnings = List.of();
    }

    public List<String> getErrors() {
        return errors;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    private static String summary(List<String> errors) {
        return errors.size() == 1 ? errors.get(0) : "Scenario validation failed with " + errors.size() + " errors";
    }
}
