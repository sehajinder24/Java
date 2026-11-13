package com.commandmap.service;

import static com.commandmap.service.Validators.blank;
import static com.commandmap.service.Validators.finite;
import static com.commandmap.service.Validators.label;
import static com.commandmap.service.Validators.round2;
import static com.commandmap.service.Validators.trim;

import com.commandmap.exception.ScenarioValidationException;
import com.commandmap.model.Formation;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class FormationService {

    /** @param teamIds known team ids, or null to skip the team reference check */
    public void validate(List<Formation> formations, Set<String> teamIds, Report r) {
        Map<String, Formation> byId = new HashMap<>();
        Set<String> seen = new HashSet<>();

        for (int i = 0; i < formations.size(); i++) {
            Formation f = formations.get(i);
            if (f == null) {
                r.error("Formation #%d is empty", i + 1);
                continue;
            }
            String l = label("Formation", i, f.name());
            if (blank(f.formationId())) {
                r.error("%s: formationId is required", l);
            } else if (!seen.add(f.formationId())) {
                r.error("%s: duplicate formationId '%s'", l, f.formationId());
            } else {
                byId.put(f.formationId(), f);
            }
            if (blank(f.name())) {
                r.error("%s: name is required", l);
            }
            if (f.formationType() == null) {
                r.error("%s: formationType is required (THEATRE_HQ, ARMY_GROUP_HQ, ARMY_HQ, CORPS_HQ or DIVISION)", l);
            }
            if (blank(f.teamId())) {
                r.error("%s: teamId is required", l);
            } else if (teamIds != null && !teamIds.contains(f.teamId())) {
                r.error("%s: teamId '%s' does not match any team", l, f.teamId());
            }
            boolean hasX = f.x() != null;
            boolean hasY = f.y() != null;
            if (hasX != hasY) {
                r.error("%s: x and y must either both be set or both be empty", l);
            } else if (hasX && (!finite(f.x()) || !finite(f.y()))) {
                r.error("%s: x and y must be finite numbers", l);
            }
        }

        // Parent references, rank order and cycles.
        for (int i = 0; i < formations.size(); i++) {
            Formation f = formations.get(i);
            if (f == null || blank(f.parentFormationId()) || blank(f.formationId())) {
                continue;
            }
            String l = label("Formation", i, f.name());
            if (f.formationId().equals(f.parentFormationId())) {
                r.error("%s: a formation cannot be its own parent", l);
                continue;
            }
            Formation parent = byId.get(f.parentFormationId());
            if (parent == null) {
                r.error("%s: parentFormationId '%s' does not match any formation", l, f.parentFormationId());
                continue;
            }
            if (f.formationType() != null && parent.formationType() != null
                    && f.formationType().level() <= parent.formationType().level()) {
                r.error("%s: a %s cannot be subordinate to a %s", l, f.formationType(), parent.formationType());
            }
            if (f.teamId() != null && parent.teamId() != null && !f.teamId().equals(parent.teamId())) {
                r.warn("%s belongs to a different team than its parent \"%s\"", l, parent.name());
            }
            if (hasCycle(f, byId)) {
                r.error("%s: the parent chain loops back on itself", l);
            }
        }
    }

    private boolean hasCycle(Formation start, Map<String, Formation> byId) {
        Set<String> visited = new HashSet<>();
        Formation current = start;
        while (current != null && !blank(current.parentFormationId())) {
            if (!visited.add(current.formationId())) {
                return true;
            }
            current = byId.get(current.parentFormationId());
        }
        return false;
    }

    public List<Formation> normalize(List<Formation> formations) {
        return formations.stream().map(f -> new Formation(
                trim(f.formationId()), trim(f.name()), f.formationType(), trim(f.teamId()),
                blank(f.parentFormationId()) ? null : f.parentFormationId().trim(),
                trim(f.description()), round2(f.x()), round2(f.y()))).toList();
    }

    public Processed<List<Formation>> process(List<Formation> formations, Set<String> teamIds) {
        Report r = new Report();
        validate(formations, teamIds, r);
        if (r.hasErrors()) {
            throw new ScenarioValidationException(r);
        }
        return new Processed<>(normalize(formations), r.warnings());
    }
}
