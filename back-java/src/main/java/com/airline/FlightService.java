package com.airline;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class FlightService {

    
    private final List<Flight> flights = new ArrayList<>(List.of(
        new Flight("MN101", "Улаанбаатар", "Москва",   "09:00", "16:00", 450.00, 120),
        new Flight("MN202", "Улаанбаатар", "Сөүл",     "14:00", "19:00", 280.00, 80),
        new Flight("MN303", "Улаанбаатар", "Бээжин",   "11:00", "14:30", 180.00, 95),
        new Flight("MN404", "Улаанбаатар", "Токио",    "08:00", "15:00", 520.00, 60),
        new Flight("MN505", "Улаанбаатар", "Франкфурт","22:00", "06:00", 680.00, 40),
        new Flight("MN606", "Улаанбаатар", "Стамбул",  "10:00", "15:30", 390.00, 0)
    ));

    // Бүх нислэг
    public List<Flight> getAllFlights() {
        return flights;
    }

    // Суудал байгаа нислэгүүд
    public List<Flight> getAvailableFlights() {
        return flights.stream()
                .filter(f -> f.getAvailableSeats() > 0)
                .toList();
    }

    // Нислэгийн дугаараар хайх
    public Optional<Flight> getByFlightNumber(String flightNumber) {
        return flights.stream()
                .filter(f -> f.getFlightNumber().equalsIgnoreCase(flightNumber))
                .findFirst();
    }

    // Очих газраар хайх
    public List<Flight> searchByDestination(String destination) {
        return flights.stream()
                .filter(f -> f.getDestination().toLowerCase()
                        .contains(destination.toLowerCase()))
                .toList();
    }

    // Суудал захиалах (суудлын тоог хасна)
    public boolean bookSeat(String flightNumber) {
        Optional<Flight> flight = getByFlightNumber(flightNumber);
        if (flight.isPresent() && flight.get().getAvailableSeats() > 0) {
            flight.get().setAvailableSeats(flight.get().getAvailableSeats() - 1);
            return true;
        }
        return false;
    }
}