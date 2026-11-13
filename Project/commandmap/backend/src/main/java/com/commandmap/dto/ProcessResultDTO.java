package com.commandmap.dto;

import java.util.List;

/** Result of a /process or /import call: the normalised data plus any non-fatal warnings. */
public record ProcessResultDTO<T>(boolean valid, List<String> errors, List<String> warnings, T data) {
}
