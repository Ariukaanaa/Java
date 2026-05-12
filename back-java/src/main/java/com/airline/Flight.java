package com.airline;

public class Flight {

    private String flightNumber;
    private String origin;
    private String destination;
    private String departureTime;
    private String arrivalTime;
    private double price;
    private int availableSeats;

    // -------- Constructor --------

    public Flight(String flightNumber, String origin, String destination,
                  String departureTime, String arrivalTime,
                  double price, int availableSeats) {
        this.flightNumber   = flightNumber;
        this.origin         = origin;
        this.destination    = destination;
        this.departureTime  = departureTime;
        this.arrivalTime    = arrivalTime;
        this.price          = price;
        this.availableSeats = availableSeats;
    }

    // -------- Getters --------

    public String getFlightNumber  () { return flightNumber  ; }
    public String getOrigin        () { return origin        ; }
    public String getDestination   () { return destination   ; }
    public String getDepartureTime () { return departureTime ; }
    public String getArrivalTime   () { return arrivalTime   ; }
    public double getPrice         () { return price         ; }
    public int    getAvailableSeats() { return availableSeats; }

    // -------- Setters --------

    public void setAvailableSeats(int availableSeats) {
        this.availableSeats = availableSeats;
    }
}