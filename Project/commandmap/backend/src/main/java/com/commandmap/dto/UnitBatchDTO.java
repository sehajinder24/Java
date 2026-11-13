package com.commandmap.dto;

import java.util.List;

/**
 * Units to validate. {@code teamIds} and {@code formationIds} are optional: when supplied,
 * references from the units are checked against them; when omitted the check is skipped.
 */
public record UnitBatchDTO(List<UnitDTO> units, List<String> teamIds, List<String> formationIds) {
}
