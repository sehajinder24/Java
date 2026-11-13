package com.commandmap.controller;

import com.commandmap.service.MapConstants;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "application", "CommandMap",
                "scenarioFormatVersion", MapConstants.CURRENT_VERSION);
    }
}
