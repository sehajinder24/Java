package com.commandmap.controller;

import com.commandmap.dto.ProcessResultDTO;
import com.commandmap.dto.TerritoryBatchDTO;
import com.commandmap.dto.TerritoryDTO;
import com.commandmap.dto.ValidationResultDTO;
import com.commandmap.model.Territory;
import com.commandmap.service.Ids;
import com.commandmap.service.ModelMapper;
import com.commandmap.service.Processed;
import com.commandmap.service.Report;
import com.commandmap.service.TerritoryService;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/territories")
public class TerritoryController {
    private final TerritoryService territoryService;
    private final ModelMapper mapper;

    public TerritoryController(TerritoryService territoryService, ModelMapper mapper) {
        this.territoryService = territoryService;
        this.mapper = mapper;
    }

    @PostMapping("/validate")
    public ValidationResultDTO validate(@RequestBody TerritoryBatchDTO body) {
        Report report = new Report();
        territoryService.validate(mapper.territoriesToModel(body.territories()), Ids.toSetOrNull(body.teamIds()), report);
        return report.toDto();
    }

    @PostMapping("/process")
    public ProcessResultDTO<List<TerritoryDTO>> process(@RequestBody TerritoryBatchDTO body) {
        Processed<List<Territory>> result = territoryService.process(
                mapper.territoriesToModel(body.territories()), Ids.toSetOrNull(body.teamIds()));
        return new ProcessResultDTO<>(true, List.of(), result.warnings(), mapper.territoriesToDto(result.data()));
    }
}
