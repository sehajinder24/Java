package com.commandmap.exception;

import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/** Turns every failure into the same JSON error shape the frontend can display. */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ScenarioValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ScenarioValidationException ex) {
        return build(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), ex.getErrors(), ex.getWarnings());
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Throwable root = ex.getMostSpecificCause();
        String detail = root.getMessage() == null ? "the request body could not be read" : root.getMessage();
        if (detail.length() > 300) {
            detail = detail.substring(0, 300) + "...";
        }
        String message = "The request body is not valid scenario JSON: " + detail;
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(Instant.now().toString(), 400, "Bad Request", message, List.of(message), List.of()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error. Check the backend log.", List.of(), List.of());
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String message, List<String> errors, List<String> warnings) {
        return ResponseEntity.status(status).body(new ErrorResponse(
                Instant.now().toString(), status.value(), status.getReasonPhrase(), message, errors, warnings));
    }
}
