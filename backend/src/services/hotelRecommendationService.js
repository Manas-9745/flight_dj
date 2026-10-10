const { getAirportByIata } = require('./airportsData');
const { getMockHotelsByAirport, MOCK_HOTELS } = require('../data/mockHotels');

class HotelRecommendationService {
  /**
   * Determine whether a disruption reasonably requires overnight or nearby accommodation
   */
  evaluateAccommodationNeed(trip, disruption, downstreamItems) {
    const status = (disruption?.status || trip?.status || '').toLowerCase();
    const delayMinutes = parseInt(disruption?.delayMinutes || trip?.delayMinutes || 0, 10);
    const disruptionType = disruption?.disruptionType || trip?.disruptionType || '';

    // 1. Confirmed Cancellation
    if (status === 'cancelled' || disruptionType === 'cancellation') {
      return {
        needed: true,
        urgency: 'CRITICAL',
        type: 'cancellation',
        reason: 'Flight has been cancelled. An overnight stay or airport hotel is required until the next available departure.'
      };
    }

    // 2. Flight Diversion
    if (status === 'diverted' || disruptionType === 'diversion') {
      return {
        needed: true,
        urgency: 'CRITICAL',
        type: 'diversion',
        reason: 'Flight diverted to an alternate aerodrome. Travelers require emergency accommodation at the diversion location.'
      };
    }

    // 3. Missed Connection / Connection Risk
    if (
      disruptionType === 'connection_risk' ||
      disruption?.isMissedConnection ||
      trip?.isMissedConnection ||
      (downstreamItems?.connectingFlight && delayMinutes > 90)
    ) {
      return {
        needed: true,
        urgency: 'HIGH',
        type: 'missed_connection',
        reason: 'Onward connecting flight missed or at severe risk. Overnight accommodation required at the transit hub before next flight.'
      };
    }

    // 4. Severe Delay (Overnight or > 3 hours extending into late night)
    if (delayMinutes >= 180) {
      return {
        needed: true,
        urgency: 'HIGH',
        type: 'severe_delay',
        reason: `Significant delay of ${delayMinutes} minutes (${Math.round(delayMinutes / 60)}h) requires overnight stay or late-night accommodation.`
      };
    }

    // 5. Delay pushing scheduled evening arrival past 23:00 (Check-in cutoff risk)
    const scheduledArrival = trip?.metadata?.scheduledArrival || '18:15';
    const [arrHours, arrMins] = scheduledArrival.split(':').map(Number);
    const totalArrivalMins = arrHours * 60 + arrMins + delayMinutes;
    const arrivalPast2300 = totalArrivalMins >= 23 * 60 || totalArrivalMins >= 24 * 60;

    if (delayMinutes >= 90 && arrivalPast2300) {
      return {
        needed: true,
        urgency: 'MEDIUM',
        type: 'late_arrival',
        reason: `Flight arrival delayed to late evening/night (${Math.floor(totalArrivalMins / 60) % 24}:${String(totalArrivalMins % 60).padStart(2, '0')}). Late arrival accommodation support recommended.`
      };
    }

    // Minor daytime delays do NOT require accommodation
    return {
      needed: false,
      urgency: 'NONE',
      type: 'minor_delay',
      reason: `Flight delay of ${delayMinutes} minutes is within daytime operating buffers and does not require overnight accommodation.`
    };
  }

