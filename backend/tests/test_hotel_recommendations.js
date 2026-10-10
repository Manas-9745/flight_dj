const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const headers = { Authorization: 'Bearer demo-token' };

async function runHotelTests() {
  console.log('====================================================');
  console.log('🏨 Starting AI Nearby Hotel Recommendations Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Delhi cancellation → only Delhi demo hotels
  try {
    const res = await axios.post(`${BASE_URL}/disruptions/hotels`, {
      disruption: {
        origin: 'DEL',
        destination: 'DXB',
        flightNumber: '6E-204',
        status: 'cancelled',
        disruptionReason: 'Flight cancelled due to airspace restriction'
      },
      nights: 1
    }, { headers });

    const data = res.data?.data;
    const allDEL = data?.recommendations?.every(h => h.airportCode === 'DEL');
    if (res.data?.success && data?.accommodationNeeded && data?.recommendations?.length > 0 && allDEL) {
      console.log('✅ [1] Delhi Cancellation Test: PASSED', {
        searchAirport: data.searchAirport.code,
        hotelsFound: data.recommendations.length,
        hotelNames: data.recommendations.map(h => h.name)
      });
      passed++;
    } else {
      throw new Error(`Failed to return exclusively Delhi hotels. Found: ${JSON.stringify(data?.recommendations)}`);
    }
  } catch (e) {
    console.error('❌ [1] Delhi Cancellation Test: FAILED', e.message);
    failed++;
  }

  // 2. Srinagar cancellation → only Srinagar demo hotels
  try {
    const res = await axios.post(`${BASE_URL}/disruptions/hotels`, {
      disruption: {
        origin: 'SXR',
        destination: 'DEL',
        flightNumber: 'AI-826',
        status: 'cancelled',
        disruptionReason: 'Severe snowstorm grounded departures at Srinagar'
      },
      nights: 1
    }, { headers });

    const data = res.data?.data;
    const allSXR = data?.recommendations?.every(h => h.airportCode === 'SXR');
    if (res.data?.success && data?.accommodationNeeded && data?.recommendations?.length > 0 && allSXR) {
      console.log('✅ [2] Srinagar Cancellation Test: PASSED', {
        searchAirport: data.searchAirport.code,
        hotelsFound: data.recommendations.length,
        hotelNames: data.recommendations.map(h => h.name)
      });
      passed++;
    } else {
      throw new Error(`Failed to return exclusively Srinagar hotels. Found: ${JSON.stringify(data?.recommendations)}`);
    }
  } catch (e) {
    console.error('❌ [2] Srinagar Cancellation Test: FAILED', e.message);
    failed++;
  }

  // 3. Jeddah diversion → only Jeddah demo hotels
  try {
    const res = await axios.post(`${BASE_URL}/disruptions/hotels`, {
      disruption: {
        origin: 'DXB',
        destination: 'RUH',
        divertedTo: 'JED',
        flightNumber: 'SV-128',
        status: 'diverted',
        disruptionReason: 'Dust storm at destination; diverted to King Abdulaziz Int Airport'
      },
      nights: 1
    }, { headers });

    const data = res.data?.data;
    const allJED = data?.recommendations?.every(h => h.airportCode === 'JED');
    if (res.data?.success && data?.accommodationNeeded && data?.recommendations?.length > 0 && allJED) {
      console.log('✅ [3] Jeddah Diversion Test: PASSED', {
        searchAirport: data.searchAirport.code,
        hotelsFound: data.recommendations.length,
        hotelNames: data.recommendations.map(h => h.name)
      });
      passed++;
    } else {
      throw new Error(`Failed to return exclusively Jeddah hotels. Found: ${JSON.stringify(data?.recommendations)}`);
    }
  } catch (e) {
    console.error('❌ [3] Jeddah Diversion Test: FAILED', e.message);
    failed++;
  }

  // 4. Dubai overnight connection → only Dubai demo hotels
  try {
    const res = await axios.post(`${BASE_URL}/disruptions/hotels`, {
      disruption: {
        origin: 'BOM',
        destination: 'LHR',
        connectionAirport: 'DXB',
        transitAirport: 'DXB',
        flightNumber: 'EK-501',
        status: 'delayed',
        isMissedConnection: true,
        delayMinutes: 240,
        disruptionReason: 'Inbound delay caused missed onward connection in Dubai'
      },
      nights: 1
    }, { headers });

    const data = res.data?.data;
    const allDXB = data?.recommendations?.every(h => h.airportCode === 'DXB');
    if (res.data?.success && data?.accommodationNeeded && data?.recommendations?.length > 0 && allDXB) {
      console.log('✅ [4] Dubai Missed Connection Test: PASSED', {
        searchAirport: data.searchAirport.code,
        hotelsFound: data.recommendations.length,
        hotelNames: data.recommendations.map(h => h.name)
      });
      passed++;
    } else {
      throw new Error(`Failed to return exclusively Dubai hotels. Found: ${JSON.stringify(data?.recommendations)}`);
    }
  } catch (e) {
    console.error('❌ [4] Dubai Missed Connection Test: FAILED', e.message);
    failed++;
  }

  // 5. Minor daytime delay → no hotel recommendations
  try {
    const res = await axios.post(`${BASE_URL}/disruptions/hotels`, {
      disruption: {
        origin: 'DEL',
        destination: 'BOM',
        flightNumber: '6E-551',
        status: 'delayed',
        delayMinutes: 25,
        scheduledDeparture: '14:30',
        disruptionReason: 'Minor gate congestion'
      },
      nights: 1
    }, { headers });

    const data = res.data?.data;
    if (res.data?.success && data?.accommodationNeeded === false && data?.recommendations?.length === 0) {
      console.log('✅ [5] Minor Daytime Delay Test: PASSED', {
        accommodationNeeded: data.accommodationNeeded,
        recommendationReason: data.recommendationReason,
        hotelsReturned: data.recommendations.length
      });
      passed++;
    } else {
      throw new Error('Minor daytime delay unexpectedly triggered accommodation recommendations.');
    }
  } catch (e) {
    console.error('❌ [5] Minor Daytime Delay Test: FAILED', e.message);
    failed++;
  }

  // 6. Unknown airport or missing hotel dataset → clear empty state
  try {
    const res = await axios.post(`${BASE_URL}/disruptions/hotels`, {
      disruption: {
        origin: 'XYZ',
        destination: 'ABC',
        flightNumber: 'TEST-999',
        status: 'cancelled',
        disruptionReason: 'Cancelled at unconfigured test airfield'
      },
      nights: 1
    }, { headers });

    const data = res.data?.data;
    if (res.data?.success && data?.hasMockHotels === false && data?.recommendations?.length === 0 && data?.emptyStateMessage) {
      console.log('✅ [6] Unconfigured Airport Empty State Test: PASSED', {
        hasMockHotels: data.hasMockHotels,
        emptyStateMessage: data.emptyStateMessage,
        hotelsCount: data.recommendations.length
      });
      passed++;
    } else {
      throw new Error('Unconfigured airport did not return expected empty state.');
    }
  } catch (e) {
    console.error('❌ [6] Unconfigured Airport Empty State Test: FAILED', e.message);
    failed++;
  }

  // 7. Price and distance filters → correct results
  try {
    // Distance sort
    const resDist = await axios.post(`${BASE_URL}/disruptions/hotels`, {
      disruption: { origin: 'DEL', status: 'cancelled' },
      filters: { sortBy: 'distance' }
    }, { headers });
    const distHotels = resDist.data?.data?.recommendations;

    // Price sort
    const resPrice = await axios.post(`${BASE_URL}/disruptions/hotels`, {
      disruption: { origin: 'DEL', status: 'cancelled' },
      filters: { sortBy: 'price_low' }
    }, { headers });
    const priceHotels = resPrice.data?.data?.recommendations;

    // Shuttle filter
    const resShuttle = await axios.post(`${BASE_URL}/disruptions/hotels`, {
      disruption: { origin: 'DEL', status: 'cancelled' },
      filters: { hasShuttle: true }
    }, { headers });
    const shuttleHotels = resShuttle.data?.data?.recommendations;

    const isDistSorted = distHotels[0].distanceKm <= distHotels[1].distanceKm;
    const isPriceSorted = priceHotels[0].nightlyRate <= priceHotels[1].nightlyRate;
    const allHaveShuttle = shuttleHotels.every(h => h.amenities.some(a => a.toLowerCase().includes('shuttle')));

    if (isDistSorted && isPriceSorted && allHaveShuttle) {
      console.log('✅ [7] Filter and Sort Test (Distance, Price, Shuttle): PASSED', {
        closestHotel: `${distHotels[0].name} (${distHotels[0].distanceKm} km)`,
        lowestPriceHotel: `${priceHotels[0].name} ($${priceHotels[0].nightlyRate}/night)`,
        shuttleHotelsCount: shuttleHotels.length
      });
      passed++;
    } else {
      throw new Error('Sorting or shuttle filtering failed validation.');
    }
  } catch (e) {
    console.error('❌ [7] Filter and Sort Test: FAILED', e.message);
    failed++;
  }

  // 8. Multiple-night stay → correct illustrative total
  try {
    const res3Nights = await axios.post(`${BASE_URL}/disruptions/hotels`, {
      disruption: { origin: 'LHR', status: 'cancelled' },
      nights: 3
    }, { headers });

    const data = res3Nights.data?.data;
    const firstHotel = data?.recommendations?.[0];
    const expectedTotal = firstHotel ? firstHotel.nightlyRate * 3 : 0;

    if (firstHotel && firstHotel.totalEstimate === expectedTotal && data.requestedNights === 3) {
      console.log('✅ [8] Multi-Night Calculation Test (3 nights): PASSED', {
        hotel: firstHotel.name,
        nightlyRate: firstHotel.nightlyRate,
        nights: data.requestedNights,
        totalEstimate: firstHotel.totalEstimate,
        expectedTotal
      });
      passed++;
    } else {
      throw new Error(`Total estimate ${firstHotel?.totalEstimate} does not match expected 3-night total ${expectedTotal}`);
    }
  } catch (e) {
    console.error('❌ [8] Multi-Night Calculation Test: FAILED', e.message);
    failed++;
  }

  // 9. Existing booking reconciliation & safe URL verification
  try {
    const res = await axios.post(`${BASE_URL}/disruptions/hotels`, {
      disruption: { origin: 'DEL', status: 'cancelled' },
      downstreamItems: [
        {
          id: 'hotel-01',
          type: 'hotel',
          name: 'Marina Bay Sands',
          city: 'Singapore',
          date: '2026-10-15',
          status: 'confirmed'
        }
      ]
    }, { headers });

    const data = res.data?.data;
    const hasReconciliation = data?.existingReservation?.userActionNeeded === true;
    const hasSafeUrl = data?.recommendations?.every(h => h.safeSearchUrl && h.safeSearchUrl.startsWith('https://www.google.com/travel/hotels'));

    if (hasReconciliation && hasSafeUrl) {
      console.log('✅ [9] Existing Reservation Notice & Safe URL Test: PASSED', {
        existingBookingConflict: data.existingReservation.recommendation,
        safeUrlSample: data.recommendations[0].safeSearchUrl
      });
      passed++;
    } else {
      throw new Error('Reservation reconciliation or safe search URLs failed verification.');
    }
  } catch (e) {
    console.error('❌ [9] Existing Reservation Notice & Safe URL Test: FAILED', e.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runHotelTests();
