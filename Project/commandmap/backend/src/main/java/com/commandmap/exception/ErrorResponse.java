package com.commandmap.exception;

import java.util.List;

public record ErrorResponse(
        String timestamp,
        int status,
        String error,
        String message,
        List<String> errors,
        List<String> warnings) {
}
