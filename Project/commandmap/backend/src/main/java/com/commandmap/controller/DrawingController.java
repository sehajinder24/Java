package com.commandmap.controller;

import com.commandmap.dto.DrawingBatchDTO;
import com.commandmap.dto.DrawingDTO;
import com.commandmap.dto.ProcessResultDTO;
import com.commandmap.dto.ValidationResultDTO;
import com.commandmap.model.Drawing;
import com.commandmap.service.DrawingService;
import com.commandmap.service.ModelMapper;
import com.commandmap.service.Processed;
import com.commandmap.service.Report;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/drawings")
public class DrawingController {
    private final DrawingService drawingService;
    private final ModelMapper mapper;

    public DrawingController(DrawingService drawingService, ModelMapper mapper) {
        this.drawingService = drawingService;
        this.mapper = mapper;
    }

    @PostMapping("/validate")
    public ValidationResultDTO validate(@RequestBody DrawingBatchDTO body) {
        Report report = new Report();
        drawingService.validate(mapper.drawingsToModel(body.drawings()), report);
        return report.toDto();
    }

    @PostMapping("/process")
    public ProcessResultDTO<List<DrawingDTO>> process(@RequestBody DrawingBatchDTO body) {
        Processed<List<Drawing>> result = drawingService.process(mapper.drawingsToModel(body.drawings()));
        return new ProcessResultDTO<>(true, List.of(), result.warnings(), mapper.drawingsToDto(result.data()));
    }
}
