package com.commandmap.controller;

import com.commandmap.dto.TeamBatchDTO;
import com.commandmap.dto.ValidationResultDTO;
import com.commandmap.service.ModelMapper;
import com.commandmap.service.Report;
import com.commandmap.service.TeamService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teams")
public class TeamController {
    private final TeamService teamService;
    private final ModelMapper mapper;

    public TeamController(TeamService teamService, ModelMapper mapper) {
        this.teamService = teamService;
        this.mapper = mapper;
    }

    @PostMapping("/validate")
    public ValidationResultDTO validate(@RequestBody TeamBatchDTO body) {
        Report report = new Report();
        teamService.validate(mapper.teamsToModel(body.teams()), report);
        return report.toDto();
    }
}
