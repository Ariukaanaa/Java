package com.airline;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class FlightControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // -------- GET /api/flights --------
    @Test
    void getAllFlights_returnsList() throws Exception {
        mockMvc.perform(get("/api/flights"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(6)))
                .andExpect(jsonPath("$[0].flightNumber", is("MN101")))
                .andExpect(jsonPath("$[0].origin", is("Улаанбаатар")));
    }

    // -------- GET /api/flights/available --------
    @Test
    void getAvailableFlights_returnsOnlyFlightsWithSeats() throws Exception {
        mockMvc.perform(get("/api/flights/available"))
                .andExpect(status().isOk())
                // MN606 суудалгүй тул харагдахгүй
                .andExpect(jsonPath("$[*].flightNumber", not(hasItem("MN606"))))
                .andExpect(jsonPath("$[*].availableSeats", everyItem(greaterThan(0))));
    }

    // -------- GET /api/flights/{flightNumber} --------
    @Test
    void getByFlightNumber_returnsCorrectFlight() throws Exception {
        mockMvc.perform(get("/api/flights/MN202"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.destination", is("Сөүл")))
                .andExpect(jsonPath("$.price", is(280.00)));
    }

    @Test
    void getByFlightNumber_returns404_whenNotFound() throws Exception {
        mockMvc.perform(get("/api/flights/XX999"))
                .andExpect(status().isNotFound());
    }

    // -------- GET /api/flights/search?destination=xxx --------
    @Test
    void searchByDestination_returnsMatchingFlights() throws Exception {
        mockMvc.perform(get("/api/flights/search").param("destination", "Москва"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].flightNumber", is("MN101")));
    }

    @Test
    void searchByDestination_returnsEmpty_whenNoMatch() throws Exception {
        mockMvc.perform(get("/api/flights/search").param("destination", "Лондон"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // -------- POST /api/flights/{flightNumber}/book --------
    @Test
    void bookSeat_returnsSuccess_whenSeatsAvailable() throws Exception {
        mockMvc.perform(post("/api/flights/MN303/book"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Амжилттай захиалагдлаа!")))
                .andExpect(jsonPath("$.flight", is("MN303")));
    }

    @Test
    void bookSeat_returnsBadRequest_whenNoSeatsAvailable() throws Exception {
        // MN606 суудал = 0
        mockMvc.perform(post("/api/flights/MN606/book"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Суудал байхгүй")));
    }

    @Test
    void bookSeat_returnsBadRequest_whenFlightNotFound() throws Exception {
        mockMvc.perform(post("/api/flights/XX000/book"))
                .andExpect(status().isBadRequest());
    }

    // -------- Seat count шалгах --------
    @Test
    void bookSeat_decreasesAvailableSeats() throws Exception {
        // Эхлээд MN404 нислэгийн суудлын тоог авна
        mockMvc.perform(get("/api/flights/MN404"))
                .andExpect(jsonPath("$.availableSeats", is(60)));

        // Захиалга хийнэ
        mockMvc.perform(post("/api/flights/MN404/book"))
                .andExpect(status().isOk());

        // Суудлын тоо 1-ээр багасах ёстой
        mockMvc.perform(get("/api/flights/MN404"))
                .andExpect(jsonPath("$.availableSeats", is(59)));
    }
}