  /**
   * Determine the exact airport and location where accommodation is needed
   */
  determineSearchLocation(trip, disruption, downstreamItems, needEvaluation) {
    let targetCode = (disruption?.destination || trip?.destination || 'DEL').toUpperCase();
    let locationType = 'destination';
    let locationDescription = 'Destination Airport Area';

    // If cancelled before departure -> stranded at origin
    if (needEvaluation.type === 'cancellation') {
      targetCode = (disruption?.origin || trip?.origin || 'DEL').toUpperCase();
      locationType = 'origin_stranded';
      locationDescription = 'Departure Airport (Stranded before flight)';
    }

    // If diverted -> diversion airport
    else if (needEvaluation.type === 'diversion') {
      targetCode = (disruption?.divertedTo || disruption?.diversionAirport || trip?.divertedTo || trip?.diversionAirport || 'JED').toUpperCase();
      locationType = 'diversion_hub';
      locationDescription = 'Emergency Diversion Aerodrome';
    }

    // If missed connection -> connecting transit hub
    else if (needEvaluation.type === 'missed_connection') {
      targetCode = (disruption?.connectionAirport || disruption?.transitAirport || downstreamItems?.connectingFlight?.origin || trip?.connectionAirport || trip?.transitAirport || 'DXB').toUpperCase();
      locationType = 'transit_hub';
      locationDescription = 'Transit Layover Hub';
    }

    // If late arrival -> destination airport
    else {
      targetCode = (disruption?.destination || trip?.destination || 'LHR').toUpperCase();
      locationType = 'destination';
      locationDescription = 'Final Destination Arrival Hub';
    }

    const airportMeta = getAirportByIata(targetCode);

    return {
      airportCode: targetCode,
      airportName: airportMeta?.name || `${targetCode} Airport`,
      city: airportMeta?.city || targetCode,
      country: airportMeta?.country || 'Global',
      locationType,
      locationDescription
    };
  }

  /**
   * Reconcile with existing hotel booking if present
   */
  reconcileExistingBooking(downstreamItems, searchLocation, needEvaluation) {
    let existingHotel = null;
    if (Array.isArray(downstreamItems)) {
      existingHotel = downstreamItems.find(item => item.type === 'hotel' || item.itemType === 'hotel');
    } else if (downstreamItems?.hotel) {
      existingHotel = downstreamItems.hotel;
    }

    if (!existingHotel) {
      return {
        hasExistingHotel: false,
        userActionNeeded: false,
        message: 'No existing hotel reservation recorded for this journey.'
      };
    }

    const hotelCity = (existingHotel.city || '').toLowerCase();
    const searchCity = (searchLocation.city || '').toLowerCase();
    const isSameCity = hotelCity.includes(searchCity) || searchCity.includes(hotelCity);

    if (isSameCity && needEvaluation.type !== 'cancellation') {
      return {
        hasExistingHotel: true,
        hotelName: existingHotel.name,
        isUsableTonight: true,
        userActionNeeded: false,
        actionRecommendation: 'KEEP_EXISTING_AND_NOTIFY',
        recommendation: `You already have a booking at ${existingHotel.name} in ${existingHotel.city}. Rather than booking a new hotel, notify their front desk of your late arrival to hold your room past midnight.`,
        message: `You already have a booking at ${existingHotel.name} in ${existingHotel.city}. Rather than booking a new hotel, notify their front desk of your late arrival to hold your room past midnight.`,
        contactPhone: existingHotel.phone || '+91-11-4999-8888',
        contactLink: existingHotel.contactLink || null,
        city: existingHotel.city,
        status: existingHotel.status || 'confirmed'
      };
    }

    return {
      hasExistingHotel: true,
      hotelName: existingHotel.name,
      isUsableTonight: false,
      userActionNeeded: true,
      actionRecommendation: 'BOOK_NEW_AND_CANCEL_OLD',
      recommendation: `Your existing reservation at ${existingHotel.name} (${existingHotel.city}) cannot be reached tonight because you are stranded at ${searchLocation.airportName} (${searchLocation.city}). Recommend requesting a waiver for tonight and booking nearby emergency accommodation here.`,
      message: `Your existing reservation at ${existingHotel.name} (${existingHotel.city}) cannot be reached tonight because you are stranded at ${searchLocation.airportName} (${searchLocation.city}). Recommend requesting a waiver for tonight and booking nearby emergency accommodation here.`,
      cancellationPolicy: existingHotel.cancellationDeadline || 'Illustrative: 24 hours prior',
      contactPhone: existingHotel.phone || '+91-11-4999-8888',
      contactLink: existingHotel.contactLink || null,
      city: existingHotel.city,
      status: existingHotel.status || 'confirmed'
    };
  }

