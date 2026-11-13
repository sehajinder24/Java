package com.commandmap.service;

import static com.commandmap.service.Validators.blank;
import static com.commandmap.service.Validators.label;
import static com.commandmap.service.Validators.trim;
import static com.commandmap.service.Validators.validColor;

import com.commandmap.exception.ScenarioValidationException;
import com.commandmap.model.Team;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class TeamService {

    public void validate(List<Team> teams, Report r) {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < teams.size(); i++) {
            Team t = teams.get(i);
            if (t == null) {
                r.error("Team #%d is empty", i + 1);
                continue;
            }
            String l = label("Team", i, t.name());
            if (blank(t.teamId())) {
                r.error("%s: teamId is required", l);
            } else if (!seen.add(t.teamId())) {
                r.error("%s: duplicate teamId '%s'", l, t.teamId());
            }
            if (blank(t.name())) {
                r.error("%s: name is required", l);
            }
            if (!validColor(t.color())) {
                r.error("%s: color must be a hex value such as #3b82f6", l);
            }
        }
    }

    public Set<String> ids(List<Team> teams) {
        return teams.stream().filter(t -> t != null && t.teamId() != null)
                .map(Team::teamId).collect(Collectors.toSet());
    }

    public List<Team> normalize(List<Team> teams) {
        return teams.stream()
                .map(t -> new Team(trim(t.teamId()), trim(t.name()), trim(t.color()), trim(t.description())))
                .toList();
    }

    public Processed<List<Team>> process(List<Team> teams) {
        Report r = new Report();
        validate(teams, r);
        if (r.hasErrors()) {
            throw new ScenarioValidationException(r);
        }
        return new Processed<>(normalize(teams), r.warnings());
    }
}
