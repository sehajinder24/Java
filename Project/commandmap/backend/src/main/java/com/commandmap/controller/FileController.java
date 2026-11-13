package com.commandmap.controller;

import com.commandmap.dto.ProcessResultDTO;
import com.commandmap.dto.ScenarioDTO;
import com.commandmap.model.Scenario;
import com.commandmap.service.FileService;
import com.commandmap.service.ModelMapper;
import com.commandmap.service.Processed;
import com.commandmap.service.ScenarioService;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Scenario file generation (save) and parsing (load). The server keeps nothing. */
@RestController
@RequestMapping("/api/scenarios")
public class FileController {
    private final ScenarioService scenarioService;
    private final FileService fileService;
    private final ModelMapper mapper;

    public FileController(ScenarioService scenarioService, FileService fileService, ModelMapper mapper) {
        this.scenarioService = scenarioService;
        this.fileService = fileService;
        this.mapper = mapper;
    }

    /** Validates the scenario and returns it as a downloadable JSON file. */
    @PostMapping("/export")
    public ResponseEntity<byte[]> export(@RequestBody ScenarioDTO body) {
        Processed<Scenario> result = scenarioService.process(mapper.toModel(body));
        byte[] json = fileService.toJsonBytes(result.data());
        String fileName = fileService.fileName(result.data());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileName).build().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .contentLength(json.length)
                .body(json);
    }

    /** Takes the raw text of a scenario file, validates it and returns the processed scenario. */
    @PostMapping("/import")
    public ProcessResultDTO<ScenarioDTO> importScenario(@RequestBody String fileContent) {
        Scenario parsed = fileService.parse(fileContent);
        Processed<Scenario> result = scenarioService.process(parsed);
        return new ProcessResultDTO<>(true, List.of(), result.warnings(), mapper.toDto(result.data()));
    }
}
