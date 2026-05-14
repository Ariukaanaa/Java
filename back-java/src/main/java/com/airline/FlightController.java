package com.airline;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/flights")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class FlightController {

    private final FlightService flightService;

    public FlightController(FlightService flightService) 
    {
        this.flightService = flightService;
    }

    // -------- GET /api/flights --------
    @GetMapping
    public List<Flight> getAllFlights() {
        return flightService.getAllFlights();
    }

    // -------- GET /api/flights/available --------
    // Suudal baigaa nisleguud
    @GetMapping("/available")
    public List<Flight> getAvailableFlights() {
        return flightService.getAvailableFlights();
    }

    // -------- GET /api/flights/{flightNumber} --------
    // nislegiig dugaarar haih 
    @GetMapping("/{flightNumber}")
    public ResponseEntity<Flight> getByFlightNumber(@PathVariable String flightNumber) {
        return flightService.getByFlightNumber(flightNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // -------- GET /api/flights/search?destination --------
    // ochih gazraa haiah 
    @GetMapping("/search")
    public List<Flight> searchByDestination(@RequestParam String destination) {
        return flightService.searchByDestination(destination);
    }

    // -------- POST /api/flights/{flightNumber}/book --------
    // Suudal zahialh 
    @PostMapping("/{flightNumber}/book")
    public ResponseEntity<Map<String, String>> bookSeat(@PathVariable String flightNumber) {
        boolean success = flightService.bookSeat(flightNumber);
        if (success) {
            return ResponseEntity.ok(Map.of(
                "message", "Амжилттай захиалагдлаа!",
                "flight",  flightNumber
            ));
        }
        return ResponseEntity.badRequest().body(Map.of(
            "message", "Суудал байхгүй эсвэл нислэг олдсонгүй",
            "flight",  flightNumber
        ));
    }
}