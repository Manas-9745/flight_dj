const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const headers = { Authorization: 'Bearer demo-token' };

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting AI Disruption Manager & Whole-Journey Tests');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  // 1. Test Disruption Monitoring
  try {
    const res = await axios.get(`${BASE_URL}/disruptions/monitoring`, { headers });
    if (res.data?.success && res.data?.data?.trips?.length > 0) {
      console.log('✅ [1] Disruption Monitoring Feed: PASSED', {
        totalTrips: res.data.data.totalTripsChecked,
        activeDisruptions: res.data.data.activeDisruptionsCount,
        disruptedFlight: res.data.data.trips[0].flightNumber,
        status: res.data.data.trips[0].status,
        delayMinutes: res.data.data.trips[0].delayMinutes
      });
      passed++;
    } else {
      throw new Error('Monitoring feed did not return expected trips.');
    }
  } catch (e) {
    console.error('❌ [1] Disruption Monitoring Feed: FAILED', e.message);
    failed++;
  }

  // 2. Test Alternative Flight Search with Rankings & Fare Differences
  try {
    const res = await axios.post(`${BASE_URL}/disruptions/alternatives`, {
      origin: 'DEL',
      destination: 'LHR',
      disruptedFlightNumber: 'BA142',
      disruptedAirline: 'British Airways',
      delayMinutes: 210,
      disruptionType: 'severe_delay',
      originalFare: 450
    }, { headers });

    const alts = res.data?.data?.alternatives;
    const recs = res.data?.data?.rankedRecommendations;
    if (res.data?.success && alts?.length >= 3 && recs?.earliestArrival && recs?.lowestCost) {
      console.log('✅ [2] Alternative Flight Search & Rankings: PASSED', {
        alternativesCount: alts.length,
        earliestArrival: `${recs.earliestArrival.airline} ${recs.earliestArrival.flightNumber} (${recs.earliestArrival.arrivalTime})`,
        lowestCost: `${recs.lowestCost.airline} ${recs.lowestCost.flightNumber} (Diff: $${recs.lowestCost.fareDifference})`,
        bestOverall: `${recs.bestOverallRecovery.airline} ${recs.bestOverallRecovery.flightNumber}`
      });
      passed++;
    } else {
      throw new Error('Alternatives search did not return ranked recommendations.');
    }
  } catch (e) {
    console.error('❌ [2] Alternative Flight Search: FAILED', e.message);
    failed++;
  }

  // 3. Test Whole-Journey Impact Engine (Connecting flight, Hotel, Chauffeur transfer, Tours)
  try {
    const res = await axios.post(`${BASE_URL}/disruptions/impact`, {
      flightNumber: 'BA142',
      delayMinutes: 210,
      status: 'delayed'
    }, { headers });

    const impacts = res.data?.data?.impactItems;
    const connImpact = impacts?.find(i => i.itemType === 'flight');
    const hotelImpact = impacts?.find(i => i.itemType === 'hotel');
    const transImpact = impacts?.find(i => i.itemType === 'transport');
    const tourImpact = impacts?.find(i => i.itemType === 'tour');

    if (res.data?.success && connImpact && hotelImpact && transImpact && tourImpact) {
      console.log('✅ [3] Whole-Journey Impact Engine: PASSED', {
        totalItemsImpacted: res.data.data.totalItemsImpacted,
        criticalItemsCount: res.data.data.criticalItemsCount,
        connectionStatus: connImpact.impactLevel,
        hotelStatus: hotelImpact.impactLevel,
        transportStatus: transImpact.impactLevel,
        tourStatus: tourImpact.impactLevel
      });
      passed++;
    } else {
      throw new Error('Impact engine did not return all 4 downstream item evaluations.');
    }
  } catch (e) {
    console.error('❌ [3] Whole-Journey Impact Engine: FAILED', e.message);
    failed++;
  }

  // 4. Test Proposed Itinerary Recovery Generation (Before vs After)
  try {
    const res = await axios.post(`${BASE_URL}/disruptions/propose`, {
      originalTrip: {
        flight_number: 'BA142',
        airline: 'British Airways',
        origin: 'LHR',
        destination: 'JFK'
      },
      selectedAlternative: {
        flightNumber: 'AI161',
        airline: 'Air India',
        origin: 'LHR',
        destination: 'JFK',
        departureTime: '17:00',
        arrivalTime: '21:30',
        fare: 480,
        fareDifference: 30,
        rebookingType: 'New Ticket (Separate Airline)'
      }
    }, { headers });

    const prop = res.data?.data;
    if (res.data?.success && prop?.beforeItinerary && prop?.afterItinerary && prop?.costBreakdown) {
      console.log('✅ [4] Proposed Recovery Generation: PASSED', {
        beforeFlight: prop.beforeItinerary.flight.flightNumber,
        afterFlight: prop.afterItinerary.flight.flightNumber,
        fareDifference: `$${prop.costBreakdown.fareDifference}`,
        summary: prop.proposedChangeSummary
      });
      passed++;
    } else {
      throw new Error('Propose endpoint did not return before-and-after comparison.');
    }
  } catch (e) {
    console.error('❌ [4] Proposed Recovery Generation: FAILED', e.message);
    failed++;
  }

  // 5. Test User Approval & Itinerary Revision with Audit Trail
  try {
    const res = await axios.post(`${BASE_URL}/disruptions/apply`, {
      tripId: 'mock-trip-1',
      newFlight: {
        flightNumber: 'AI161',
        airline: 'Air India',
        departureTime: '17:00',
        arrivalTime: '21:30',
        fareDifference: 30,
        previousFlightNumber: 'BA142'
      },
      approvalNote: 'Approved by test suite for whole-journey recovery'
    }, { headers });

    if (res.data?.success && res.data?.data?.auditEvent) {
      console.log('✅ [5] User Approval & Itinerary Revision: PASSED', {
        auditId: res.data.data.auditEvent.id,
        action: res.data.data.auditEvent.action,
        newFlight: res.data.data.auditEvent.newFlightNumber,
        externalBookingsNotice: res.data.data.auditEvent.externalBookingsStatus
      });
      passed++;
    } else {
      throw new Error('Apply endpoint failed to record audit event.');
    }
  } catch (e) {
    console.error('❌ [5] User Approval & Itinerary Revision: FAILED', e.message);
    failed++;
  }

  // 6. Test Alert Dismissal
  try {
    const res = await axios.post(`${BASE_URL}/disruptions/dismiss`, {
      alertId: 'mock-trip-1_delayed_210'
    }, { headers });

    if (res.data?.success && res.data?.data?.dismissedAlertId) {
      console.log('✅ [6] Disruption Alert Dismissal: PASSED', {
        dismissedId: res.data.data.dismissedAlertId
      });
      passed++;
    } else {
      throw new Error('Dismiss endpoint did not acknowledge dismissal.');
    }
  } catch (e) {
    console.error('❌ [6] Disruption Alert Dismissal: FAILED', e.message);
    failed++;
  }

  console.log('====================================================');
  console.log(`🏁 Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');
}

runTests();
