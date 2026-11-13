package com.commandmap.controller;

import com.commandmap.dto.FormationBatchDTO;
import com.commandmap.dto.FormationDTO;
import com.commandmap.dto.ProcessResultDTO;
import com.commandmap.dto.ValidationResultDTO;
import com.commandmap.model.Formation;
import com.commandmap.service.FormationService;
import com.commandmap.service.Ids;
import com.commandmap.service.ModelMapper;
import com.commandmap.service.Processed;
import com.commandmap.service.Report;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/formations")
public class FormationController {
    private final FormationService formationService;
    private final ModelMapper mapper;

    public FormationController(FormationService formationService, ModelMapper mapper) {
        this.formationService = formationService;
        this.mapper = mapper;
    }

    @PostMapping("/validate")
    public ValidationResultDTO validate(@RequestBody FormationBatchDTO body) {
        Report report = new Report();
        formationService.validate(mapper.formationsToModel(body.formations()), Ids.toSetOrNull(body.teamIds()), report);
        return report.toDto();
    }

    @PostMapping("/process")
    public ProcessResultDTO<List<FormationDTO>> process(@RequestBody FormationBatchDTO body) {
        Processed<List<Formation>> result = formationService.process(
                mapper.formationsToModel(body.formations()), Ids.toSetOrNull(body.teamIds()));
        return new ProcessResultDTO<>(true, List.of(), result.warnings(), mapper.formationsToDto(result.data()));
    }
}
