import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Plus, Calendar, Compass as TripIcon,
  Trash2, DollarSign, Users, Sparkles, X, Clock, MapPin, Tag, Edit,
  Sun, Cloud, CloudRain, Snowflake, Wind, Heart, Download, Search
} from 'lucide-react';
import { api } from '../services/api';
import TripWizard from '../components/TripWizard';
import Navbar from '../components/Navbar';

export const CURRENCIES = {
  INR: { symbol: '₹', name: 'INR (₹)', locale: 'en-IN' },
  USD: { symbol: '$', name: 'USD ($)', locale: 'en-US' },
  EUR: { symbol: '€', name: 'EUR (€)', locale: 'de-DE' },
  GBP: { symbol: '£', name: 'GBP (£)', locale: 'en-GB' },
  JPY: { symbol: '¥', name: 'JPY (¥)', locale: 'ja-JP' },
  AUD: { symbol: 'A$', name: 'AUD (A$)', locale: 'en-AU' },
  CAD: { symbol: 'C$', name: 'CAD (C$)', locale: 'en-CA' },
  CHF: { symbol: 'CHF', name: 'CHF (CHF)', locale: 'de-CH' },
  CNY: { symbol: '¥', name: 'CNY (¥)', locale: 'zh-CN' },
  SGD: { symbol: 'S$', name: 'SGD (S$)', locale: 'en-SG' }
};

