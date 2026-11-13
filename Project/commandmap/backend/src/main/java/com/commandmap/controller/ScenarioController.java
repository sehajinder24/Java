package com.commandmap.controller;

import com.commandmap.dto.ProcessResultDTO;
import com.commandmap.dto.ScenarioDTO;
import com.commandmap.dto.ValidationResultDTO;
import com.commandmap.model.Scenario;
import com.commandmap.service.ModelMapper;
import com.commandmap.service.Processed;
import com.commandmap.service.ScenarioService;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/scenarios")
public class ScenarioController {
    private final ScenarioService scenarioService;
    private final ModelMapper mapper;

    public ScenarioController(ScenarioService scenarioService, ModelMapper mapper) {
        this.scenarioService = scenarioService;
        this.mapper = mapper;
    }

    /** Reports every problem found in a scenario. Always answers 200 so the UI can list the issues. */
    @PostMapping("/validate")
    public ValidationResultDTO validate(@RequestBody ScenarioDTO body) {
        return scenarioService.validate(mapper.toModel(body));
    }

    /** Validates, migrates and normalises a scenario. Answers 422 with the error list if it is invalid. */
    @PostMapping("/process")
    public ProcessResultDTO<ScenarioDTO> process(@RequestBody ScenarioDTO body) {
        Processed<Scenario> result = scenarioService.process(mapper.toModel(body));
        return new ProcessResultDTO<>(true, List.of(), result.warnings(), mapper.toDto(result.data()));
    }
}
