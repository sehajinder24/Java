package com.commandmap.controller;

import com.commandmap.dto.ProcessResultDTO;
import com.commandmap.dto.UnitBatchDTO;
import com.commandmap.dto.UnitDTO;
import com.commandmap.dto.ValidationResultDTO;
import com.commandmap.model.MilitaryUnit;
import com.commandmap.service.Ids;
import com.commandmap.service.ModelMapper;
import com.commandmap.service.Processed;
import com.commandmap.service.Report;
import com.commandmap.service.UnitService;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/units")
public class UnitController {
    private final UnitService unitService;
    private final ModelMapper mapper;

    public UnitController(UnitService unitService, ModelMapper mapper) {
        this.unitService = unitService;
        this.mapper = mapper;
    }

    @PostMapping("/validate")
    public ValidationResultDTO validate(@RequestBody UnitBatchDTO body) {
        Report report = new Report();
        unitService.validate(mapper.unitsToModel(body.units()),
                Ids.toSetOrNull(body.teamIds()), Ids.toSetOrNull(body.formationIds()), report);
        return report.toDto();
    }

    @PostMapping("/process")
    public ProcessResultDTO<List<UnitDTO>> process(@RequestBody UnitBatchDTO body) {
        Processed<List<MilitaryUnit>> result = unitService.process(mapper.unitsToModel(body.units()),
                Ids.toSetOrNull(body.teamIds()), Ids.toSetOrNull(body.formationIds()));
        return new ProcessResultDTO<>(true, List.of(), result.warnings(), mapper.unitsToDto(result.data()));
    }
}