const PRE_PLANNED_TRIPS = [
  { id: 'pre-tokyo', destination: 'Tokyo, Japan', image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 120000, travelers: 2, travelStyle: 'Urban Adventure|JPY', interests: ['Food', 'Architecture', 'History'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Morning walk around Shibuya Crossing & Hachiko Statue', time: '09:30 AM', location: 'Shibuya Crossing', estimatedCost: 0 }, { day: 1, activity: 'Sushi making experience and lunch at Tsukiji Outer Market', time: '02:00 PM', location: 'Tsukiji Market', estimatedCost: 3500 }, { day: 1, activity: 'Observe skylines from Tokyo Metropolitan Government Building', time: '07:00 PM', location: 'Shinjuku', estimatedCost: 0 }, { day: 2, activity: 'Explore Senso-ji temple and Nakamise-dori shopping street', time: '09:30 AM', location: 'Asakusa', estimatedCost: 500 }, { day: 2, activity: 'Anime culture shopping in Akihabara Electric Town', time: '02:00 PM', location: 'Akihabara', estimatedCost: 2000 }, { day: 2, activity: 'Enjoy a warm bowl of Ramen in an authentic Ramen Alley', time: '07:00 PM', location: 'Omoide Yokocho', estimatedCost: 1200 }, { day: 3, activity: 'Walk around Meiji Jingu Shrine and scenic Yoyogi Park', time: '10:00 AM', location: 'Yoyogi Park', estimatedCost: 0 }, { day: 3, activity: 'Crepe tasting and fashion shopping on Takeshita Street', time: '02:00 PM', location: 'Takeshita Street', estimatedCost: 1200 }, { day: 3, activity: 'Local Izakaya dining experience with drinks and skewers', time: '07:30 PM', location: 'Roppongi', estimatedCost: 4000 }] },
  { id: 'pre-paris', destination: 'Paris, France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 1800, travelers: 2, travelStyle: 'Romantic & Art Tour|EUR', interests: ['Art', 'History', 'Food'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Guided tour of Louvre Museum Masterpieces (Mona Lisa access)', time: '09:30 AM', location: 'Louvre Museum', estimatedCost: 45 }, { day: 1, activity: 'Scenic Seine River Cruise with sunset champagne toast', time: '07:00 PM', location: 'Bateaux Parisiens', estimatedCost: 30 }, { day: 2, activity: 'Eiffel Tower Summit Access & architectural commentary', time: '09:30 AM', location: 'Eiffel Tower', estimatedCost: 60 }, { day: 2, activity: 'Wander the historic art streets and view Basilique du Sacré-Cœur', time: '02:00 PM', location: 'Montmartre', estimatedCost: 0 }, { day: 3, activity: 'Explore Notre-Dame Cathedral plaza and Saint-Germain district', time: '10:00 AM', location: 'Saint-Germain', estimatedCost: 0 }, { day: 3, activity: 'Browse books at Shakespeare and Company and visit Pantheon', time: '02:30 PM', location: 'Shakespeare & Co', estimatedCost: 15 }, { day: 3, activity: 'Traditional Parisian Bistro dinner tasting local delicacies', time: '07:30 PM', location: 'Le Relais de l\'Entrecôte', estimatedCost: 80 }, { day: 4, activity: 'Day trip to Palace of Versailles gardens and palace rooms', time: '09:00 AM', location: 'Versailles', estimatedCost: 50 }, { day: 4, activity: 'Farewell walk along Champs-Élysées and macarons tasting', time: '04:00 PM', location: 'Champs-Élysées', estimatedCost: 25 }] },
  { id: 'pre-newyork', destination: 'New York, USA', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 2500, travelers: 1, travelStyle: 'Urban Adventure|USD', interests: ['Shopping', 'Food', 'Art'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Walk across the historic Brooklyn Bridge for sunrise views', time: '08:30 AM', location: 'Brooklyn Bridge', estimatedCost: 0 }, { day: 1, activity: 'Lunch walk along High Line park and Chelsea Market', time: '01:00 PM', location: 'High Line', estimatedCost: 25 }, { day: 1, activity: 'Witness the neon energy of Times Square and watch a Broadway show', time: '07:30 PM', location: 'Broadway Theatre', estimatedCost: 120 }, { day: 2, activity: 'Explore Central Park by bicycle and visit Metropolitan Museum of Art', time: '09:30 AM', location: 'Central Park', estimatedCost: 40 }, { day: 2, activity: 'Top of the Rock observation deck skyline views', time: '04:00 PM', location: 'Rockefeller Center', estimatedCost: 45 }, { day: 3, activity: 'Ferry ride to Statue of Liberty and Ellis Island Museum', time: '09:00 AM', location: 'Liberty Island', estimatedCost: 30 }, { day: 3, activity: 'Walk through Wall Street and see One World Observatory', time: '02:00 PM', location: 'Financial District', estimatedCost: 45 }, { day: 4, activity: 'Shop and explore local boutiques in SoHo and Greenwich Village', time: '10:00 AM', location: 'SoHo', estimatedCost: 0 }, { day: 4, activity: 'Jazz performance and dinner in a cozy Greenwich Village basement club', time: '08:00 PM', location: 'Greenwich Village', estimatedCost: 60 }, { day: 5, activity: 'Visit Grand Central Terminal and enjoy lunch at Oyster Bar', time: '11:00 AM', location: 'Grand Central', estimatedCost: 35 }, { day: 5, activity: 'Farewell walk along Fifth Avenue and view Empire State Building', time: '03:00 PM', location: 'Fifth Avenue', estimatedCost: 0 }] },
  { id: 'pre-london', destination: 'London, UK', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 1800, travelers: 2, travelStyle: 'Cultural|GBP', interests: ['History', 'Architecture'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'See the Tower of London & walk across Tower Bridge', time: '09:30 AM', location: 'Tower Bridge', estimatedCost: 35 }, { day: 1, activity: 'Classic British Pub dinner with fish and chips in Soho', time: '07:00 PM', location: 'Soho Pub', estimatedCost: 40 }, { day: 2, activity: 'Watch the Changing of the Guard at Buckingham Palace', time: '10:00 AM', location: 'Buckingham Palace', estimatedCost: 0 }, { day: 2, activity: 'Wander Westminster Abbey and see Big Ben clock tower', time: '01:30 PM', location: 'Westminster', estimatedCost: 25 }, { day: 2, activity: 'Scenic flight on the London Eye observation wheel', time: '05:00 PM', location: 'London Eye', estimatedCost: 40 }, { day: 3, activity: 'Explore global history at the British Museum (Free admission)', time: '09:30 AM', location: 'British Museum', estimatedCost: 0 }, { day: 3, activity: 'Enjoy traditional Afternoon Tea in Covent Garden marketplace', time: '03:00 PM', location: 'Covent Garden', estimatedCost: 45 }] },
  { id: 'pre-sydney', destination: 'Sydney, Australia', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 3500, travelers: 2, travelStyle: 'Coastal Leisure|AUD', interests: ['Nature', 'Beaches'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Sydney Opera House Architectural Tour', time: '10:00 AM', location: 'Opera House', estimatedCost: 45 }, { day: 1, activity: 'Bondi to Coogee coastal walk and beachside lunch', time: '02:00 PM', location: 'Bondi Beach', estimatedCost: 30 }, { day: 2, activity: 'Take the ferry from Circular Quay to scenic Manly Beach', time: '09:30 AM', location: 'Circular Quay', estimatedCost: 15 }, { day: 2, activity: 'Snorkel in Shelly Beach marine reserve and explore Manly town', time: '01:00 PM', location: 'Shelly Beach', estimatedCost: 20 }, { day: 3, activity: 'Day trip to Blue Mountains National Park (Echo Point & Three Sisters)', time: '08:30 AM', location: 'Blue Mountains', estimatedCost: 65 }, { day: 4, activity: 'Walk across the Sydney Harbour Bridge and explore historic Rocks district', time: '10:00 AM', location: 'The Rocks', estimatedCost: 0 }, { day: 4, activity: 'Dinner at Darling Harbour restaurant overlooking the water', time: '07:30 PM', location: 'Darling Harbour', estimatedCost: 80 }, { day: 5, activity: 'Explore Royal Botanic Gardens and visit Art Gallery of NSW', time: '10:30 AM', location: 'Botanic Gardens', estimatedCost: 0 }, { day: 5, activity: 'Evening sunset drink at Opera Bar overlooking harbour bridge', time: '06:00 PM', location: 'Circular Quay', estimatedCost: 35 }, { day: 6, activity: 'Shop at historic Queen Victoria Building and visit Sydney Tower Eye', time: '11:00 AM', location: 'City Center', estimatedCost: 35 }, { day: 6, activity: 'Farewell seafood platter dinner at Sydney Fish Market', time: '02:00 PM', location: 'Fish Market', estimatedCost: 60 }] },
  { id: 'pre-rome', destination: 'Rome, Italy', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 1600, travelers: 2, travelStyle: 'Cultural|EUR', interests: ['History', 'Art', 'Food'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Wander Colosseum and Roman Forum', time: '09:00 AM', location: 'Colosseum', estimatedCost: 35 }, { day: 1, activity: 'Make a wish at Trevi Fountain & enjoy Gelato', time: '03:00 PM', location: 'Trevi Fountain', estimatedCost: 8 }, { day: 2, activity: 'Vatican Museums tour, Sistine Chapel, and St. Peter\'s Basilica', time: '09:00 AM', location: 'Vatican City', estimatedCost: 45 }, { day: 2, activity: 'Walk around Piazza Navona and Pantheon temple dome', time: '03:30 PM', location: 'Pantheon', estimatedCost: 0 }, { day: 3, activity: 'Explore historic Trastevere district narrow cobbled streets', time: '10:30 AM', location: 'Trastevere', estimatedCost: 0 }, { day: 3, activity: 'Authentic Roman pasta dinner (Carbonara / Cacio e Pepe)', time: '07:30 PM', location: 'Trastevere Bistro', estimatedCost: 40 }, { day: 4, activity: 'Visit Villa Borghese museum gardens and rent a rowing boat', time: '10:00 AM', location: 'Villa Borghese', estimatedCost: 20 }, { day: 4, activity: 'Panoramic sunset view of Rome from Pincio terrace', time: '06:00 PM', location: 'Pincio Hill', estimatedCost: 0 }] },
  { id: 'pre-singapore', destination: 'Singapore', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 3000, travelers: 2, travelStyle: 'Modern Luxury|SGD', interests: ['Nature', 'Shopping'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Explore Supertree Grove & Cloud Forest at Gardens by the Bay', time: '10:00 AM', location: 'Gardens by the Bay', estimatedCost: 30 }, { day: 1, activity: 'Dinner at Marina Bay Sands SkyPark overlooking the bay', time: '07:30 PM', location: 'Marina Bay Sands', estimatedCost: 150 }, { day: 2, activity: 'Take the cable car to Sentosa Island and visit S.E.A. Aquarium', time: '09:30 AM', location: 'Sentosa', estimatedCost: 65 }, { day: 2, activity: 'Hawker centre street food feast at Lau Pa Sat market', time: '07:00 PM', location: 'Lau Pa Sat', estimatedCost: 20 }, { day: 3, activity: 'Walk around historic Chinatown and visit Buddha Tooth Relic Temple', time: '10:00 AM', location: 'Chinatown', estimatedCost: 0 }, { day: 3, activity: 'Shopping at premium Jewel Changi Airport and view HSBC Rain Vortex', time: '03:00 PM', location: 'Changi Airport', estimatedCost: 0 }] },
  { id: 'pre-zurich', destination: 'Zurich, Switzerland', image: 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 2500, travelers: 1, travelStyle: 'Relaxing|CHF', interests: ['Nature', 'History'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Stroll Zurich Altstadt (Old Town) & Fraumünster Church', time: '10:00 AM', location: 'Old Town', estimatedCost: 0 }, { day: 1, activity: 'Scenic boat cruise across pristine Lake Zurich', time: '03:00 PM', location: 'Lake Zurich', estimatedCost: 25 }, { day: 2, activity: 'Train trip up to Uetliberg mountain for panoramic alpine views', time: '09:30 AM', location: 'Uetliberg', estimatedCost: 30 }, { day: 2, activity: 'Fondue dinner experience at a traditional chalet restaurant', time: '07:00 PM', location: 'City Center', estimatedCost: 55 }, { day: 3, activity: 'Day trip to Rhine Falls (Europe\'s largest waterfall)', time: '09:00 AM', location: 'Schaffhausen', estimatedCost: 60 }, { day: 4, activity: 'Lindt Home of Chocolate museum interactive tour & tastings', time: '10:30 AM', location: 'Kilchberg', estimatedCost: 25 }, { day: 4, activity: 'Stroll along Bahnhofstrasse high-end shopping avenue', time: '03:00 PM', location: 'Bahnhofstrasse', estimatedCost: 0 }] },
  { id: 'pre-toronto', destination: 'Toronto, Canada', image: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 2000, travelers: 2, travelStyle: 'Urban Adventure|CAD', interests: ['Shopping', 'Food'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Visit the CN Tower observation deck & Glass Floor', time: '10:00 AM', location: 'CN Tower', estimatedCost: 45 }, { day: 1, activity: 'Taste local pastries at St. Lawrence Historic Market', time: '01:30 PM', location: 'St. Lawrence Market', estimatedCost: 20 }, { day: 2, activity: 'Take the ferry to Toronto Islands for skyline views and bike riding', time: '09:30 AM', location: 'Toronto Islands', estimatedCost: 15 }, { day: 2, activity: 'Dinner and microbrewery beer tasting in Distillery Historic District', time: '06:30 PM', location: 'Distillery District', estimatedCost: 50 }, { day: 3, activity: 'Explore Ripley\'s Aquarium of Canada and walk around Rogers Centre', time: '10:00 AM', location: 'Downtown', estimatedCost: 40 }, { day: 3, activity: 'Visit Royal Ontario Museum world culture galleries', time: '02:00 PM', location: 'Museum Station', estimatedCost: 25 }, { day: 4, activity: 'Day trip to spectacular Niagara Falls including boat tour', time: '08:30 AM', location: 'Niagara', estimatedCost: 90 }] },
  { id: 'pre-beijing', destination: 'Beijing, China', image: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 8000, travelers: 2, travelStyle: 'Cultural|CNY', interests: ['History', 'Architecture'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Walk along the Mutianyu Great Wall of China section', time: '08:00 AM', location: 'Great Wall', estimatedCost: 120 }, { day: 1, activity: 'Explore Forbidden City ancient imperial palaces', time: '02:00 PM', location: 'Forbidden City', estimatedCost: 60 }, { day: 2, activity: 'Visit the Temple of Heaven and watch locals practice Tai Chi', time: '09:00 AM', location: 'Temple of Heaven', estimatedCost: 35 }, { day: 2, activity: 'Rickshaw tour of traditional Hutong alleys and local family courtyard', time: '02:00 PM', location: 'Hutongs', estimatedCost: 45 }, { day: 3, activity: 'Walk around Tiananmen Square and National Museum of China', time: '09:30 AM', location: 'Tiananmen Square', estimatedCost: 0 }, { day: 3, activity: 'Authentic Peking Duck feast dinner at a historic restaurant', time: '07:00 PM', location: 'Quanjude', estimatedCost: 100 }, { day: 4, activity: 'Explore the royal gardens at Summer Palace and Kunming Lake boat ride', time: '09:00 AM', location: 'Summer Palace', estimatedCost: 50 }, { day: 4, activity: 'Visit the Olympic green area, Bird\'s Nest & Water Cube structures', time: '03:30 PM', location: 'Olympic Park', estimatedCost: 0 }, { day: 5, activity: 'Browse contemporary Chinese art galleries in 798 Art Zone', time: '10:00 AM', location: '798 Art District', estimatedCost: 0 }, { day: 5, activity: 'Farewell dinner tasting local hot pot at Sanlitun entertainment area', time: '07:00 PM', location: 'Sanlitun', estimatedCost: 70 }] },
  { id: 'pre-delhi', destination: 'New Delhi, India', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 15000, travelers: 2, travelStyle: 'Cultural|INR', interests: ['History', 'Food', 'Architecture'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Explore historic Red Fort and architectural monuments', time: '09:30 AM', location: 'Red Fort', estimatedCost: 500 }, { day: 1, activity: 'Rickshaw ride in busy Chandni Chowk bazaar and local street food tasting', time: '02:00 PM', location: 'Chandni Chowk', estimatedCost: 800 }, { day: 2, activity: 'Visit Qutub Minar complex and Mehrauli Archaeological Park', time: '10:00 AM', location: 'Qutub Minar', estimatedCost: 600 }, { day: 2, activity: 'Wander around Humayun\'s Tomb and Lodhi Gardens stroll', time: '03:00 PM', location: 'Humayun\'s Tomb', estimatedCost: 500 }, { day: 3, activity: 'Drive past India Gate and Parliament buildings', time: '10:00 AM', location: 'Rajpath', estimatedCost: 0 }, { day: 3, activity: 'Visit beautiful Lotus Temple and shop at Connaught Place markets', time: '02:00 PM', location: 'Lotus Temple', estimatedCost: 1000 }] },
  { id: 'pre-barcelona', destination: 'Barcelona, Spain', image: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 1200, travelers: 2, travelStyle: 'Urban Adventure|EUR', interests: ['Architecture', 'Food', 'Beaches'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Guided tour of Antoni Gaudi\'s masterpieces: La Sagrada Familia', time: '10:00 AM', location: 'Sagrada Familia', estimatedCost: 35 }, { day: 1, activity: 'Stroll along La Rambla and browse local produce at La Boqueria Market', time: '02:35 PM', location: 'La Boqueria', estimatedCost: 15 }, { day: 2, activity: 'Explore Park Guell mosaic terraces and views over Barcelona', time: '09:30 AM', location: 'Park Guell', estimatedCost: 25 }, { day: 2, activity: 'Walk around Gothic Quarter (Barri Gotic) narrow streets and cathedral', time: '03:00 PM', location: 'Gothic Quarter', estimatedCost: 0 }, { day: 3, activity: 'Relax at Barceloneta Beach and enjoy a seafood paella lunch', time: '11:00 AM', location: 'Barceloneta Beach', estimatedCost: 40 }, { day: 3, activity: 'Explore Picasso Museum and shop in trendy El Born district', time: '04:00 PM', location: 'El Born', estimatedCost: 15 }, { day: 4, activity: 'Take the cable car up to Montjuic Castle for panoramic harbor views', time: '10:00 AM', location: 'Montjuic', estimatedCost: 20 }, { day: 4, activity: 'Farewell Spanish tapas and Sangria tasting dinner', time: '07:30 PM', location: 'Tapas Bar', estimatedCost: 50 }] },
  { id: 'pre-amsterdam', destination: 'Amsterdam, Netherlands', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 950, travelers: 2, travelStyle: 'Cultural|EUR', interests: ['Art', 'Architecture', 'History'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Rent a bicycle and ride along historic Canal Ring bridges', time: '09:30 AM', location: 'Canals', estimatedCost: 15 }, { day: 1, activity: 'Explore Rijksmuseum collections of Dutch Golden Age masterpieces', time: '02:00 PM', location: 'Museumplein', estimatedCost: 25 }, { day: 2, activity: 'Visit the historic Anne Frank House museum', time: '10:00 AM', location: 'Jordaan', estimatedCost: 18 }, { day: 2, activity: 'Take a relaxed evening canal cruise boat with audio commentary', time: '06:30 PM', location: 'Damrak', estimatedCost: 20 }, { day: 3, activity: 'Explore Van Gogh Museum galleries dedicated to his life and paintings', time: '10:00 AM', location: 'Museumplein', estimatedCost: 25 }, { day: 3, activity: 'Walk around Vondelpark and visit local cheese boutiques', time: '02:30 PM', location: 'Vondelpark', estimatedCost: 15 }] },
  { id: 'pre-venice', destination: 'Venice, Italy', image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 1100, travelers: 2, travelStyle: 'Romantic|EUR', interests: ['Art', 'History', 'Architecture'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Stroll across Rialto Bridge and explore bustling local markets', time: '10:00 AM', location: 'Rialto Bridge', estimatedCost: 0 }, { day: 1, activity: 'Take a romantic private Gondola ride along the Grand Canal', time: '04:30 PM', location: 'Grand Canal', estimatedCost: 80 }, { day: 2, activity: 'Visit St. Mark\'s Basilica and climb the Campanile bell tower', time: '09:30 AM', location: 'Piazza San Marco', estimatedCost: 25 }, { day: 2, activity: 'Tour the Doge\'s Palace (Palazzo Ducale) and cross Bridge of Sighs', time: '01:30 PM', location: 'San Marco', estimatedCost: 30 }, { day: 3, activity: 'Take a water taxi trip to colorful Burano island (Lace making heritage)', time: '09:30 AM', location: 'Burano Island', estimatedCost: 15 }, { day: 3, activity: 'Local seafood and Cicchetti (Venetian tapas) dinner with Prosecco', time: '07:05 PM', location: 'Cannaregio Bistro', estimatedCost: 45 }] },
  { id: 'pre-vancouver', destination: 'Vancouver, Canada', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 1600, travelers: 2, travelStyle: 'Coastal Leisure|CAD', interests: ['Nature', 'Beaches', 'Food'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Rent a bike and cycle around the Stanley Park Seawall path', time: '09:30 AM', location: 'Stanley Park', estimatedCost: 20 }, { day: 1, activity: 'Aquabus ferry ride to Granville Island Public Market and lunch', time: '01:30 PM', location: 'Granville Island', estimatedCost: 25 }, { day: 2, activity: 'Cross the Capilano Suspension Bridge and treetop adventure walk', time: '10:00 AM', location: 'North Vancouver', estimatedCost: 65 }, { day: 2, activity: 'Stroll around Gastown and watch the historic Steam Clock chime', time: '04:30 PM', location: 'Gastown', estimatedCost: 0 }, { day: 3, activity: 'Ride the Grouse Mountain Skyride for scenic vistas over the city', time: '09:30 AM', location: 'Grouse Mountain', estimatedCost: 75 }, { day: 3, activity: 'Relaxing afternoon at English Bay beach and sunset stroll', time: '04:00 PM', location: 'English Bay', estimatedCost: 0 }, { day: 4, activity: 'Day trip along Sea-to-Sky Highway to Whistler alpine village', time: '08:30 AM', location: 'Whistler', estimatedCost: 80 }, { day: 4, activity: 'Farewell craft beer and local dining at Yaletown bistros', time: '07:30 PM', location: 'Yaletown', estimatedCost: 55 }] },
  { id: 'pre-sanfran', destination: 'San Francisco, USA', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 1800, travelers: 1, travelStyle: 'Urban Adventure|USD', interests: ['Nature', 'Architecture', 'Food'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Cycle across the Golden Gate Bridge to Sausalito', time: '09:30 AM', location: 'Golden Gate', estimatedCost: 35 }, { day: 1, activity: 'Visit Fisherman\'s Wharf and lunch at Pier 39 clam chowder', time: '02:00 PM', location: 'Pier 39', estimatedCost: 20 }, { day: 2, activity: 'Take the ferry to Alcatraz Island historic prison tour', time: '09:00 AM', location: 'Alcatraz Island', estimatedCost: 45 }, { day: 2, activity: 'Wander Lombard Street (crookedest street) and ride Cable Car', time: '02:30 PM', location: 'Lombard Street', estimatedCost: 10 }, { day: 3, activity: 'Explore Golden Gate Park and visit California Academy of Sciences', time: '10:00 AM', location: 'Golden Gate Park', estimatedCost: 40 }, { day: 3, activity: 'Sunset panoramic views from Twin Peaks & dinner in Mission District', time: '06:30 PM', location: 'Twin Peaks', estimatedCost: 30 }] },
  { id: 'pre-la', destination: 'Los Angeles, USA', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 2400, travelers: 2, travelStyle: 'Urban Adventure|USD', interests: ['Shopping', 'Beaches'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Walk along the Hollywood Walk of Fame and see TCL Chinese Theatre', time: '10:00 AM', location: 'Hollywood', estimatedCost: 0 }, { day: 1, activity: 'Hike to the Hollywood Sign viewpoint from Griffith Observatory', time: '03:00 PM', location: 'Griffith Park', estimatedCost: 0 }, { day: 2, activity: 'Spend the day at Santa Monica Pier and ride the solar Ferris wheel', time: '10:00 AM', location: 'Santa Monica', estimatedCost: 30 }, { day: 2, activity: 'Rent a beach cruiser and ride to funky Venice Beach boardwalk', time: '03:00 PM', location: 'Venice Beach', estimatedCost: 15 }, { day: 3, activity: 'Day trip to Universal Studios Hollywood theme park and studio tour', time: '09:00 AM', location: 'Universal City', estimatedCost: 130 }, { day: 4, activity: 'Window shopping along high-end Rodeo Drive and Beverly Hills walk', time: '11:00 AM', location: 'Rodeo Drive', estimatedCost: 0 }, { day: 4, activity: 'Farewell dinner at Sunset Boulevard trendy restaurants', time: '07:30 PM', location: 'West Hollywood', estimatedCost: 75 }] },
  { id: 'pre-melbourne', destination: 'Melbourne, Australia', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 2800, travelers: 2, travelStyle: 'Cultural|AUD', interests: ['Food', 'Art', 'Nature'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Laneway walking tour discovering street art in Hosier Lane', time: '10:00 AM', location: 'Hosier Lane', estimatedCost: 0 }, { day: 1, activity: 'Coffee tasting masterclass in Melbourne\'s famous cafe district', time: '02:00 PM', location: 'Fitzroy Cafe', estimatedCost: 25 }, { day: 2, activity: 'Take the scenic Puffing Billy steam train through Dandenong Ranges', time: '09:00 AM', location: 'Belgrave', estimatedCost: 65 }, { day: 2, activity: 'Dinner at Queen Victoria Night Market food stalls', time: '06:30 PM', location: 'Queen Victoria Market', estimatedCost: 30 }, { day: 3, activity: 'Day trip along Great Ocean Road to view Twelve Apostles stone stacks', time: '08:00 AM', location: 'Great Ocean Road', estimatedCost: 120 }, { day: 4, activity: 'Explore Melbourne Museum & historic Royal Exhibition Building gardens', time: '10:00 AM', location: 'Carlton Gardens', estimatedCost: 15 }, { day: 4, activity: 'Visit the penguins at St Kilda Pier and beachside walk', time: '04:30 PM', location: 'St Kilda Beach', estimatedCost: 0 }, { day: 5, activity: 'Shop at Melbourne Central and enjoy skydeck views from Eureka Tower', time: '11:00 AM', location: 'Southbank', estimatedCost: 35 }, { day: 5, activity: 'Farewell dinner cruise along the Yarra River', time: '07:00 PM', location: 'Yarra River', estimatedCost: 90 }] },
  { id: 'pre-kyoto', destination: 'Kyoto, Japan', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 90000, travelers: 2, travelStyle: 'Cultural|JPY', interests: ['History', 'Nature', 'Food'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Early morning walk through thousands of red Torii gates at Fushimi Inari', time: '07:30 AM', location: 'Fushimi Inari Shrine', estimatedCost: 0 }, { day: 1, activity: 'Explore Kiyomizu-dera temple and traditional Higashiyama streets', time: '01:30 PM', location: 'Higashiyama', estimatedCost: 400 }, { day: 2, activity: 'Visit the golden Kinkaku-ji Zen temple (Golden Pavilion)', time: '09:30 AM', location: 'Kinkaku-ji', estimatedCost: 500 }, { day: 2, activity: 'Wander through the towering green stalks of Arashiyama Bamboo Grove', time: '02:00 PM', location: 'Arashiyama', estimatedCost: 0 }, { day: 3, activity: 'Participate in a traditional Japanese Tea Ceremony in Gion district', time: '10:00 AM', location: 'Gion', estimatedCost: 3000 }, { day: 3, activity: 'Stroll along the Philosopher\'s Path alongside the canal stream', time: '03:00 PM', location: 'Philosopher\'s Path', estimatedCost: 0 }, { day: 3, activity: 'Multi-course Kaiseki dinner highlighting Kyoto seasonal food art', time: '07:30 PM', location: 'Gion Restaurant', estimatedCost: 8000 }, { day: 4, activity: 'Nijo Castle tour (famous nightingale squeaker floorboards)', time: '10:00 AM', location: 'Nijo Castle', estimatedCost: 800 }, { day: 4, activity: 'Browse Nishiki Market street food stalls and try local skewers', time: '01:30 PM', location: 'Nishiki Market', estimatedCost: 1500 }] },
  { id: 'pre-geneva', destination: 'Geneva, Switzerland', image: 'https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 2000, travelers: 1, travelStyle: 'Relaxing|CHF', interests: ['History', 'Nature'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'See the massive Jet d\'Eau fountain shooting water over lake Geneva', time: '10:00 AM', location: 'Lake Geneva', estimatedCost: 0 }, { day: 1, activity: 'Stroll around Geneva Old Town (Vieille Ville) and St. Pierre Cathedral', time: '02:30 PM', location: 'Old Town', estimatedCost: 0 }, { day: 2, activity: 'Guided tour of the United Nations Palace of Nations headquarters', time: '10:00 AM', location: 'UN Headquarters', estimatedCost: 20 }, { day: 2, activity: 'Visit the Globe of Science and Innovation at CERN particle physics lab', time: '02:30 PM', location: 'CERN', estimatedCost: 0 }, { day: 3, activity: 'Relax in Parc des Bastions and play on the giant floor chessboards', time: '10:30 AM', location: 'Parc des Bastions', estimatedCost: 0 }, { day: 3, activity: 'Farewell Swiss cheese fondue dinner at a local lakeside tavern', time: '07:00 PM', location: 'Lakeside Bistro', estimatedCost: 45 }] },
  { id: 'pre-ladakh-kashmir', destination: 'Leh-Ladakh & Kashmir, India', image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 45000, travelers: 2, travelStyle: 'Adventure & Scenic|INR', interests: ['Nature', 'Adventure', 'History'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Arrive in Leh, acclimatize to high altitude, and visit Leh Palace', time: '04:00 PM', location: 'Leh Palace', estimatedCost: 500 }, { day: 2, activity: 'Drive to Nubra Valley via spectacular Khardung La Pass', time: '09:00 AM', location: 'Khardung La', estimatedCost: 1500 }, { day: 3, activity: 'Double-humped Bactrian camel safari at Hunder Sand Dunes', time: '08:30 AM', location: 'Hunder Dunes', estimatedCost: 800 }, { day: 4, activity: 'Visit the breathtaking deep blue Pangong Tso Lake', time: '08:00 AM', location: 'Pangong Lake', estimatedCost: 2000 }, { day: 5, activity: 'Travel to Srinagar and explore Dal Lake on a sunset Shikara ride', time: '04:30 PM', location: 'Dal Lake Srinagar', estimatedCost: 1200 }, { day: 6, activity: 'Walk through Shalimar and Nishat Mughal Gardens in Srinagar', time: '10:00 AM', location: 'Mughal Gardens', estimatedCost: 400 }] },
  { id: 'pre-manali', destination: 'Manali, Himachal Pradesh, India', image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 20000, travelers: 2, travelStyle: 'Hill Station Escapade|INR', interests: ['Nature', 'Adventure'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Walk around Mall Road and visit the historical Hadimba Temple', time: '10:00 AM', location: 'Hadimba Temple', estimatedCost: 200 }, { day: 2, activity: 'Day trip to Solang Valley for paragliding and snow activities', time: '09:00 AM', location: 'Solang Valley', estimatedCost: 2500 }, { day: 3, activity: 'Drive through Atal Tunnel to explore Sissu village waterfall in Lahaul', time: '08:30 AM', location: 'Sissu Waterfall', estimatedCost: 1500 }, { day: 4, activity: 'Trek to Jogini Waterfalls and relax at Vashisht hot springs', time: '09:30 AM', location: 'Vashisht', estimatedCost: 100 }] },
  { id: 'pre-lahaulspiti', destination: 'Lahaul & Spiti, Himachal Pradesh, India', image: 'https://images.unsplash.com/photo-1618083707368-b3823daa2726?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 35000, travelers: 2, travelStyle: 'Rugged Mountain Safari|INR', interests: ['Nature', 'Adventure', 'Culture'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Scenic drive from Manali to Kaza via the high Kunzum Pass', time: '07:00 AM', location: 'Kunzum Pass', estimatedCost: 2000 }, { day: 2, activity: 'Explore Key Monastery, the iconic cliffside Buddhist temple, and Kibber village', time: '09:30 AM', location: 'Key Monastery', estimatedCost: 500 }, { day: 3, activity: 'Send a postcard from Hikkim, the world\'s highest post office, and see Langza fossils', time: '10:00 AM', location: 'Hikkim Post Office', estimatedCost: 300 }, { day: 4, activity: 'Visit the scenic Pin Valley National Park and hike near Mud village', time: '09:00 AM', location: 'Mud Village', estimatedCost: 1000 }, { day: 5, activity: 'Camp next to the mesmerizing crescent-shaped Chandra Taal Lake', time: '03:00 PM', location: 'Chandra Taal', estimatedCost: 2500 }] },
  { id: 'pre-ayodhya', destination: 'Ayodhya, Uttar Pradesh, India', image: 'https://akhilbharat.in/wp-content/uploads/2025/10/Gemini_Generated_Image_wzfldmwzfldmwzfl-Edited-1.png', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 12000, travelers: 2, travelStyle: 'Spiritual & Cultural Heritage|INR', interests: ['History', 'Culture'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Offer prayers at the magnificent Shri Ram Janmabhoomi Mandir', time: '09:00 AM', location: 'Ram Mandir', estimatedCost: 0 }, { day: 1, activity: 'Experience the divine evening Saryu River Aarti at Naya Ghat', time: '06:00 PM', location: 'Saryu Ghat', estimatedCost: 100 }, { day: 2, activity: 'Visit the hilltop Hanuman Garhi temple and beautiful Kanak Bhawan', time: '08:30 AM', location: 'Hanuman Garhi', estimatedCost: 50 }, { day: 2, activity: 'Sunset boat ride on the holy Saryu River with local legends storytelling', time: '04:00 PM', location: 'Saryu River', estimatedCost: 300 }, { day: 3, activity: 'Explore the historic tombs of Gulab Bari and Bahu Begum in Faizabad', time: '10:00 AM', location: 'Gulab Bari', estimatedCost: 150 }] },
  { id: 'pre-jodhpur-jaisalmer', destination: 'Jodhpur & Jaisalmer, Rajasthan, India', image: 'https://images.unsplash.com/photo-1602643163983-ed0babc39797?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 28000, travelers: 2, travelStyle: 'Royal Desert Odyssey|INR', interests: ['History', 'Culture', 'Food'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Explore the massive Mehrangarh Fort and royal cenotaph Jaswant Thada', time: '09:30 AM', location: 'Mehrangarh Fort', estimatedCost: 800 }, { day: 1, activity: 'Wander the blue-painted streets of Jodhpur Old City and shop at Sardar Market', time: '04:00 PM', location: 'Clock Tower', estimatedCost: 200 }, { day: 2, activity: 'Drive to Jaisalmer and check into a luxury desert camp in Thar Desert', time: '08:00 AM', location: 'Thar Desert', estimatedCost: 3500 }, { day: 2, activity: 'Camel safari, dunes sunset photography, and Rajasthani cultural folk dance show', time: '04:30 PM', location: 'Sam Sand Dunes', estimatedCost: 1500 }, { day: 3, activity: 'Tour the living Jaisalmer Fort (Sonar Qila) and admire Patwon Ki Haveli intricate carvings', time: '09:30 AM', location: 'Jaisalmer Fort', estimatedCost: 500 }, { day: 4, activity: 'Rowboat ride at scenic Gadisar Lake and exploring the mysterious abandoned Kuldhara village', time: '10:00 AM', location: 'Gadisar Lake', estimatedCost: 400 }] },
];

const getWeatherForDestination = (destination, dateStr) => {
  const month = new Date(dateStr).getMonth();
  const name = (destination || '').toLowerCase();

  let temp = 22;
  let condition = 'Sunny';
  let desc = 'Clear skies and pleasant breeze';

  if (name.includes('tokyo') || name.includes('japan')) {
    if (month >= 11 || month <= 1) { temp = 8; condition = 'Snowy'; desc = 'Chilly with light winter snow'; }
    else if (month >= 5 && month <= 8) { temp = 28; condition = 'Rainy'; desc = 'Warm with summer showers'; }
    else { temp = 18; condition = 'Sunny'; desc = 'Mild and clear autumn skies'; }
  } else if (name.includes('paris') || name.includes('france') || name.includes('london') || name.includes('uk') || name.includes('zurich') || name.includes('swiss') || name.includes('amsterdam') || name.includes('geneva') || name.includes('barcelona') || name.includes('venice')) {
    if (month >= 10 || month <= 2) { temp = 6; condition = 'Cloudy'; desc = 'Overcast and fresh winter air'; }
    else if (month >= 6 && month <= 8) { temp = 24; condition = 'Sunny'; desc = 'Warm and bright summer days'; }
    else { temp = 14; condition = 'Rainy'; desc = 'Cool with gentle passing showers'; }
  } else if (name.includes('leh') || name.includes('ladakh') || name.includes('kashmir') || name.includes('manali') || name.includes('spiti') || name.includes('lahaul')) {
    if (month >= 11 || month <= 2) { temp = -5; condition = 'Snowy'; desc = 'Freezing winter weather with heavy snow'; }
    else if (month >= 5 && month <= 8) { temp = 20; condition = 'Sunny'; desc = 'Pleasant summer days with cool breeze'; }
    else { temp = 10; condition = 'Cloudy'; desc = 'Cold climate with crisp mountain air'; }
  } else if (name.includes('delhi') || name.includes('india') || name.includes('ayodhya') || name.includes('jodhpur') || name.includes('jaisalmer')) {
    if (month >= 4 && month <= 8) { temp = 38; condition = 'Sunny'; desc = 'Hot and sunny summer climate'; }
    else if (month >= 11 || month <= 1) { temp = 15; condition = 'Cloudy'; desc = 'Cool and misty morning fog'; }
    else { temp = 26; condition = 'Sunny'; desc = 'Clear, dry and warm days'; }
  } else if (name.includes('sydney') || name.includes('australia') || name.includes('melbourne')) {
    if (month >= 5 && month <= 8) { temp = 14; condition = 'Cloudy'; desc = 'Cool coastal winter breeze'; }
    else if (month >= 11 || month <= 1) { temp = 26; condition = 'Sunny'; desc = 'Perfect beach weather'; }
    else { temp = 20; condition = 'Sunny'; desc = 'Mild and sunny spring/autumn'; }
  } else {
    if (month >= 11 || month <= 1) { temp = 12; condition = 'Cloudy'; desc = 'Cool overcast seasonal day'; }
    else if (month >= 5 && month <= 8) { temp = 30; condition = 'Sunny'; desc = 'Warm and sunny day'; }
    else { temp = 21; condition = 'Windy'; desc = 'Mild temp with refreshing wind'; }
  }

  return { temp, condition, desc };
};

const getActivityImageFallback = (location, time) => {
  const loc = (location || '').toLowerCase();
  if (loc.includes('lake') || loc.includes('sukhna') || loc.includes('beach') || loc.includes('water')) {
    return 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=500&auto=format&fit=crop&q=60';
  }
  if (loc.includes('garden') || loc.includes('park') || loc.includes('rose') || loc.includes('lawn') || loc.includes('forest')) {
    return 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&auto=format&fit=crop&q=60';
  }
  if (loc.includes('mall') || loc.includes('market') || loc.includes('shop') || loc.includes('bazaar') || loc.includes('elante')) {
    return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=60';
  }
  if (loc.includes('museum') || loc.includes('palace') || loc.includes('fort') || loc.includes('temple') || loc.includes('capitol') || loc.includes('monument') || loc.includes('rock')) {
    return 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=60';
  }
  if (time === 'Morning') {
    return 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=500&auto=format&fit=crop&q=60';
  }
  if (time === 'Afternoon') {
    return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500&auto=format&fit=crop&q=60';
  }
  return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60';
};

const ActivityCard = ({ item, tripCurrency }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setImageSrc('');
    setLoading(true);

    const fetchWikiImage = async () => {
      try {
        const searchQuery = encodeURIComponent(item.location);
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
          const pageTitle = searchData.query.search[0].title;
          const imageQueryUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
          const imageRes = await fetch(imageQueryUrl);
          const imageData = await imageRes.json();
          const pages = imageData.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pages[pageId].thumbnail && pages[pageId].thumbnail.source) {
            if (active) {
              setImageSrc(pages[pageId].thumbnail.source);
              setLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch Wikipedia image", err);
      }

      if (active) {
        setImageSrc(getActivityImageFallback(item.location, item.time));
        setLoading(false);
      }
    };

    fetchWikiImage();
    return () => {
      active = false;
    };
  }, [item.location, item.time]);

  return (
    <div className="mb-6 border-b border-slate-100 pb-6 last:border-0 last:pb-0">
      <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold mb-3 uppercase tracking-wider">
        <Clock className="h-4 w-4" />
        <span>{item.time}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* Left Card: Image with + button */}
        <div className="relative w-36 h-28 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-slate-100 group/img bg-slate-100">
          {loading || !imageSrc ? (
            <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
              <div className="h-4 w-4 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
            </div>
          ) : (
            <img
              src={imageSrc}
              alt={item.location}
              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
            />
          )}
          {/* Google Search redirect button over image */}
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(item.location || item.activity)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-700 hover:bg-white hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer border border-slate-100"
          >
            <Search className="h-3.5 w-3.5 text-slate-500" />
          </a>
        </div>

        <div className="flex-1 space-y-2">
          <h4 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
            {item.location}
          </h4>
          <p className="text-slate-600 text-sm leading-relaxed font-normal">
            {item.activity}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-slate-550 text-xs font-semibold pt-1">
            {item.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{item.location}</span>
              </div>
            )}
            {item.estimatedCost !== undefined && (
              <div className="flex items-center space-x-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                <span>Est. Cost: {tripCurrency.symbol}{Number(item.estimatedCost).toLocaleString(tripCurrency.locale)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DashboardStub() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [activeDayTab, setActiveDayTab] = useState(1);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currencyCode, setCurrencyCode] = useState(() => localStorage.getItem('xplorism_currency') || 'INR');
  const [wizardInitialData, setWizardInitialData] = useState(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [mapCoords, setMapCoords] = useState(null);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyPlacesLoading, setNearbyPlacesLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingTrip, setIsSavingTrip] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const carouselRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  // Budget Tracking State
  const [budgetData, setBudgetData] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: 'Food', itemName: '', plannedAmount: '', actualAmount: '', date: '', notes: '' });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Favorites State
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  const handleCarouselScroll = (e) => {
    const el = e.target;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 5);
    const maxScroll = el.scrollWidth - el.clientWidth;
    setShowRightFade(el.scrollLeft < maxScroll - 5);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Programmatic smooth auto-scrolling with loop capability
  useEffect(() => {
    let scrollInterval;
    const el = carouselRef.current;
    if (!el) return;

    let isInteracting = false;

    const startAutoScroll = () => {
      scrollInterval = setInterval(() => {
        if (isInteracting) return;
        el.scrollLeft += 1;
        const halfWidth = (el.scrollWidth - el.clientWidth) / 2;
        if (el.scrollLeft >= halfWidth - 2) {
          el.scrollLeft = 0;
        }
      }, 30);
    };

    const handleInteractionStart = () => {
      isInteracting = true;
    };

    const handleInteractionEnd = () => {
      isInteracting = false;
    };

    el.addEventListener('mouseenter', handleInteractionStart);
    el.addEventListener('mouseleave', handleInteractionEnd);
    el.addEventListener('touchstart', handleInteractionStart);
    el.addEventListener('touchend', handleInteractionEnd);

    startAutoScroll();

    return () => {
      clearInterval(scrollInterval);
      if (el) {
        el.removeEventListener('mouseenter', handleInteractionStart);
        el.removeEventListener('mouseleave', handleInteractionEnd);
        el.removeEventListener('touchstart', handleInteractionStart);
        el.removeEventListener('touchend', handleInteractionEnd);
      }
    };
  }, []);

  // Favorites functions
  const fetchFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const data = await api.get('/favorites');
      setFavorites(data);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleToggleFavorite = async (item) => {
    try {
      const result = await api.post('/favorites', {
        name: item.name || item.activity,
        type: item.type || 'attraction',
        description: item.description || item.activity || '',
        location: item.location || '',
        distance: item.distance || '',
        category: item.category || '',
        imageUrl: item.imageUrl || '',
        destination: selectedTrip?.destination || '',
        tripId: selectedTrip?.id || null,
      });
      if (result.favorited) {
        showToast('Added to favorites!', 'success');
      } else {
        showToast('Removed from favorites', 'success');
      }
      fetchFavorites();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      showToast('Failed to update favorite.', 'error');
    }
  };

  const handleRemoveFavorite = async (favoriteId) => {
    if (!window.confirm('Remove this favorite?')) return;
    try {
      await api.delete(`/favorites/${favoriteId}`);
      showToast('Removed from favorites.', 'success');
      fetchFavorites();
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      showToast('Failed to remove favorite.', 'error');
    }
  };

  // Budget tracking functions
  const fetchBudget = async (tripId) => {
    if (!tripId) return;
    setBudgetLoading(true);
    setShowExpenseForm(false);
    try {
      const data = await api.get(`/trips/${tripId}/budget`);
      setBudgetData(data);
    } catch (err) {
      console.error('Failed to fetch budget:', err);
      setBudgetData(null);
    } finally {
      setBudgetLoading(false);
    }
  };

  const handleAddExpense = async (tripId) => {
    if (!expenseForm.actualAmount || !expenseForm.date) {
      showToast('Please fill in amount and date.', 'error');
      return;
    }
    try {
      await api.post(`/trips/${tripId}/expenses`, {
        category: expenseForm.category,
        itemName: expenseForm.itemName || 'Unnamed Expense',
        plannedAmount: parseFloat(expenseForm.plannedAmount || 0),
        actualAmount: parseFloat(expenseForm.actualAmount),
        date: expenseForm.date,
        notes: expenseForm.notes || '',
        currency: currencyCode,
      });
      showToast('Expense added successfully!', 'success');
      setExpenseForm({ category: 'Food', itemName: '', plannedAmount: '', actualAmount: '', date: '', notes: '' });
      setShowExpenseForm(false);
      fetchBudget(tripId);
    } catch (err) {
      console.error('Failed to add expense:', err);
      showToast('Failed to add expense.', 'error');
    }
  };

  const handleUpdateExpense = async (tripId, expenseId) => {
    if (!editingExpense) return;
    try {
      await api.put(`/trips/${tripId}/expenses/${expenseId}`, {
        category: editingExpense.category,
        itemName: editingExpense.itemName,
        plannedAmount: parseFloat(editingExpense.plannedAmount || 0),
        actualAmount: parseFloat(editingExpense.actualAmount),
        date: editingExpense.date,
        notes: editingExpense.notes || '',
      });
      showToast('Expense updated successfully!', 'success');
      setEditingExpense(null);
      setShowExpenseForm(false);
      fetchBudget(tripId);
    } catch (err) {
      console.error('Failed to update expense:', err);
      showToast('Failed to update expense.', 'error');
    }
  };

  const handleDeleteExpense = async (tripId, expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
      showToast('Expense deleted.', 'success');
      fetchBudget(tripId);
    } catch (err) {
      console.error('Failed to delete expense:', err);
      showToast('Failed to delete expense.', 'error');
    }
  };

  const startEditExpense = (expense) => {
    setEditingExpense({
      id: expense.id,
      category: expense.category || 'Food',
      itemName: expense.itemName || '',
      plannedAmount: expense.plannedAmount?.toString() || '',
      actualAmount: expense.actualAmount?.toString() || '',
      date: expense.date || '',
      notes: expense.notes || '',
    });
    setShowExpenseForm(true);
  };

  // Fetch budget when selected trip changes and budget tab is active
  useEffect(() => {
    if (selectedTrip && activeDayTab === 'budget') {
      fetchBudget(selectedTrip.id);
    }
  }, [selectedTrip, activeDayTab]);

  const activeCurrency = CURRENCIES[currencyCode] || CURRENCIES.INR;

  const handleCurrencyChange = (e) => {
    const val = e.target.value;
    setCurrencyCode(val);
    localStorage.setItem('xplorism_currency', val);
  };

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const data = await api.get('/trips');
      setTrips(data);
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  // Inject Leaflet dynamically
  useEffect(() => {
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setIsLeafletLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      setIsLeafletLoaded(true);
    }
  }, []);

  // Fetch coordinates and nearby places when a trip is selected
  useEffect(() => {
    if (!selectedTrip) {
      setMapCoords(null);
      setNearbyPlaces([]);
      return;
    }
    const geocodeAndFetchNearby = async () => {
      try {
        const query = selectedTrip.destination;
        const data = await api.get(`/geocode?q=${encodeURIComponent(query)}`);
        if (data && data.length > 0) {
          setMapCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          setMapCoords([20.5937, 78.9629]);
        }
      } catch (err) {
        console.error(err);
        setMapCoords([20.5937, 78.9629]);
      }

      setNearbyPlacesLoading(true);
      try {
        const data = await api.get(`/nearby?destination=${encodeURIComponent(selectedTrip.destination)}`);
        setNearbyPlaces(data || []);
      } catch (err) {
        console.error('Failed to fetch nearby places:', err);
        setNearbyPlaces([]);
      } finally {
        setNearbyPlacesLoading(false);
      }
    };
    geocodeAndFetchNearby();
  }, [selectedTrip]);

  // Handle map rendering and marker plotting
  useEffect(() => {
    if (!mapCoords || !window.L || !selectedTrip || !isLeafletLoaded) return;

    if (window.mapInstance) {
      window.mapInstance.remove();
    }

    const container = document.getElementById('map-container');
    if (!container) return;

    const zoom = activeDayTab === 'nearby' ? 9 : 12;
    const map = window.L.map('map-container', { zoomControl: false }).setView(mapCoords, zoom);
    window.mapInstance = map;

    window.L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '© Google Maps'
    }).addTo(map);

    window.L.control.zoom({ position: 'bottomright' }).addTo(map);

    const defaultIcon = window.L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });

    let isCancelled = false;

    const plotMarkers = async () => {
      if (activeDayTab === 'nearby') {
        for (const place of nearbyPlaces) {
          if (isCancelled) break;
          try {
            const query = `${place.name}, ${selectedTrip.destination}`;
            const data = await api.get(`/geocode?q=${encodeURIComponent(query)}`);
            if (isCancelled) break;

            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);

              const marker = window.L.marker([lat, lon], { icon: defaultIcon })
                .addTo(map)
                .bindPopup(`<b>${place.name}</b><br/><i>${place.distance} - ${place.type}</i><br/>${place.description}`);

              marker.on('mouseover', function () {
                this.openPopup();
              });
              marker.on('mouseout', function () {
                this.closePopup();
              });
            }
          } catch (err) {
            console.error('Nearby marker geocode error:', err);
          }

          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } else {
        const activeDayActivities = getDayItineraries(selectedTrip);
        for (const activity of activeDayActivities) {
          if (isCancelled) break;
          if (!activity.location) continue;

          try {
            const query = `${activity.location}, ${selectedTrip.destination}`;
            const data = await api.get(`/geocode?q=${encodeURIComponent(query)}`);
            if (isCancelled) break;

            let lat, lon;
            let isValidCoords = false;

            if (data && data.length > 0) {
              lat = parseFloat(data[0].lat);
              lon = parseFloat(data[0].lon);
              const latDiff = Math.abs(lat - mapCoords[0]);
              const lonDiff = Math.abs(lon - mapCoords[1]);
              if (latDiff < 0.5 && lonDiff < 0.5) {
                isValidCoords = true;
              }
            }

            if (!isValidCoords) {
              const jitterLat = (Math.random() - 0.5) * 0.015;
              const jitterLon = (Math.random() - 0.5) * 0.015;
              lat = mapCoords[0] + jitterLat;
              lon = mapCoords[1] + jitterLon;
            }

            const marker = window.L.marker([lat, lon], { icon: defaultIcon })
              .addTo(map)
              .bindPopup(`<b>${activity.time}</b><br/>${activity.activity}<br/><i>${activity.location}</i>`);

            marker.on('mouseover', function () {
              this.openPopup();
            });
            marker.on('mouseout', function () {
              this.closePopup();
            });
          } catch (err) {
            console.error('Marker geocode error:', err);
          }

          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    };

    plotMarkers();

    return () => {
      isCancelled = true;
      if (window.mapInstance) {
        window.mapInstance.remove();
        window.mapInstance = null;
      }
    };
  }, [mapCoords, selectedTrip, activeDayTab, isLeafletLoaded]);

  useEffect(() => {
    fetchTrips();
    fetchFavorites();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteTrip = (trip, e) => {
    e.stopPropagation();
    setTripToDelete(trip);
  };

  const formatDate = (dateStr) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  const exportTripToPDF = async (trip) => {
    try {
      const parts = (trip.travelStyle || '').split('|');
      const style = parts[0] || 'Adventure';
      const tripCurrencyCode = parts[1] || 'INR';
      const tripCurrency = CURRENCIES[tripCurrencyCode] || CURRENCIES.USD;
      const daysCount = getTripDaysCount(trip.startDate, trip.endDate);

      // Score helper for sorting
      const getScore = (timeStr) => {
        if (!timeStr) return 999;
        const val = timeStr.toLowerCase().trim();
        if (val.startsWith('morning')) return 1;
        if (val.startsWith('afternoon')) return 2;
        if (val.startsWith('evening') || val.startsWith('night')) return 3;

        const match = val.match(/(\d+):(\d+)\s*(am|pm)/);
        if (match) {
          let hrs = parseInt(match[1]);
          const mins = parseInt(match[2]);
          const isPm = match[3] === 'pm';
          if (isPm && hrs < 12) hrs += 12;
          if (!isPm && hrs === 12) hrs = 0;
          return hrs * 60 + mins + 10;
        }
        return 999;
      };

      // Fetch dynamic Wikipedia cover image for the destination city
      let heroImage = '';
      try {
        const destCity = (trip.destination || '').split(',')[0].trim();
        const searchQuery = encodeURIComponent(destCity);
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
          const pageTitle = searchData.query.search[0].title;
          const imageQueryUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=1000&origin=*`;
          const imageRes = await fetch(imageQueryUrl);
          const imageData = await imageRes.json();
          const pages = imageData.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pages[pageId].thumbnail && pages[pageId].thumbnail.source) {
            heroImage = pages[pageId].thumbnail.source;
          }
        }
      } catch (err) {
        console.error("Failed to fetch Wikipedia cover image", err);
      }

      if (!heroImage) {
        heroImage = trip.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';
      }

      // Group activities by day
      const daysMap = {};
      if (trip.itineraries) {
        trip.itineraries.forEach(item => {
          if (!daysMap[item.day]) {
            daysMap[item.day] = [];
          }
          daysMap[item.day].push(item);
        });
      }

      // Build day sections HTML
      let daysHtml = '';
      const sortedDays = Object.keys(daysMap).map(Number).sort((a, b) => a - b);

      sortedDays.forEach((dayNum, index) => {
        const dayActivities = daysMap[dayNum] || [];
        const activities = dayActivities.sort((a, b) => getScore(a.time) - getScore(b.time));

        daysHtml += `
          <div class="day-section">
            <h3 class="day-title">
              <svg class="day-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Day ${dayNum} Schedule
            </h3>
            <div class="timeline">
              ${activities.map(act => `
                <div class="timeline-item">
                  <div class="time-badge">${act.time || 'All Day'}</div>
                  <div class="activity-card">
                    <p class="activity-desc">${act.activity}</p>
                    <div class="activity-meta">
                      ${act.location ? `
                        <span class="meta-item">
                          <svg class="icon text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                          ${act.location}
                        </span>
                      ` : ''}
                      ${act.estimatedCost !== undefined ? `
                        <span class="meta-item cost-tag">
                          Est. Cost: ${tripCurrency.symbol}${Number(act.estimatedCost).toLocaleString(tripCurrency.locale)}
                        </span>
                      ` : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      });

      const interestsHtml = (trip.interests && trip.interests.length > 0)
        ? trip.interests.map(i => `<span class="interest-badge">${i}</span>`).join('')
        : '<span class="no-interests">None Selected</span>';

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Itinerary - ${trip.destination}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; background-color: #ffffff; color: #1e293b; line-height: 1.5; padding: 40px; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 24px; }
          .branding { display: flex; align-items: center; gap: 10px; }
          .brand-logo { width: 32px; height: 32px; background-color: #f87171; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 16px; }
          .brand-name { font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
          .doc-type { font-size: 11px; font-weight: 700; color: #ef4444; text-transform: uppercase; letter-spacing: 1px; }
          
          .hero-banner { 
            position: relative;
            width: 100%;
            height: 280px;
            border-radius: 24px;
            background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.8)), url('${heroImage}');
            background-size: cover;
            background-position: center;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 35px;
            margin-bottom: 30px;
            color: white;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .hero-title { font-family: 'Playfair Display', serif; font-size: 38px; font-weight: 800; color: #ffffff; margin-bottom: 6px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
          .hero-subtitle { font-size: 14px; font-weight: 500; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
          
          .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
          .metric-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #ef4444; border-radius: 16px; padding: 16px; text-align: left; }
          .metric-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .metric-value { font-size: 15px; font-weight: 750; color: #0f172a; }
          
          .interests-section { background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 20px; padding: 18px 24px; margin-bottom: 35px; }
          .interests-title { font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .interests-list { display: flex; flex-wrap: wrap; gap: 8px; }
          .interest-badge { background-color: #ffffff; border: 1px solid #fde68a; border-radius: 9999px; padding: 4px 12px; font-size: 11px; font-weight: 600; color: #78350f; }
          
          .day-section { margin-bottom: 40px; }
          .day-title { font-size: 22px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #ef4444; padding-bottom: 8px; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
          .day-title-icon { width: 20px; height: 20px; color: #ef4444; }
          .timeline { position: relative; padding-left: 24px; }
          .timeline::before { content: ''; position: absolute; left: 5px; top: 12px; bottom: 12px; width: 2px; background-color: #f1f5f9; }
          .timeline-item { position: relative; margin-bottom: 28px; }
          .timeline-item::before { content: ''; position: absolute; left: -23px; top: 6px; width: 10px; height: 10px; border-radius: 50%; background-color: #ef4444; border: 2px solid #ffffff; box-shadow: 0 0 0 2px #fee2e2; }
          .time-badge { font-size: 12px; font-weight: 750; color: #ef4444; margin-bottom: 6px; }
          
          .activity-card { background: #ffffff; border: 1px solid #e2e8f0; border-left: 3px solid #ef4444; border-radius: 14px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.01); }
          .activity-desc { font-size: 14.5px; color: #1e293b; font-weight: 500; margin-bottom: 8px; }
          .activity-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
          .meta-item { font-size: 11px; color: #475569; display: flex; align-items: center; gap: 4px; font-weight: 600; }
          .cost-tag { background-color: #f1f5f9; padding: 2px 8px; border-radius: 6px; color: #334155; }
          .icon { width: 12px; height: 12px; }
          
          @media print {
            body { padding: 20px; }
            .timeline-item { page-break-inside: avoid; }
            .hero-banner { 
              background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.8)), url('${heroImage}') !important;
              print-color-adjust: exact !important; 
              -webkit-print-color-adjust: exact !important; 
            }
            .metric-card { background-color: #f8fafc !important; border-left: 4px solid #ef4444 !important; }
            .interests-section { background-color: #fffbeb !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="branding"><div class="brand-logo">X</div><div class="brand-name">Xplorism</div></div>
          <div class="doc-type">Personalized Travel Itinerary</div>
        </div>

        <div class="hero-banner">
          <div class="hero-content">
            <h1 class="hero-title">${trip.destination}</h1>
            <p class="hero-subtitle">${formatDate(trip.startDate)} to ${formatDate(trip.endDate)} • Planned with Xplorism AI</p>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card"><div class="metric-label">Duration</div><div class="metric-value">${daysCount} Days</div></div>
          <div class="metric-card"><div class="metric-label">Travelers</div><div class="metric-value">${trip.travelers} ${trip.travelers === 1 ? 'Person' : 'People'}</div></div>
          <div class="metric-card"><div class="metric-label">Style</div><div class="metric-value">${style}</div></div>
          <div class="metric-card"><div class="metric-label">Budget</div><div class="metric-value">${tripCurrency.symbol}${Number(trip.budget).toLocaleString(tripCurrency.locale)}</div></div>
        </div>

        <div class="interests-section">
          <div class="interests-title">Selected Interests</div>
          <div class="interests-list">${interestsHtml}</div>
        </div>

        ${daysHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getTripDaysCount = (start, end) => {
    const diff = Math.abs(new Date(end) - new Date(start));
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const getDayItineraries = (trip) => {
    if (!trip || !trip.itineraries) return [];
    const filtered = trip.itineraries.filter(item => item.day === activeDayTab);

    return filtered.sort((a, b) => {
      const getScore = (timeStr) => {
        if (!timeStr) return 999;
        const val = timeStr.toLowerCase().trim();
        if (val.startsWith('morning')) return 1;
        if (val.startsWith('afternoon')) return 2;
        if (val.startsWith('evening') || val.startsWith('night')) return 3;

        const match = val.match(/(\d+):(\d+)\s*(am|pm)/);
        if (match) {
          let hrs = parseInt(match[1]);
          const mins = parseInt(match[2]);
          const isPm = match[3] === 'pm';
          if (isPm && hrs < 12) hrs += 12;
          if (!isPm && hrs === 12) hrs = 0;
          return hrs * 60 + mins + 10;
        }
        return 999;
      };
      return getScore(a.time) - getScore(b.time);
    });
  };

  const getDaysArray = (trip) => {
    if (!trip || !trip.itineraries) return [];
    const days = [...new Set(trip.itineraries.map(item => item.day))];
    return days.sort((a, b) => a - b);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <style>{`
        .marquee-wrapper {
          overflow-x: auto;
          width: 100%;
          display: flex;
          position: relative;
          padding-bottom: 8px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .marquee-wrapper::-webkit-scrollbar {
          display: none;
        }
        .marquee-track {
          display: flex;
          gap: 24px;
        }
      `}</style>

      <Navbar activeTab="trips" />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">My Trips Dashboard</h1>
            <p className="text-slate-500 text-sm">Create and manage your customized itineraries.</p>
          </div>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all duration-205 shadow-sm flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Trip</span>
          </button>
        </div>

        {/* Pre-planned Trips Section */}
        <div className="mb-12">
          <div className="flex items-center space-x-2 text-rose-500 mb-6">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-900">Recommended Pre-planned Trips</h2>
          </div>

          <div className="relative w-full">
            <div className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-50 to-transparent z-20 pointer-events-none transition-opacity duration-300 ${showLeftFade ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-50 to-transparent z-20 pointer-events-none transition-opacity duration-300 ${showRightFade ? 'opacity-100' : 'opacity-0'}`} />

            <div ref={carouselRef} onScroll={handleCarouselScroll} className="marquee-wrapper relative">
              <div className="marquee-track">
                {[...PRE_PLANNED_TRIPS, ...PRE_PLANNED_TRIPS].map((trip, index) => {
                  const days = getTripDaysCount(trip.startDate, trip.endDate);
                  const parts = trip.travelStyle.split('|');
                  const style = parts[0];
                  const tripCurrencyCode = parts[1];
                  const tripCurrency = CURRENCIES[tripCurrencyCode] || CURRENCIES.USD;
                  return (
                    <div
                      key={`${trip.id}-${index}`}
                      onClick={() => {
                        setSelectedTrip(trip);
                        setActiveDayTab(1);
                      }}
                      className="group w-[280px] md:w-[320px] shrink-0 bg-white rounded-3xl border border-slate-100 hover:border-rose-350 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      <div className="relative h-40 w-full overflow-hidden">
                        <img
                          src={trip.image}
                          alt={trip.destination}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex items-center space-x-1.5 z-10">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-rose-550 border border-slate-100/50 backdrop-blur-sm shadow-sm">
                            {style}
                          </span>
                          {(() => {
                            const w = getWeatherForDestination(trip.destination, trip.startDate);
                            const Icon = w.condition === 'Sunny' ? Sun : w.condition === 'Cloudy' ? Cloud : w.condition === 'Rainy' ? CloudRain : w.condition === 'Snowy' ? Snowflake : Wind;
                            return (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-slate-700 border border-slate-100/50 backdrop-blur-sm shadow-sm flex items-center space-x-1">
                                <Icon className="h-3 w-3 text-amber-500" />
                                <span>{w.temp}°C</span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-rose-500 transition truncate">
                            {trip.destination}
                          </h3>
                          <p className="text-slate-555 text-[11px] mb-4">{days} Days Custom Schedule</p>
                        </div>
                        <div className="flex items-center justify-between text-slate-555 text-xs pt-3 border-t border-slate-50">
                          <div className="flex items-center space-x-1.5">
                            <Users className="h-4 w-4 text-rose-455" />
                            <span>{trip.travelers} Travelers</span>
                          </div>
                          <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                            <span>{tripCurrency.symbol}{Number(trip.budget).toLocaleString(tripCurrency.locale)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* My Saved Itineraries */}
        <div className="mb-6 pt-2 border-t border-slate-200/50">
          <h2 className="text-xl font-bold text-slate-900">My Saved Itineraries</h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Loading saved itineraries...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl text-center flex flex-col items-center justify-center border border-dashed border-slate-200 shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 mb-6 border border-slate-100">
              <TripIcon className="h-8 w-8 text-rose-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No trips created yet</h2>
            <p className="text-slate-555 max-w-sm text-sm mb-6 leading-relaxed">
              Get started by planning your first custom travel itinerary.
            </p>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-6 py-3 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-sm font-semibold transition cursor-pointer shadow-sm"
            >
              Start Planning
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const days = getTripDaysCount(trip.startDate, trip.endDate);
              const parts = (trip.travelStyle || '').split('|');
              const style = parts[0] || 'Adventure';
              const tripCurrencyCode = parts[1] || 'USD';
              const tripCurrency = CURRENCIES[tripCurrencyCode] || CURRENCIES.USD;
              const weather = getWeatherForDestination(trip.destination, trip.startDate);
              const WeatherIcon = weather.condition === 'Sunny' ? Sun : weather.condition === 'Cloudy' ? Cloud : weather.condition === 'Rainy' ? CloudRain : weather.condition === 'Snowy' ? Snowflake : Wind;

              return (
                <div
                  key={trip.id}
                  onClick={() => {
                    setSelectedTrip(trip);
                    setActiveDayTab(1);
                  }}
                  className="group relative bg-white p-6 rounded-3xl border border-slate-100 hover:border-rose-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer overflow-hidden shadow-sm"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-555 border border-rose-100">
                          {style}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-semibold text-slate-505 flex items-center space-x-1">
                          <WeatherIcon className={`h-3 w-3 ${weather.condition === 'Sunny' ? 'text-amber-500' : weather.condition === 'Rainy' ? 'text-blue-500' : 'text-slate-400'}`} />
                          <span>{weather.temp}°C</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportTripToPDF(trip);
                          }}
                          className="p-1.5 rounded-full hover:bg-rose-50 text-slate-450 hover:text-rose-555 transition cursor-pointer"
                          title="Export Trip PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTrip(trip, e)}
                          className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition cursor-pointer"
                          title="Delete Trip"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-950 mb-2 group-hover:text-rose-500 transition">
                      {trip.destination}
                    </h3>

                    <div className="flex items-center space-x-2 text-slate-500 text-xs mb-4">
                      <Calendar className="h-3.5 w-3.5 text-rose-400" />
                      <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)} ({days} {days === 1 ? 'day' : 'days'})</span>
                    </div>

                    <div className="flex items-center space-x-6 text-slate-600 text-xs mb-5">
                      <div className="flex items-center space-x-1.5">
                        <Users className="h-4 w-4 text-rose-455" />
                        <span>{trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-rose-500 font-bold text-sm">{tripCurrency.symbol}</span>
                        <span>Budget: {tripCurrency.symbol}{Number(trip.budget).toLocaleString(tripCurrency.locale)}</span>
                      </div>
                    </div>
                  </div>

                  {trip.interests && trip.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-50">
                      {trip.interests.slice(0, 3).map((interest, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-semibold text-slate-500">
                          {interest}
                        </span>
                      ))}
                      {trip.interests.length > 3 && (
                        <span className="text-[9px] text-slate-400 font-semibold flex items-center">+{trip.interests.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Favorites Section (Wishlist) */}
      <section className="max-w-7xl w-full mx-auto px-6 pb-12">
        <div className="flex items-center space-x-2 text-rose-500 mb-6">
          <Heart className="h-5 w-5" />
          <h2 className="text-xl font-bold text-slate-900">My Favorites / Wishlist</h2>
        </div>

        {favoritesLoading ? (
          <div className="flex items-center justify-center py-12 space-x-2">
            <div className="h-5 w-5 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400">Loading favorites...</span>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-slate-200 shadow-sm">
            <Heart className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-2">No favorites yet</p>
            <p className="text-xs text-slate-400">Save attractions and activities you love from trip details to build your wishlist.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favorites.map((fav) => (
              <div key={fav.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition group">
                {fav.image_url && (
                  <div className="h-32 w-full overflow-hidden">
                    <img src={fav.image_url} alt={fav.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex-1 truncate">{fav.name}</h4>
                    <button
                      onClick={() => handleRemoveFavorite(fav.id)}
                      className="p-1 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition ml-2 cursor-pointer shrink-0"
                      title="Remove from favorites"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {fav.location && (
                    <div className="flex items-center space-x-1 mt-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] text-slate-500 truncate">{fav.location}</span>
                    </div>
                  )}
                  {fav.description && (
                    <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-2">{fav.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {fav.type && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 text-[9px] font-semibold">{fav.type}</span>
                    )}
                    {fav.destination && (
                      <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 text-[9px] font-semibold">{fav.destination}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trip Details Modal */}
      <AnimatePresence>
        {selectedTrip && (() => {
          const parts = (selectedTrip.travelStyle || '').split('|');
          const style = parts[0] || 'Adventure';
          const tripCurrencyCode = parts[1] || 'USD';
          const tripCurrency = CURRENCIES[tripCurrencyCode] || CURRENCIES.USD;
          const weather = getWeatherForDestination(selectedTrip.destination, selectedTrip.startDate);
          const WeatherIcon = weather.condition === 'Sunny' ? Sun : weather.condition === 'Cloudy' ? Cloud : weather.condition === 'Rainy' ? CloudRain : weather.condition === 'Snowy' ? Snowflake : Wind;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-6xl bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-rose-500 mb-1">
                      <Sparkles className="h-4.5 w-4.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">{style} Mode</span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-955">{selectedTrip.destination}</h2>
                    <p className="text-slate-500 text-xs mt-1">
                      {formatDate(selectedTrip.startDate)} to {formatDate(selectedTrip.endDate)} • {selectedTrip.travelers} {selectedTrip.travelers === 1 ? 'Traveler' : 'Travelers'} • Budget: {tripCurrency.symbol}{Number(selectedTrip.budget).toLocaleString(tripCurrency.locale)}
                    </p>

                    <div className="flex items-center space-x-3 mt-3 text-xs text-slate-500 bg-slate-50 border border-slate-100 p-2.5 rounded-2xl w-fit shadow-sm">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-700">
                        <WeatherIcon className={`h-4 w-4 ${weather.condition === 'Sunny' ? 'text-amber-500' : weather.condition === 'Rainy' ? 'text-blue-500' : 'text-slate-400'}`} />
                        <span>{weather.temp}°C • {weather.condition}</span>
                      </div>
                      <span className="h-3 w-[1px] bg-slate-200" />
                      <span className="italic">{weather.desc}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {selectedTrip.isPrePlanned && (
                      <>
                        <button
                          disabled={isSavingTrip}
                          onClick={() => {
                            if (isSavingTrip) return;
                            setWizardInitialData({
                              destination: selectedTrip.destination,
                              startDate: selectedTrip.startDate,
                              endDate: selectedTrip.endDate,
                              budget: selectedTrip.budget,
                              travelers: selectedTrip.travelers,
                              travelStyle: selectedTrip.travelStyle,
                              interests: selectedTrip.interests
                            });
                            setIsWizardOpen(true);
                            setSelectedTrip(null);
                          }}
                          className="px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-707 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                        >
                          <Edit className="h-3.5 w-3.5 text-rose-500" />
                          <span>Customize</span>
                        </button>
                        <button
                          disabled={isSavingTrip}
                          onClick={async () => {
                            if (isSavingTrip) return;
                            setIsSavingTrip(true);
                            try {
                              await api.post('/trips', {
                                destination: selectedTrip.destination,
                                startDate: selectedTrip.startDate,
                                endDate: selectedTrip.endDate,
                                budget: selectedTrip.budget,
                                travelers: selectedTrip.travelers,
                                travelStyle: selectedTrip.travelStyle,
                                interests: selectedTrip.interests,
                                itinerary: selectedTrip.itineraries
                              });
                              showToast('Pre-planned itinerary saved to your trips!', 'success');
                              fetchTrips();
                              setSelectedTrip(null);
                            } catch (err) {
                              console.error(err);
                              showToast('Failed to copy itinerary.', 'error');
                            } finally {
                              setIsSavingTrip(false);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-805 disabled:bg-slate-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:cursor-not-allowed flex items-center space-x-1.5"
                        >
                          {isSavingTrip ? (
                            <>
                              <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <span>Add to My Trips</span>
                          )}
                        </button>
                      </>
                    )}
                    <button
                      disabled={isSavingTrip || isExporting}
                      onClick={() => exportTripToPDF(selectedTrip)}
                      className="px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-355 hover:bg-slate-55 text-slate-705 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExporting ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                          <span>Exporting...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5 text-rose-500" />
                          <span>Export PDF</span>
                        </>
                      )}
                    </button>
                    <button
                      disabled={isSavingTrip || isExporting}
                      onClick={() => !isSavingTrip && !isExporting && setSelectedTrip(null)}
                      className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center space-x-2 overflow-x-auto whitespace-nowrap scrollbar-thin">
                  {getDaysArray(selectedTrip).map((day) => (
                    <button
                      key={day}
                      onClick={() => setActiveDayTab(day)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeDayTab === day ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 bg-white'}`}
                    >
                      Day {day}
                    </button>
                  ))}
                  <button
                    onClick={() => setActiveDayTab('nearby')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${activeDayTab === 'nearby' ? 'bg-sky-600 text-white shadow-sm' : 'text-sky-600 hover:text-sky-850 hover:bg-sky-50 border border-sky-200 bg-white'}`}
                  >
                    <TripIcon className="h-3.5 w-3.5" />
                    <span>Nearby Places</span>
                  </button>
                  <button
                    onClick={() => setActiveDayTab('budget')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${activeDayTab === 'budget' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 border border-emerald-200 bg-white'}`}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Budget</span>
                  </button>
                  <button
                    onClick={() => setActiveDayTab('favorites')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${activeDayTab === 'favorites' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 bg-white'}`}
                  >
                    <Heart className="h-3.5 w-3.5" />
                    <span>Favorites</span>
                  </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  <div className="w-full md:w-7/12 overflow-y-auto p-6 border-r border-slate-100 space-y-6">
                    {activeDayTab === 'nearby' ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                            <TripIcon className="h-4 w-4 mr-1 text-sky-500" />
                            <span>Recommended Nearby Attractions (100 km)</span>
                          </span>
                          {nearbyPlaces.length > 0 && (
                            <span className="bg-sky-50 text-sky-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {nearbyPlaces.length}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {nearbyPlacesLoading ? (
                            <div className="col-span-2 flex flex-col items-center justify-center py-12 space-y-2">
                              <div className="h-6 w-6 border-2 border-sky-300 border-t-sky-600 rounded-full animate-spin" />
                              <span className="text-[10px] font-bold text-slate-400">Finding nearby gems...</span>
                            </div>
                          ) : nearbyPlaces.length === 0 ? (
                            <p className="col-span-2 text-slate-400 text-xs text-center py-8">No nearby places found.</p>
                          ) : (
                            nearbyPlaces.map((place, idx) => (
                              <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800 mb-1">{place.name}</h4>
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    <span className="inline-flex items-center text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                      <TripIcon className="h-2.5 w-2.5 mr-0.5 text-slate-400" />
                                      {place.distance}
                                    </span>
                                    <span className="inline-flex items-center text-[9px] font-medium text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                                      {place.type}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 leading-relaxed">{place.description}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : activeDayTab === 'budget' ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-emerald-500" />
                            <span>Budget Tracking Dashboard</span>
                          </span>
                        </div>

                        {budgetLoading ? (
                          <div className="flex flex-col items-center justify-center py-12 space-y-2">
                            <div className="h-6 w-6 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-slate-400">Loading budget data...</span>
                          </div>
                        ) : !budgetData ? (
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center">
                            <DollarSign className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 mb-4">No budget tracking available for this trip.</p>
                            <p className="text-xs text-slate-400">Budget tracking is available for trips saved to your account.</p>
                          </div>
                        ) : (
                          <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total Budget</span>
                                <p className="text-lg font-extrabold text-emerald-800 mt-1">{tripCurrency.symbol}{Number(budgetData.totalBudget).toLocaleString(tripCurrency.locale)}</p>
                              </div>
                              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Spent</span>
                                <p className="text-lg font-extrabold text-rose-800 mt-1">{tripCurrency.symbol}{Number(budgetData.totalActual || budgetData.totalSpent).toLocaleString(tripCurrency.locale)}</p>
                              </div>
                              <div className={`${(budgetData.remaining || budgetData.remaining === 0) && budgetData.remaining >= 0 ? 'bg-sky-50 border-sky-100' : 'bg-rose-50 border-rose-100'} border rounded-xl p-4`}>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Remaining</span>
                                <p className={`text-lg font-extrabold mt-1 ${(budgetData.remaining || budgetData.remaining === 0) && budgetData.remaining >= 0 ? 'text-sky-800' : 'text-rose-800'}`}>
                                  {tripCurrency.symbol}{Number(budgetData.remaining || 0).toLocaleString(tripCurrency.locale)}
                                </p>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Budget Utilization</span>
                                <span className={`text-xs font-extrabold ${(budgetData.utilizationPercent || budgetData.percentSpent) > 80 ? 'text-rose-600' : (budgetData.utilizationPercent || budgetData.percentSpent) > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                  {Math.round(budgetData.utilizationPercent || budgetData.percentSpent || 0)}%
                                </span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${(budgetData.utilizationPercent || budgetData.percentSpent) > 80 ? 'bg-rose-500' : (budgetData.utilizationPercent || budgetData.percentSpent) > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(budgetData.utilizationPercent || budgetData.percentSpent || 0, 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Category Breakdown */}
                            {budgetData.categoryBreakdown && budgetData.categoryBreakdown.length > 0 && (
                              <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                                  <Tag className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                                  Category Breakdown
                                </span>
                                {budgetData.categoryBreakdown.map((cat, idx) => (
                                  <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                    <div className="flex-1">
                                      <span className="text-xs font-bold text-slate-700">{cat.category}</span>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full ${cat.actual > cat.planned ? 'bg-rose-400' : 'bg-emerald-400'}`}
                                            style={{ width: `${cat.planned > 0 ? Math.min((cat.actual / cat.planned) * 100, 100) : cat.actual > 0 ? 100 : 0}%` }}
                                          />
                                        </div>
                                        <span className="text-[9px] font-semibold text-slate-400 w-12 text-right">
                                          {cat.count} item{cat.count !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right ml-4">
                                      <p className="text-xs font-bold text-slate-800">{tripCurrency.symbol}{Number(cat.actual).toLocaleString(tripCurrency.locale)}</p>
                                      <p className="text-[9px] text-slate-400">of {tripCurrency.symbol}{Number(cat.planned).toLocaleString(tripCurrency.locale)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Daily Breakdown */}
                            {budgetData.dailyBreakdown && budgetData.dailyBreakdown.length > 0 && (
                              <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daily Spending</span>
                                {budgetData.dailyBreakdown.map((day, idx) => (
                                  <div key={idx} className="py-2 border-b border-slate-50 last:border-0">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-bold text-slate-700">Day {day.day || 'N/A'}</span>
                                      <span className="text-[10px] font-bold text-slate-500">
                                        {tripCurrency.symbol}{Number(day.actual).toLocaleString(tripCurrency.locale)} / {tripCurrency.symbol}{Number(day.planned).toLocaleString(tripCurrency.locale)}
                                      </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${day.actual > day.planned ? 'bg-rose-400' : 'bg-emerald-400'}`}
                                        style={{ width: `${day.planned > 0 ? Math.min((day.actual / day.planned) * 100, 100) : day.actual > 0 ? 100 : 0}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Expense History */}
                            {budgetData.expenses && budgetData.expenses.length > 0 && (
                              <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                                  <Clock className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                                  Expense History ({budgetData.expenses.length})
                                </span>
                                {budgetData.expenses.map((exp, idx) => (
                                  <div key={exp.id || idx} className="flex items-start justify-between py-2 border-b border-slate-50 last:border-0 group/exp">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs font-bold text-slate-800">{exp.item_name || 'Expense'}</span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">{exp.category}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-400 mt-0.5">
                                        {exp.date ? new Date(exp.date).toLocaleDateString() : ''}
                                        {exp.notes ? ` • ${exp.notes}` : ''}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-2 shrink-0">
                                      <span className="text-xs font-extrabold text-rose-600">
                                        {tripCurrency.symbol}{Number(exp.actual_amount || 0).toLocaleString(tripCurrency.locale)}
                                      </span>
                                      <button
                                        onClick={() => startEditExpense({
                                          id: exp.id,
                                          category: exp.category,
                                          itemName: exp.item_name,
                                          plannedAmount: exp.planned_amount,
                                          actualAmount: exp.actual_amount,
                                          date: exp.date,
                                          notes: exp.notes,
                                        })}
                                        className="opacity-0 group-hover/exp:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteExpense(selectedTrip.id, exp.id)}
                                        className="opacity-0 group-hover/exp:opacity-100 p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition cursor-pointer"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add / Edit Expense Button */}
                            <button
                              onClick={() => {
                                if (editingExpense) setEditingExpense(null);
                                setShowExpenseForm(!showExpenseForm);
                              }}
                              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition cursor-pointer shadow-sm flex items-center justify-center space-x-2"
                            >
                              <Plus className="h-4 w-4" />
                              <span>{showExpenseForm ? 'Cancel' : editingExpense ? 'Edit Expense' : 'Add Expense'}</span>
                            </button>

                            {/* Add / Edit Expense Form */}
                            {(showExpenseForm || editingExpense) && (
                              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  {editingExpense ? 'Edit Expense' : 'New Expense'}
                                </span>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] font-semibold text-slate-500 mb-1 block">Category</label>
                                    <select
                                      value={editingExpense ? editingExpense.category : expenseForm.category}
                                      onChange={(e) => {
                                        if (editingExpense) setEditingExpense({...editingExpense, category: e.target.value});
                                        else setExpenseForm({...expenseForm, category: e.target.value});
                                      }}
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
                                    >
                                      <option>Food</option>
                                      <option>Accommodation</option>
                                      <option>Transport</option>
                                      <option>Activities</option>
                                      <option>Shopping</option>
                                      <option>Other</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-semibold text-slate-500 mb-1 block">Date</label>
                                    <input
                                      type="date"
                                      value={editingExpense ? editingExpense.date : expenseForm.date}
                                      onChange={(e) => {
                                        if (editingExpense) setEditingExpense({...editingExpense, date: e.target.value});
                                        else setExpenseForm({...expenseForm, date: e.target.value});
                                      }}
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] font-semibold text-slate-500 mb-1 block">Item Name</label>
                                  <input
                                    type="text"
                                    value={editingExpense ? editingExpense.itemName : expenseForm.itemName}
                                    onChange={(e) => {
                                      if (editingExpense) setEditingExpense({...editingExpense, itemName: e.target.value});
                                      else setExpenseForm({...expenseForm, itemName: e.target.value});
                                    }}
                                    placeholder="e.g. Dinner at restaurant"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] font-semibold text-slate-500 mb-1 block">Planned Amount</label>
                                    <input
                                      type="number"
                                      value={editingExpense ? editingExpense.plannedAmount : expenseForm.plannedAmount}
                                      onChange={(e) => {
                                        if (editingExpense) setEditingExpense({...editingExpense, plannedAmount: e.target.value});
                                        else setExpenseForm({...expenseForm, plannedAmount: e.target.value});
                                      }}
                                      placeholder="0.00"
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-semibold text-slate-500 mb-1 block">Actual Amount *</label>
                                    <input
                                      type="number"
                                      value={editingExpense ? editingExpense.actualAmount : expenseForm.actualAmount}
                                      onChange={(e) => {
                                        if (editingExpense) setEditingExpense({...editingExpense, actualAmount: e.target.value});
                                        else setExpenseForm({...expenseForm, actualAmount: e.target.value});
                                      }}
                                      placeholder="0.00"
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] font-semibold text-slate-500 mb-1 block">Notes (optional)</label>
                                  <input
                                    type="text"
                                    value={editingExpense ? editingExpense.notes : expenseForm.notes}
                                    onChange={(e) => {
                                      if (editingExpense) setEditingExpense({...editingExpense, notes: e.target.value});
                                      else setExpenseForm({...expenseForm, notes: e.target.value});
                                    }}
                                    placeholder="Any additional details"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    if (editingExpense) {
                                      handleUpdateExpense(selectedTrip.id, editingExpense.id);
                                    } else {
                                      handleAddExpense(selectedTrip.id);
                                    }
                                  }}
                                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                                >
                                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : activeDayTab === 'favorites' ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                            <Heart className="h-4 w-4 mr-1 text-rose-500" />
                            <span>Saved Favorites ({favorites.length})</span>
                          </span>
                        </div>
                        {favorites.length === 0 ? (
                          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-8 text-center">
                            <Heart className="h-8 w-8 text-rose-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 mb-2">No favorites in this trip</p>
                            <p className="text-xs text-slate-400">Browse activities and nearby places to save your favorites.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {favorites.map((fav) => (
                              <div key={fav.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition group">
                                {fav.image_url && (
                                  <div className="h-24 w-full rounded-lg overflow-hidden mb-3">
                                    <img src={fav.image_url} alt={fav.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  </div>
                                )}
                                <div className="flex items-start justify-between">
                                  <h4 className="text-xs font-bold text-slate-800 flex-1 truncate">{fav.name}</h4>
                                  <button
                                    onClick={() => handleRemoveFavorite(fav.id)}
                                    className="p-1 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition ml-2 cursor-pointer shrink-0"
                                    title="Remove"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                {fav.location && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <MapPin className="h-2.5 w-2.5 text-slate-400" />
                                    <span className="text-[9px] text-slate-500 truncate">{fav.location}</span>
                                  </div>
                                )}
                                {fav.description && (
                                  <p className="text-[9px] text-slate-400 mt-1 line-clamp-2">{fav.description}</p>
                                )}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {fav.type && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-500 text-[8px] font-semibold">{fav.type}</span>
                                  )}
                                  {fav.destination && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600 text-[8px] font-semibold">{fav.destination}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      getDayItineraries(selectedTrip).length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-8">No activities scheduled for this day.</p>
                      ) : (
                        <div className="space-y-6">
                          {getDayItineraries(selectedTrip).map((item, idx) => (
                            <ActivityCard key={item.id || idx} item={item} tripCurrency={tripCurrency} />
                          ))}
                        </div>
                      )
                    )}
                  </div>

                  <div className="w-full md:w-5/12 bg-slate-50/50 p-4 flex flex-col h-[280px] md:h-auto border-t md:border-t-0 border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-rose-500" />
                      <span>{activeDayTab === 'nearby' ? 'Nearby Attractions (100 km)' : `Day ${activeDayTab} Landmark Route`}</span>
                    </span>
                    <div className="flex-1 bg-slate-200 rounded-2xl overflow-hidden relative border border-slate-200 shadow-sm">
                      {isLeafletLoaded ? (
                        <div id="map-container" className="absolute inset-0 z-10 w-full h-full" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
                          <div className="h-6 w-6 border-2 border-slate-300 border-t-rose-500 rounded-full animate-spin" />
                          <span className="text-[10px] font-bold text-slate-400">Loading Map Engine...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedTrip.interests && selectedTrip.interests.length > 0 && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2 z-10">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center mr-2">
                      <Tag className="h-3.5 w-3.5 mr-1 text-rose-400" />
                      <span>Applied Interests:</span>
                    </div>
                    {selectedTrip.interests.map((interest, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[10px] text-slate-650 font-semibold shadow-sm">
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      <TripWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setWizardInitialData(null);
        }}
        onTripCreated={fetchTrips}
        currencyCode={currencyCode}
        initialData={wizardInitialData}
      />

      <AnimatePresence>
        {tripToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 max-w-sm w-full shadow-xl text-slate-800 relative"
            >
              <div className="flex items-center space-x-3 text-red-500 mb-4">
                <Trash2 className="h-5 w-5" />
                <h3 className="text-lg font-bold text-slate-900">Delete Trip</h3>
              </div>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Are you sure you want to delete your trip to <strong className="text-slate-800">{tripToDelete.destination}</strong>?
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => !isDeleting && setTripToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    if (isDeleting) return;
                    setIsDeleting(true);
                    try {
                      await api.delete(`/trips/${tripToDelete.id}`);
                      setTrips(trips.filter(t => t.id !== tripToDelete.id));
                      if (selectedTrip?.id === tripToDelete.id) setSelectedTrip(null);
                      showToast('Trip deleted successfully.', 'success');
                      setTripToDelete(null);
                    } catch (err) {
                      showToast('Failed to delete trip.', 'error');
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-400 text-white text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 flex items-center space-x-1.5 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[100] flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
                : 'bg-rose-50/95 border-rose-200 text-rose-800'
            }`}
          >
            <span className="text-xs font-bold tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

