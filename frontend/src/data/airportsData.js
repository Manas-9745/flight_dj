// Global Airports Registry with IATA codes, cities, countries, and full names
export const GLOBAL_AIRPORTS = [
  // India
  { iata: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport', country: 'India' },
  { iata: 'DEL', city: 'New Delhi', name: 'Indira Gandhi International Airport', country: 'India' },
  { iata: 'BLR', city: 'Bengaluru', name: 'Kempegowda International Airport', country: 'India' },
  { iata: 'MAA', city: 'Chennai', name: 'Chennai International Airport', country: 'India' },
  { iata: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International Airport', country: 'India' },
  { iata: 'CCU', city: 'Kolkata', name: 'Netaji Subhash Chandra Bose International Airport', country: 'India' },
  { iata: 'GOI', city: 'Goa', name: 'Dabolim Airport', country: 'India' },
  { iata: 'COK', city: 'Kochi', name: 'Cochin International Airport', country: 'India' },
  { iata: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel International Airport', country: 'India' },
  { iata: 'PNQ', city: 'Pune', name: 'Pune International Airport', country: 'India' },
  { iata: 'SXR', city: 'Srinagar', name: 'Sheikh ul-Alam International Airport', country: 'India' },
  { iata: 'JAI', city: 'Jaipur', name: 'Jaipur International Airport', country: 'India' },
  { iata: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh International Airport', country: 'India' },
  { iata: 'IXC', city: 'Chandigarh', name: 'Shaheed Bhagat Singh International Airport', country: 'India' },

  // United States & Americas
  { iata: 'JFK', city: 'New York', name: 'John F. Kennedy International Airport', country: 'United States' },
  { iata: 'EWR', city: 'Newark / New York', name: 'Newark Liberty International Airport', country: 'United States' },
  { iata: 'LAX', city: 'Los Angeles', name: 'Los Angeles International Airport', country: 'United States' },
  { iata: 'SFO', city: 'San Francisco', name: 'San Francisco International Airport', country: 'United States' },
  { iata: 'ORD', city: 'Chicago', name: "O'Hare International Airport", country: 'United States' },
  { iata: 'MIA', city: 'Miami', name: 'Miami International Airport', country: 'United States' },
  { iata: 'DFW', city: 'Dallas', name: 'Dallas/Fort Worth International Airport', country: 'United States' },
  { iata: 'SEA', city: 'Seattle', name: 'Seattle-Tacoma International Airport', country: 'United States' },
  { iata: 'BOS', city: 'Boston', name: 'Logan International Airport', country: 'United States' },
  { iata: 'YYZ', city: 'Toronto', name: 'Toronto Pearson International Airport', country: 'Canada' },
  { iata: 'YVR', city: 'Vancouver', name: 'Vancouver International Airport', country: 'Canada' },

  // Europe & UK
  { iata: 'LHR', city: 'London', name: 'Heathrow Airport', country: 'United Kingdom' },
  { iata: 'LGW', city: 'London', name: 'Gatwick Airport', country: 'United Kingdom' },
  { iata: 'CDG', city: 'Paris', name: 'Charles de Gaulle Airport', country: 'France' },
  { iata: 'FRA', city: 'Frankfurt', name: 'Frankfurt Airport', country: 'Germany' },
  { iata: 'MUC', city: 'Munich', name: 'Munich Airport', country: 'Germany' },
  { iata: 'AMS', city: 'Amsterdam', name: 'Amsterdam Airport Schiphol', country: 'Netherlands' },
  { iata: 'MAD', city: 'Madrid', name: 'Adolfo Suárez Madrid–Barajas Airport', country: 'Spain' },
  { iata: 'BCN', city: 'Barcelona', name: 'Josep Tarradellas Barcelona-El Prat Airport', country: 'Spain' },
  { iata: 'FCO', city: 'Rome', name: 'Leonardo da Vinci–Fiumicino Airport', country: 'Italy' },
  { iata: 'ZRH', city: 'Zurich', name: 'Zurich Airport', country: 'Switzerland' },
  { iata: 'VIE', city: 'Vienna', name: 'Vienna International Airport', country: 'Austria' },
  { iata: 'IST', city: 'Istanbul', name: 'Istanbul Airport', country: 'Turkey' },

  // Middle East & Africa
  { iata: 'DXB', city: 'Dubai', name: 'Dubai International Airport', country: 'United Arab Emirates' },
  { iata: 'AUH', city: 'Abu Dhabi', name: 'Zayed International Airport', country: 'United Arab Emirates' },
  { iata: 'DOH', city: 'Doha', name: 'Hamad International Airport', country: 'Qatar' },
  { iata: 'RUH', city: 'Riyadh', name: 'King Khalid International Airport', country: 'Saudi Arabia' },
  { iata: 'JED', city: 'Jeddah', name: 'King Abdulaziz International Airport', country: 'Saudi Arabia' },
  { iata: 'TLV', city: 'Tel Aviv', name: 'Ben Gurion Airport', country: 'Israel' },
  { iata: 'CAI', city: 'Cairo', name: 'Cairo International Airport', country: 'Egypt' },
  { iata: 'JNB', city: 'Johannesburg', name: 'O. R. Tambo International Airport', country: 'South Africa' },

  // Asia Pacific
  { iata: 'SIN', city: 'Singapore', name: 'Singapore Changi Airport', country: 'Singapore' },
  { iata: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi Airport', country: 'Thailand' },
  { iata: 'KUL', city: 'Kuala Lumpur', name: 'Kuala Lumpur International Airport', country: 'Malaysia' },
  { iata: 'HKG', city: 'Hong Kong', name: 'Hong Kong International Airport', country: 'Hong Kong' },
  { iata: 'HND', city: 'Tokyo', name: 'Tokyo Haneda Airport', country: 'Japan' },
  { iata: 'NRT', city: 'Tokyo', name: 'Narita International Airport', country: 'Japan' },
  { iata: 'ICN', city: 'Seoul', name: 'Incheon International Airport', country: 'South Korea' },
  { iata: 'SYD', city: 'Sydney', name: 'Sydney Kingsford Smith Airport', country: 'Australia' },
  { iata: 'MEL', city: 'Melbourne', name: 'Melbourne Airport', country: 'Australia' },
  { iata: 'AKL', city: 'Auckland', name: 'Auckland Airport', country: 'New Zealand' }
]

export const POPULAR_AIRPORTS = [
  { iata: 'BOM', city: 'Mumbai', country: 'India' },
  { iata: 'DEL', city: 'New Delhi', country: 'India' },
  { iata: 'BLR', city: 'Bengaluru', country: 'India' },
  { iata: 'DXB', city: 'Dubai', country: 'UAE' },
  { iata: 'LHR', city: 'London', country: 'UK' },
  { iata: 'JFK', city: 'New York', country: 'USA' },
  { iata: 'SIN', city: 'Singapore', country: 'Singapore' },
  { iata: 'SXR', city: 'Srinagar', country: 'India' }
]

export function searchLocalAirports(query) {
  if (!query || typeof query !== 'string') return POPULAR_AIRPORTS.slice(0, 6)
  const q = query.trim().toLowerCase()
  if (q.length === 0) return POPULAR_AIRPORTS.slice(0, 6)

  return GLOBAL_AIRPORTS.filter(ap =>
    ap.iata.toLowerCase().includes(q) ||
    ap.city.toLowerCase().includes(q) ||
    ap.name.toLowerCase().includes(q) ||
    ap.country.toLowerCase().includes(q)
  ).slice(0, 10)
}
