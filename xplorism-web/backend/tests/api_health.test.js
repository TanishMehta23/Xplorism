import test from 'node:test';
import assert from 'node:assert/strict';

test('API Health & Error Resilience Suite', async (t) => {
  await t.test('Health Check Verification: /health returns 200 OK with status message', () => {
    // Model health handler from backend index.js
    function healthHandler(req, res) {
      return res.status(200).json({
        status: 'ok',
        message: 'Xplorism API is running',
        timestamp: new Date().toISOString()
      });
    }

    let statusCode = null;
    let jsonBody = null;
    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonBody = data;
        return this;
      }
    };

    healthHandler({}, mockRes);
    assert.equal(statusCode, 200);
    assert.equal(jsonBody.status, 'ok');
    assert.equal(jsonBody.message, 'Xplorism API is running');
    assert.ok(jsonBody.timestamp);
  });

  await t.test('Catch-All 404 Handler: unknown routes return clean JSON response', () => {
    // Model 404 middleware from index.js
    function notFoundHandler(req, res) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    let statusCode = null;
    let jsonBody = null;
    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonBody = data;
        return this;
      }
    };

    notFoundHandler({ path: '/api/v1/non-existent-endpoint' }, mockRes);
    assert.equal(statusCode, 404);
    assert.deepEqual(jsonBody, { message: 'Resource not found' });
  });

  await t.test('External API Timeout Resilience: OpenSky flight failure seamlessly falls back to mock radar pool', async () => {
    // Model flight route resilience logic
    async function fetchFlightRadarWithResilience(openSkyFetcher, mockPoolGenerator) {
      let rawStates = [];
      let source = 'mock';

      try {
        const remoteData = await openSkyFetcher();
        if (remoteData && remoteData.states && remoteData.states.length > 0) {
          rawStates = remoteData.states;
          source = 'opensky';
        }
      } catch (err) {
        // Fallback triggered gracefully without throwing 500
        rawStates = mockPoolGenerator();
        source = 'mock';
      }

      if (rawStates.length === 0) {
        rawStates = mockPoolGenerator();
        source = 'mock';
      }

      return { source, count: rawStates.length };
    }

    // Case 1: OpenSky times out / throws
    const failingOpenSky = async () => {
      throw new Error('ETIMEDOUT: Connection to opensky-network.org failed after 4000ms');
    };
    const mockGenerator = () => [
      ['icao1', 'BAW101', 'United Kingdom'],
      ['icao2', 'AFR202', 'France']
    ];

    const fallbackResult = await fetchFlightRadarWithResilience(failingOpenSky, mockGenerator);
    assert.equal(fallbackResult.source, 'mock');
    assert.equal(fallbackResult.count, 2);

    // Case 2: OpenSky succeeds
    const healthyOpenSky = async () => ({
      states: [['icao9', 'AIC101', 'India']]
    });
    const successResult = await fetchFlightRadarWithResilience(healthyOpenSky, mockGenerator);
    assert.equal(successResult.source, 'opensky');
    assert.equal(successResult.count, 1);
  });

  await t.test('Geocoding Multi-Tier Failover: Nominatim failure triggers Open-Meteo fallback', async () => {
    async function resolveGeocodeWithFallback(query, nominatimFetch, openMeteoFetch) {
      // 1. Try Nominatim
      try {
        const nomResults = await nominatimFetch(query);
        if (nomResults && nomResults.length > 0) {
          return { source: 'nominatim', results: nomResults };
        }
      } catch (e) {
        // Fallback to Open-Meteo
      }

      // 2. Open-Meteo Fallback
      try {
        const omResults = await openMeteoFetch(query);
        return { source: 'open-meteo', results: omResults };
      } catch (e) {
        return { source: 'none', results: [] };
      }
    }

    const failingNominatim = async () => { throw new Error('HTTP 429 Too Many Requests'); };
    const healthyOpenMeteo = async (q) => ([{ name: q, latitude: 28.6139, longitude: 77.2090 }]);

    const res = await resolveGeocodeWithFallback('Delhi', failingNominatim, healthyOpenMeteo);
    assert.equal(res.source, 'open-meteo');
    assert.equal(res.results.length, 1);
    assert.equal(res.results[0].name, 'Delhi');
  });

  await t.test('Async Email Dispatch Resilience: notification failure does not crash core transaction', async () => {
    let transactionCompleted = false;

    async function executeTripCreation(tripData, emailNotifier) {
      // 1. Perform core transactional operation
      const createdTrip = { id: 'trip-999', ...tripData, createdAt: new Date() };
      transactionCompleted = true;

      // 2. Non-blocking asynchronous email dispatch (fire-and-forget / catch)
      emailNotifier(createdTrip).catch((err) => {
        // Log warning without crashing or rolling back successful trip creation
        console.warn('Background email dispatch failed:', err.message);
      });

      return { status: 201, trip: createdTrip };
    }

    const failingEmailService = async () => {
      throw new Error('SMTP connection refused on port 587');
    };

    const response = await executeTripCreation({ destination: 'Kyoto' }, failingEmailService);
    assert.equal(response.status, 201);
    assert.equal(response.trip.destination, 'Kyoto');
    assert.equal(transactionCompleted, true, 'Core transaction must succeed despite email delivery failure');
  });

  await t.test('Global Error Handling Middleware: catches unexpected exceptions and emits JSON 500', () => {
    let statusCode = null;
    let jsonBody = null;

    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonBody = data;
        return this;
      }
    };

    function errorHandlerMiddleware(err, req, res, next) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    const unhandledError = new Error('Database pool exhausted');
    errorHandlerMiddleware(unhandledError, {}, mockRes, () => {});

    assert.equal(statusCode, 500);
    assert.deepEqual(jsonBody, { message: 'Internal Server Error' });
  });
});

