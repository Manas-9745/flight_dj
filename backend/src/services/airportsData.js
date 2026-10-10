// Comprehensive Global Airports Registry with IATA codes, cities, countries, and coordinates
const AIRPORTS = [
  // India
  { iata: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport', country: 'India', lat: 19.0896, lng: 72.8656 },
  { iata: 'DEL', city: 'New Delhi', name: 'Indira Gandhi International Airport', country: 'India', lat: 28.5562, lng: 77.1000 },
  { iata: 'BLR', city: 'Bengaluru', name: 'Kempegowda International Airport', country: 'India', lat: 13.1986, lng: 77.7066 },
  { iata: 'MAA', city: 'Chennai', name: 'Chennai International Airport', country: 'India', lat: 12.9941, lng: 80.1709 },
  { iata: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International Airport', country: 'India', lat: 17.2403, lng: 78.4294 },
  { iata: 'CCU', city: 'Kolkata', name: 'Netaji Subhash Chandra Bose International Airport', country: 'India', lat: 22.6547, lng: 88.4467 },
  { iata: 'GOI', city: 'Goa', name: 'Dabolim Airport', country: 'India', lat: 15.3808, lng: 73.8314 },
  { iata: 'COK', city: 'Kochi', name: 'Cochin International Airport', country: 'India', lat: 10.1520, lng: 76.4019 },
  { iata: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel International Airport', country: 'India', lat: 23.0772, lng: 72.6347 },
  { iata: 'PNQ', city: 'Pune', name: 'Pune International Airport', country: 'India', lat: 18.5821, lng: 73.9197 },
  { iata: 'SXR', city: 'Srinagar', name: 'Sheikh ul-Alam International Airport', country: 'India', lat: 33.9871, lng: 74.7744 },

  // United States & Americas
  { iata: 'JFK', city: 'New York', name: 'John F. Kennedy International Airport', country: 'United States', lat: 40.6413, lng: -73.7781 },
  { iata: 'EWR', city: 'Newark / New York', name: 'Newark Liberty International Airport', country: 'United States', lat: 40.6895, lng: -74.1745 },
  { iata: 'LAX', city: 'Los Angeles', name: 'Los Angeles International Airport', country: 'United States', lat: 33.9416, lng: -118.4085 },
  { iata: 'SFO', city: 'San Francisco', name: 'San Francisco International Airport', country: 'United States', lat: 37.6213, lng: -122.3790 },
  { iata: 'ORD', city: 'Chicago', name: "O'Hare International Airport", country: 'United States', lat: 41.9742, lng: -87.9073 },
  { iata: 'MIA', city: 'Miami', name: 'Miami International Airport', country: 'United States', lat: 25.7959, lng: -80.2870 },
  { iata: 'DFW', city: 'Dallas', name: 'Dallas/Fort Worth International Airport', country: 'United States', lat: 32.8998, lng: -97.0403 },
  { iata: 'SEA', city: 'Seattle', name: 'Seattle-Tacoma International Airport', country: 'United States', lat: 47.4502, lng: -122.3088 },
  { iata: 'BOS', city: 'Boston', name: 'Logan International Airport', country: 'United States', lat: 42.3656, lng: -71.0096 },
  { iata: 'YYZ', city: 'Toronto', name: 'Toronto Pearson International Airport', country: 'Canada', lat: 43.6777, lng: -79.6248 },
  { iata: 'YVR', city: 'Vancouver', name: 'Vancouver International Airport', country: 'Canada', lat: 49.1967, lng: -123.1815 },

  // Europe & UK
  { iata: 'LHR', city: 'London', name: 'Heathrow Airport', country: 'United Kingdom', lat: 51.4700, lng: -0.4543 },
  { iata: 'LGW', city: 'London', name: 'Gatwick Airport', country: 'United Kingdom', lat: 51.1537, lng: -0.1821 },
  { iata: 'CDG', city: 'Paris', name: 'Charles de Gaulle Airport', country: 'France', lat: 49.0097, lng: 2.5479 },
  { iata: 'FRA', city: 'Frankfurt', name: 'Frankfurt Airport', country: 'Germany', lat: 50.0379, lng: 8.5622 },
  { iata: 'MUC', city: 'Munich', name: 'Munich Airport', country: 'Germany', lat: 48.3537, lng: 11.7750 },
  { iata: 'AMS', city: 'Amsterdam', name: 'Amsterdam Airport Schiphol', country: 'Netherlands', lat: 52.3105, lng: 4.7683 },
  { iata: 'MAD', city: 'Madrid', name: 'Adolfo Suárez Madrid–Barajas Airport', country: 'Spain', lat: 40.4839, lng: -3.5680 },
  { iata: 'BCN', city: 'Barcelona', name: 'Josep Tarradellas Barcelona-El Prat Airport', country: 'Spain', lat: 41.2974, lng: 2.0833 },
  { iata: 'FCO', city: 'Rome', name: 'Leonardo da Vinci–Fiumicino Airport', country: 'Italy', lat: 41.8003, lng: 12.2389 },
  { iata: 'ZRH', city: 'Zurich', name: 'Zurich Airport', country: 'Switzerland', lat: 47.4582, lng: 8.5555 },
  { iata: 'VIE', city: 'Vienna', name: 'Vienna International Airport', country: 'Austria', lat: 48.1103, lng: 16.5697 },
  { iata: 'IST', city: 'Istanbul', name: 'Istanbul Airport', country: 'Turkey', lat: 41.2753, lng: 28.7519 },

  // Middle East & Africa
  { iata: 'DXB', city: 'Dubai', name: 'Dubai International Airport', country: 'United Arab Emirates', lat: 25.2532, lng: 55.3657 },
  { iata: 'AUH', city: 'Abu Dhabi', name: 'Zayed International Airport', country: 'United Arab Emirates', lat: 24.4330, lng: 54.6511 },
  { iata: 'DOH', city: 'Doha', name: 'Hamad International Airport', country: 'Qatar', lat: 25.2731, lng: 51.6081 },
  { iata: 'RUH', city: 'Riyadh', name: 'King Khalid International Airport', country: 'Saudi Arabia', lat: 24.9576, lng: 46.6988 },
  { iata: 'JED', city: 'Jeddah', name: 'King Abdulaziz International Airport', country: 'Saudi Arabia', lat: 21.6796, lng: 39.1565 },
  { iata: 'TLV', city: 'Tel Aviv', name: 'Ben Gurion Airport', country: 'Israel', lat: 32.0055, lng: 34.8854 },
  { iata: 'CAI', city: 'Cairo', name: 'Cairo International Airport', country: 'Egypt', lat: 30.1219, lng: 31.4056 },
  { iata: 'JNB', city: 'Johannesburg', name: 'O. R. Tambo International Airport', country: 'South Africa', lat: -26.1367, lng: 28.2411 },

  // Asia Pacific
  { iata: 'SIN', city: 'Singapore', name: 'Singapore Changi Airport', country: 'Singapore', lat: 1.3644, lng: 103.9915 },
  { iata: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi Airport', country: 'Thailand', lat: 13.6900, lng: 100.7501 },
  { iata: 'KUL', city: 'Kuala Lumpur', name: 'Kuala Lumpur International Airport', country: 'Malaysia', lat: 2.7456, lng: 101.7072 },
  { iata: 'HKG', city: 'Hong Kong', name: 'Hong Kong International Airport', country: 'Hong Kong', lat: 22.3080, lng: 113.9185 },
  { iata: 'HND', city: 'Tokyo', name: 'Tokyo Haneda Airport', country: 'Japan', lat: 35.5494, lng: 139.7798 },
  { iata: 'NRT', city: 'Tokyo', name: 'Narita International Airport', country: 'Japan', lat: 35.7720, lng: 140.3929 },
  { iata: 'ICN', city: 'Seoul', name: 'Incheon International Airport', country: 'South Korea', lat: 37.4602, lng: 126.4407 },
  { iata: 'SYD', city: 'Sydney', name: 'Sydney Kingsford Smith Airport', country: 'Australia', lat: -33.9399, lng: 151.1753 },
  { iata: 'MEL', city: 'Melbourne', name: 'Melbourne Airport', country: 'Australia', lat: -37.6690, lng: 144.8410 },
  { iata: 'AKL', city: 'Auckland', name: 'Auckland Airport', country: 'New Zealand', lat: -37.0082, lng: 174.7850 }
];

function searchAirports(query) {
  if (!query || typeof query !== 'string') return [];
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  return AIRPORTS.filter(ap =>
    ap.iata.toLowerCase().includes(q) ||
    ap.city.toLowerCase().includes(q) ||
    ap.name.toLowerCase().includes(q) ||
    ap.country.toLowerCase().includes(q)
  ).slice(0, 8);
}

function getAirportByIata(code) {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  return AIRPORTS.find(ap => ap.iata === upper) || { iata: upper, city: upper, name: `${upper} Airport`, country: 'Global' };
}

module.exports = {
  AIRPORTS,
  searchAirports,
  getAirportByIata
};
