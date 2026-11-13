package com.commandmap.service;

import static com.commandmap.service.Validators.blank;
import static com.commandmap.service.Validators.finite;
import static com.commandmap.service.Validators.label;
import static com.commandmap.service.Validators.round2;
import static com.commandmap.service.Validators.trim;
import static com.commandmap.service.Validators.validColor;

import com.commandmap.enums.DrawingType;
import com.commandmap.exception.ScenarioValidationException;
import com.commandmap.model.Drawing;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class DrawingService {

    public void validate(List<Drawing> drawings, Report r) {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < drawings.size(); i++) {
            Drawing d = drawings.get(i);
            if (d == null) {
                r.error("Drawing #%d is empty", i + 1);
                continue;
            }
            String l = label("Drawing", i, d.text());
            if (blank(d.drawingId())) {
                r.error("%s: drawingId is required", l);
            } else if (!seen.add(d.drawingId())) {
                r.error("%s: duplicate drawingId '%s'", l, d.drawingId());
            }
            if (!blank(d.color()) && !validColor(d.color())) {
                r.error("%s: color must be a hex value such as #ffffff", l);
            }
            if (d.strokeWidth() != null
                    && (!finite(d.strokeWidth()) || d.strokeWidth() <= 0 || d.strokeWidth() > MapConstants.MAX_STROKE_WIDTH)) {
                r.error("%s: strokeWidth must be greater than 0 and at most %.0f", l, MapConstants.MAX_STROKE_WIDTH);
            }
            if (d.drawingType() == null) {
                r.error("%s: drawingType is required (LINE, BOUNDARY, DEFENCE_LINE, ARROW or TEXT)", l);
                continue;
            }
            if (d.points().size() < d.drawingType().minPoints()) {
                r.error("%s: a %s needs at least %d point(s)", l, d.drawingType(), d.drawingType().minPoints());
            } else if (d.points().stream().anyMatch(p -> !finite(p))) {
                r.error("%s: every point needs finite x and y values", l);
            }
            if (d.drawingType() == DrawingType.TEXT && blank(d.text())) {
                r.error("%s: a TEXT drawing needs text", l);
            }
        }
    }

    public List<Drawing> normalize(List<Drawing> drawings) {
        return drawings.stream().map(d -> new Drawing(
                trim(d.drawingId()), d.drawingType(), d.points().stream().map(Validators::round).toList(),
                trim(d.color()), round2(d.strokeWidth()), d.text(), trim(d.description()))).toList();
    }

    public Processed<List<Drawing>> process(List<Drawing> drawings) {
        Report r = new Report();
        validate(drawings, r);
        if (r.hasErrors()) {
            throw new ScenarioValidationException(r);
        }
        return new Processed<>(normalize(drawings), r.warnings());
    }
}
