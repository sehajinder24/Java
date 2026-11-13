package com.commandmap;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {

    @Autowired
    private MockMvc mvc;

    private String sampleJson() throws IOException {
        try (InputStream in = getClass().getResourceAsStream("/sample-scenario.json")) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    @Test
    void healthEndpointReportsUp() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void validateAcceptsSampleScenario() throws Exception {
        mvc.perform(post("/api/scenarios/validate").contentType(MediaType.APPLICATION_JSON).content(sampleJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true));
    }

    @Test
    void exportReturnsDownloadableJsonFile() throws Exception {
        mvc.perform(post("/api/scenarios/export").contentType(MediaType.APPLICATION_JSON).content(sampleJson()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("Operation-Iron-Ford.commandmap.json")))
                .andExpect(jsonPath("$.scenarioName").value("Operation Iron Ford"))
                .andExpect(jsonPath("$.units.length()").value(11));
    }

    @Test
    void importReturnsProcessedScenario() throws Exception {
        mvc.perform(post("/api/scenarios/import").contentType(MediaType.APPLICATION_JSON).content(sampleJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.data.formations.length()").value(7));
    }

    @Test
    void importRejectsMalformedJson() throws Exception {
        mvc.perform(post("/api/scenarios/import").contentType(MediaType.APPLICATION_JSON).content("{oops"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors[0]").value(containsString("not a valid CommandMap scenario")));
    }

    @Test
    void processRejectsInvalidScenarioWithErrorList() throws Exception {
        mvc.perform(post("/api/scenarios/process").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scenarioId\":\"x\",\"scenarioName\":\"x\",\"mapTemplate\":\"t\",\"metadata\":{\"version\":\"1.0\"},"
                                + "\"units\":[{\"unitId\":\"u\",\"name\":\"U\",\"unitType\":\"INFANTRY\",\"teamId\":\"none\",\"x\":1,\"y\":1,\"influenceRadius\":10}]}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors[0]").value(containsString("does not match any team")));
    }
}
