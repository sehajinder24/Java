package com.commandmap.service;

import static com.commandmap.service.Validators.blank;
import static com.commandmap.service.Validators.finite;
import static com.commandmap.service.Validators.insideMap;
import static com.commandmap.service.Validators.label;
import static com.commandmap.service.Validators.round2;
import static com.commandmap.service.Validators.trim;
import static com.commandmap.service.Validators.validColor;

import com.commandmap.exception.ScenarioValidationException;
import com.commandmap.model.MilitaryUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class UnitService {

    /**
     * @param teamIds      known team ids, or null to skip the team reference check
     * @param formationIds known formation ids, or null to skip the parent formation check
     */
    public void validate(List<MilitaryUnit> units, Set<String> teamIds, Set<String> formationIds, Report r) {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < units.size(); i++) {
            MilitaryUnit u = units.get(i);
            if (u == null) {
                r.error("Unit #%d is empty", i + 1);
                continue;
            }
            String l = label("Unit", i, u.name());

            if (blank(u.unitId())) {
                r.error("%s: unitId is required", l);
            } else if (!seen.add(u.unitId())) {
                r.error("%s: duplicate unitId '%s'", l, u.unitId());
            }
            if (blank(u.name())) {
                r.error("%s: name is required", l);
            }
            if (u.unitType() == null) {
                r.error("%s: unitType is required (INFANTRY, CAVALRY, ARMOURED or ARTILLERY)", l);
            }
            if (blank(u.teamId())) {
                r.error("%s: teamId is required", l);
            } else if (teamIds != null && !teamIds.contains(u.teamId())) {
                r.error("%s: teamId '%s' does not match any team", l, u.teamId());
            }
            if (!blank(u.color()) && !validColor(u.color())) {
                r.error("%s: color must be a hex value such as #3b82f6", l);
            }
            if (!blank(u.parentFormationId()) && formationIds != null && !formationIds.contains(u.parentFormationId())) {
                r.error("%s: parentFormationId '%s' does not match any formation", l, u.parentFormationId());
            }
            if (!finite(u.x()) || !finite(u.y())) {
                r.error("%s: x and y must be finite numbers", l);
            } else if (!insideMap(u.x(), u.y())) {
                r.warn("%s is outside the map area (%.0f, %.0f)", l, u.x(), u.y());
            }
            if (!finite(u.influenceRadius()) || u.influenceRadius() <= 0) {
                r.error("%s: influenceRadius must be greater than 0", l);
            } else if (u.influenceRadius() > MapConstants.MAX_INFLUENCE_RADIUS) {
                r.error("%s: influenceRadius must not exceed %.0f", l, MapConstants.MAX_INFLUENCE_RADIUS);
            }
        }
    }

    public List<MilitaryUnit> normalize(List<MilitaryUnit> units) {
        return units.stream().map(u -> new MilitaryUnit(
                trim(u.unitId()), trim(u.name()), u.unitType(), trim(u.designation()), trim(u.teamId()),
                trim(u.color()), blank(u.parentFormationId()) ? null : u.parentFormationId().trim(),
                round2(u.x()), round2(u.y()), round2(u.influenceRadius()), trim(u.description()))).toList();
    }

    public Processed<List<MilitaryUnit>> process(List<MilitaryUnit> units, Set<String> teamIds, Set<String> formationIds) {
        Report r = new Report();
        validate(units, teamIds, formationIds, r);
        if (r.hasErrors()) {
            throw new ScenarioValidationException(r);
        }
        return new Processed<>(normalize(units), r.warnings());
    }
}
