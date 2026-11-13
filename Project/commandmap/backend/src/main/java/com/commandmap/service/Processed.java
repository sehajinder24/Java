package com.commandmap.service;

import java.util.List;

/** Normalised data returned by a successful process call, together with non-fatal warnings. */
public record Processed<T>(T data, List<String> warnings) {
}
