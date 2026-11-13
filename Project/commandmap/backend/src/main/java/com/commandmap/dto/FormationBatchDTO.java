package com.commandmap.dto;

import java.util.List;

public record FormationBatchDTO(List<FormationDTO> formations, List<String> teamIds) {
}
