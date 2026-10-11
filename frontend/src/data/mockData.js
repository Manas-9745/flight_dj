export const MOCK_FLIGHTS = [
  {
    id: "FL-1001",
    airline: "SkyWings Airlines",
    flightNumber: "SW101",
    status: "ON_TIME",
    departure: {
      airport: "JFK",
      city: "New York",
      terminal: "4",
      gate: "B22",
      scheduledTime: "2024-05-15T08:30:00Z",
      estimatedTime: "2024-05-15T08:30:00Z",
      coordinates: [40.6413, -73.7781]
    },
    arrival: {
      airport: "LHR",
      city: "London",
      terminal: "2",
      gate: "A15",
      scheduledTime: "2024-05-15T20:15:00Z",
      estimatedTime: "2024-05-15T20:15:00Z",
      coordinates: [51.4700, -0.4543]
    },
    aircraft: "Boeing 787-9 Dreamliner",
    duration: "6h 45m",
    price: 450
  },
  {
    id: "FL-2002",
    airline: "Oceanic Air",
    flightNumber: "OA815",
    status: "DELAYED",
    departure: {
      airport: "SYD",
      city: "Sydney",
      terminal: "1",
      gate: "54",
      scheduledTime: "2024-05-15T10:00:00Z",
      estimatedTime: "2024-05-15T11:45:00Z",
      coordinates: [-33.9399, 151.1753]
    },
    arrival: {
      airport: "LAX",
      city: "Los Angeles",
      terminal: "B",
      gate: "148",
      scheduledTime: "2024-05-15T06:30:00Z",
      estimatedTime: "2024-05-15T08:15:00Z",
      coordinates: [33.9416, -118.4085]
    },
    aircraft: "Airbus A350-1000",
    duration: "14h 30m",
    price: 1200
  },
  {
    id: "FL-3003",
    airline: "AeroMate Express",
    flightNumber: "AM204",
    status: "CANCELLED",
    departure: {
      airport: "SFO",
      city: "San Francisco",
      terminal: "2",
      gate: "D11",
      scheduledTime: "2024-05-15T14:20:00Z",
      estimatedTime: "2024-05-15T14:20:00Z",
      coordinates: [37.6213, -122.3790]
    },
    arrival: {
      airport: "SEA",
      city: "Seattle",
      terminal: "N",
      gate: "N14",
      scheduledTime: "2024-05-15T16:35:00Z",
      estimatedTime: "2024-05-15T16:35:00Z",
      coordinates: [47.4502, -122.3088]
    },
    aircraft: "Boeing 737 MAX 8",
    duration: "2h 15m",
    price: 180
  },
  {
    id: "FL-4004",
    airline: "SkyWings Airlines",
    flightNumber: "SW102",
    status: "BOARDING",
    departure: {
      airport: "LHR",
      city: "London",
      terminal: "2",
      gate: "B34",
      scheduledTime: "2024-05-15T22:30:00Z",
      estimatedTime: "2024-05-15T22:30:00Z",
      coordinates: [51.4700, -0.4543]
    },
    arrival: {
      airport: "JFK",
      city: "New York",
      terminal: "4",
      gate: "B25",
      scheduledTime: "2024-05-16T01:15:00Z",
      estimatedTime: "2024-05-16T01:15:00Z",
      coordinates: [40.6413, -73.7781]
    },
    aircraft: "Boeing 787-9 Dreamliner",
    duration: "7h 45m",
    price: 450
  }
];

export const MOCK_STATS = {
  activeFlights: 342,
  airports: 85,
  airlines: 12
};
