import express from 'express';
import {
  searchGoogleHotels,
  searchGoogleFlights,
  searchGoogleTransit
} from '../services/googleTravelService.js';
import { searchAirports } from '../data/airports.js';
import { searchStations } from '../data/stations.js';

const router = express.Router();

// GET /travel/stations?q=delhi
router.get('/stations', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    const stations = searchStations(q);
    res.json(stations);
  } catch (err) {
    console.error('Route /travel/stations error:', err);
    res.status(500).json({ message: 'Failed to search stations' });
  }
});

// GET /travel/airports?q=delhi
router.get('/airports', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    const airports = searchAirports(q);
    res.json(airports);
  } catch (err) {
    console.error('Route /travel/airports error:', err);
    res.status(500).json({ message: 'Failed to search airports' });
  }
});

// GET /travel/hotels?location=Goa&checkIn=2026-09-01&checkOut=2026-09-05&guests=2&currency=USD
router.get('/hotels', async (req, res) => {
  try {
    const { location, checkIn, checkOut, guests, currency } = req.query;
    if (!location) {
      return res.status(400).json({ message: 'Location query parameter is required' });
    }
    const hotels = await searchGoogleHotels({
      location,
      checkIn,
      checkOut,
      guests: guests ? parseInt(guests, 10) : 2,
      currency: currency || 'USD'
    });
    res.json(hotels);
  } catch (err) {
    console.error('Route /travel/hotels error:', err);
    res.status(500).json({ message: 'Failed to fetch hotel search results' });
  }
});

// GET /travel/flights?origin=DEL&destination=BOM&departureDate=2026-09-01&returnDate=2026-09-05&travelers=1&currency=USD
router.get('/flights', async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, tripType, travelers, currency } = req.query;
    if (!origin || !destination) {
      return res.status(400).json({ message: 'Both origin and destination query parameters are required' });
    }
    const flights = await searchGoogleFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      tripType,
      travelers: travelers ? parseInt(travelers, 10) : 1,
      currency: currency || 'USD'
    });
    res.json(flights);
  } catch (err) {
    console.error('Route /travel/flights error:', err);
    res.status(500).json({ message: 'Failed to fetch flight search results' });
  }
});

// GET /travel/transit?origin=Delhi&destination=Agra&date=2026-09-01&mode=train&currency=USD
router.get('/transit', async (req, res) => {
  try {
    const { origin, destination, date, returnDate, tripType, mode, currency } = req.query;
    if (!origin || !destination) {
      return res.status(400).json({ message: 'Both origin and destination query parameters are required' });
    }
    const transit = await searchGoogleTransit({
      origin,
      destination,
      date,
      returnDate,
      tripType,
      mode: mode || 'train',
      currency: currency || 'USD'
    });
    res.json(transit);
  } catch (err) {
    console.error('Route /travel/transit error:', err);
    res.status(500).json({ message: 'Failed to fetch transit search results' });
  }
});

export default router;
