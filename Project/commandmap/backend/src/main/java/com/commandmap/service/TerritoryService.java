package com.commandmap.service;

import static com.commandmap.service.Validators.blank;
import static com.commandmap.service.Validators.finite;
import static com.commandmap.service.Validators.label;
import static com.commandmap.service.Validators.round;
import static com.commandmap.service.Validators.round2;
import static com.commandmap.service.Validators.trim;
import static com.commandmap.service.Validators.validColor;

import com.commandmap.enums.ShapeType;
import com.commandmap.exception.ScenarioValidationException;
import com.commandmap.model.Territory;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class TerritoryService {

    /** @param teamIds known team ids, or null to skip the team reference check */
    public void validate(List<Territory> territories, Set<String> teamIds, Report r) {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < territories.size(); i++) {
            Territory t = territories.get(i);
            if (t == null) {
                r.error("Territory #%d is empty", i + 1);
                continue;
            }
            String l = label("Territory", i, t.name());
            if (blank(t.territoryId())) {
                r.error("%s: territoryId is required", l);
            } else if (!seen.add(t.territoryId())) {
                r.error("%s: duplicate territoryId '%s'", l, t.territoryId());
            }
            if (!blank(t.teamId()) && teamIds != null && !teamIds.contains(t.teamId())) {
                r.error("%s: teamId '%s' does not match any team", l, t.teamId());
            }
            if (!blank(t.fillColor()) && !validColor(t.fillColor())) {
                r.error("%s: fillColor must be a hex value such as #ef4444", l);
            }
            if (t.opacity() != null && (!finite(t.opacity()) || t.opacity() < 0 || t.opacity() > 1)) {
                r.error("%s: opacity must be between 0 and 1", l);
            }

            if (t.shapeType() == null) {
                r.error("%s: shapeType is required (POLYGON or CIRCLE)", l);
            } else if (t.shapeType() == ShapeType.POLYGON) {
                if (t.points().size() < 3) {
                    r.error("%s: a polygon needs at least 3 points", l);
                } else if (t.points().stream().anyMatch(p -> !finite(p))) {
                    r.error("%s: every polygon point needs finite x and y values", l);
                }
            } else {
                if (!finite(t.center())) {
                    r.error("%s: a circle needs a center with finite x and y values", l);
                }
                if (!finite(t.radius()) || t.radius() <= 0) {
                    r.error("%s: a circle needs a radius greater than 0", l);
                }
            }
        }
    }

    public List<Territory> normalize(List<Territory> territories) {
        return territories.stream().map(t -> new Territory(
                trim(t.territoryId()), trim(t.name()), blank(t.teamId()) ? null : t.teamId().trim(), t.shapeType(),
                t.points().stream().map(Validators::round).toList(), round(t.center()), round2(t.radius()),
                trim(t.fillColor()), t.opacity(), t.layerPriority() == null ? Integer.valueOf(0) : t.layerPriority())).toList();
    }

    public Processed<List<Territory>> process(List<Territory> territories, Set<String> teamIds) {
        Report r = new Report();
        validate(territories, teamIds, r);
        if (r.hasErrors()) {
            throw new ScenarioValidationException(r);
        }
        return new Processed<>(normalize(territories), r.warnings());
    }
}