  /**
   * Main recommendation method
   */
  getNearbyHotelRecommendations({
    trip,
    disruption,
    downstreamItems = null,
    nights = 1,
    checkInDate = null,
    filters = {}
  }) {
    // 1. Evaluate accommodation necessity
    const needEvaluation = this.evaluateAccommodationNeed(trip, disruption, downstreamItems);

    if (!needEvaluation.needed) {
      return {
        accommodationNeeded: false,
        urgency: needEvaluation.urgency,
        reason: needEvaluation.reason,
        recommendationReason: needEvaluation.reason,
        hotels: [],
        recommendations: [],
        disclaimer: 'Hotel recommendations appear only when a disruption reasonably requires overnight accommodation.'
      };
    }

    // 2. Determine search location
    const searchLocation = this.determineSearchLocation(trip, disruption, downstreamItems, needEvaluation);

    // 3. Dates resolution
    const stayNights = Math.max(1, parseInt(nights, 10) || 1);
    const startDate = checkInDate || trip?.travelDate || new Date().toISOString().split('T')[0];
    const endDate = this._addDays(startDate, stayNights);

    // 4. Reconcile existing hotel reservation
    const existingReconciliation = this.reconcileExistingBooking(downstreamItems, searchLocation, needEvaluation);

    // 5. Fetch location-specific mock hotels
    const baseHotels = getMockHotelsByAirport(searchLocation.airportCode);

    if (baseHotels.length === 0) {
      return {
        accommodationNeeded: true,
        urgency: needEvaluation.urgency,
        reason: needEvaluation.reason,
        recommendationReason: needEvaluation.reason,
        searchLocation,
        searchAirport: {
          code: searchLocation.airportCode,
          name: searchLocation.airportName,
          city: searchLocation.city
        },
        checkInDate: startDate,
        checkOutDate: endDate,
        nights: stayNights,
        requestedNights: stayNights,
        hasMockHotels: false,
        existingReconciliation,
        existingReservation: existingReconciliation,
        hotels: [],
        recommendations: [],
        emptyStateMessage: `No demo hotel listings are configured for ${searchLocation.city} (${searchLocation.airportCode}) yet. In production, live hotel inventory will query this location.`,
        disclaimer: 'Illustrative mock data only. Never shows unrelated hotels from another city.'
      };
    }

    // 6. Calculate total price and format hotels
    let processedHotels = baseHotels.map(h => {
      const totalPrice = h.nightlyRate * stayNights;
      return {
        ...h,
        nights: stayNights,
        checkInDate: startDate,
        checkOutDate: endDate,
        totalPrice,
        totalEstimate: totalPrice,
        priceBreakdownNote: `Demo total: ${h.currencySymbol || '$'}${h.nightlyRate}/night × ${stayNights} ${stayNights === 1 ? 'night' : 'nights'} = ${h.currencySymbol || '$'}${totalPrice} (Excludes illustrative local taxes)`
      };
    });

    // 7. Apply UI filters
    if (filters.hasShuttle) {
      processedHotels = processedHotels.filter(h => h.hasAirportShuttle);
    }
    if (filters.maxPrice) {
      processedHotels = processedHotels.filter(h => h.nightlyRate <= filters.maxPrice);
    }

    // Apply sorting
    if (filters.sortBy === 'price_low') {
      processedHotels.sort((a, b) => a.nightlyRate - b.nightlyRate);
    } else if (filters.sortBy === 'distance') {
      processedHotels.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (filters.sortBy === 'rating') {
      processedHotels.sort((a, b) => b.rating - a.rating);
    }

    return {
      accommodationNeeded: true,
      urgency: needEvaluation.urgency,
      reason: needEvaluation.reason,
      recommendationReason: needEvaluation.reason,
      searchLocation,
      searchAirport: {
        code: searchLocation.airportCode,
        name: searchLocation.airportName,
        city: searchLocation.city
      },
      checkInDate: startDate,
      checkOutDate: endDate,
      nights: stayNights,
      requestedNights: stayNights,
      hasMockHotels: true,
      existingReconciliation,
      existingReservation: existingReconciliation,
      totalHotelsFound: processedHotels.length,
      hotels: processedHotels,
      recommendations: processedHotels,
      disclaimer: 'DEMO DATA NOTICE: All hotel prices, ratings, room availability, and policies are illustrative sample records stored locally in AeroMate. Live bookings and payment processing are disabled in demo mode.'
    };
  }

  // Helper: add days to YYYY-MM-DD string
  _addDays(dateStr, days) {
    try {
      const date = new Date(dateStr);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  }
}

module.exports = new HotelRecommendationService();
