package com.commandmap.dto;

import java.util.List;

public record TerritoryBatchDTO(List<TerritoryDTO> territories, List<String> teamIds) {
}
