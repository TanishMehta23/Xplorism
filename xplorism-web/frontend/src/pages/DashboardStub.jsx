import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Plus, Calendar, Compass as TripIcon, Compass,
  Trash2, DollarSign, Users, Sparkles, X, Clock, MapPin, Tag, Edit,
  Sun, Cloud, CloudRain, Snowflake, Wind, Heart, Download, Search,
  Maximize2, Minimize2, CheckSquare, Share2, CloudSun, ChevronUp, ChevronDown,
  UserPlus, Loader2, Plane, Map, TrendingUp, Coins, Globe, Hotel, Lock, Award,
  Quote, ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import TripWizard from '../components/TripWizard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

export const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', name: 'INR (₹)', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', name: 'USD ($)', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'EUR (€)', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'GBP (£)', locale: 'en-GB' },
  JPY: { code: 'JPY', symbol: '¥', name: 'JPY (¥)', locale: 'ja-JP' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'AUD (A$)', locale: 'en-AU' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'CAD (C$)', locale: 'en-CA' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'CHF (CHF)', locale: 'de-CH' },
  CNY: { code: 'CNY', symbol: '¥', name: 'CNY (¥)', locale: 'zh-CN' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'SGD (S$)', locale: 'en-SG' },
};

export const PRE_PLANNED_TRIPS = [
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
  { id: 'pre-ayodhya', destination: 'Ayodhya, Uttar Pradesh, India', image: 'https://images.unsplash.com/photo-1600664901390-3413f6df1600?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 12000, travelers: 2, travelStyle: 'Spiritual & Cultural Heritage|INR', interests: ['History', 'Culture'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Offer prayers at the magnificent Shri Ram Janmabhoomi Mandir', time: '09:00 AM', location: 'Ram Mandir', estimatedCost: 0 }, { day: 1, activity: 'Experience the divine evening Saryu River Aarti at Naya Ghat', time: '06:00 PM', location: 'Saryu Ghat', estimatedCost: 100 }, { day: 2, activity: 'Visit the hilltop Hanuman Garhi temple and beautiful Kanak Bhawan', time: '08:30 AM', location: 'Hanuman Garhi', estimatedCost: 50 }, { day: 2, activity: 'Sunset boat ride on the holy Saryu River with local legends storytelling', time: '04:00 PM', location: 'Saryu River', estimatedCost: 300 }, { day: 3, activity: 'Explore the historic tombs of Gulab Bari and Bahu Begum in Faizabad', time: '10:00 AM', location: 'Gulab Bari', estimatedCost: 150 }] },
  { id: 'pre-jodhpur-jaisalmer', destination: 'Jodhpur & Jaisalmer, Rajasthan, India', image: 'https://images.unsplash.com/photo-1602643163983-ed0babc39797?auto=format&fit=crop&w=600&q=80', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], budget: 28000, travelers: 2, travelStyle: 'Royal Desert Odyssey|INR', interests: ['History', 'Culture', 'Food'], isPrePlanned: true, itineraries: [{ day: 1, activity: 'Explore the massive Mehrangarh Fort and royal cenotaph Jaswant Thada', time: '09:30 AM', location: 'Mehrangarh Fort', estimatedCost: 800 }, { day: 1, activity: 'Wander the blue-painted streets of Jodhpur Old City and shop at Sardar Market', time: '04:00 PM', location: 'Clock Tower', estimatedCost: 200 }, { day: 2, activity: 'Drive to Jaisalmer and check into a luxury desert camp in Thar Desert', time: '08:00 AM', location: 'Thar Desert', estimatedCost: 3500 }, { day: 2, activity: 'Camel safari, dunes sunset photography, and Rajasthani cultural folk dance show', time: '04:30 PM', location: 'Sam Sand Dunes', estimatedCost: 1500 }, { day: 3, activity: 'Tour the living Jaisalmer Fort (Sonar Qila) and admire Patwon Ki Haveli intricate carvings', time: '09:30 AM', location: 'Jaisalmer Fort', estimatedCost: 500 }, { day: 4, activity: 'Rowboat ride at scenic Gadisar Lake and exploring the mysterious abandoned Kuldhara village', time: '10:00 AM', location: 'Gadisar Lake', estimatedCost: 400 }] },
];

const MAP_COORDINATES = {
  'singapore': { x: 740, y: 260 },
  'tokyo': { x: 800, y: 160 },
  'japan': { x: 800, y: 160 },
  'paris': { x: 480, y: 130 },
  'france': { x: 480, y: 130 },
  'london': { x: 470, y: 110 },
  'uk': { x: 470, y: 110 },
  'united kingdom': { x: 470, y: 110 },
  'new york': { x: 300, y: 140 },
  'usa': { x: 260, y: 150 },
  'sydney': { x: 840, y: 320 },
  'australia': { x: 820, y: 310 },
  'rome': { x: 500, y: 150 },
  'italy': { x: 500, y: 150 },
  'venice': { x: 500, y: 140 },
  'zurich': { x: 490, y: 140 },
  'swiss': { x: 490, y: 140 },
  'switzerland': { x: 490, y: 140 },
  'geneva': { x: 485, y: 145 },
  'barcelona': { x: 475, y: 160 },
  'spain': { x: 470, y: 165 },
  'amsterdam': { x: 480, y: 120 },
  'netherlands': { x: 480, y: 120 },
  'delhi': { x: 670, y: 190 },
  'new delhi': { x: 670, y: 190 },
  'india': { x: 670, y: 200 },
  'ayodhya': { x: 685, y: 190 },
  'jodhpur': { x: 660, y: 195 },
  'jaisalmer': { x: 650, y: 195 },
  'manali': { x: 665, y: 180 },
  'spiti': { x: 670, y: 178 },
  'lahaul': { x: 668, y: 178 },
  'ladakh': { x: 670, y: 175 },
  'kashmir': { x: 665, y: 175 },
  'leh': { x: 670, y: 175 },
  'toronto': { x: 290, y: 130 },
  'canada': { x: 250, y: 110 },
  'beijing': { x: 760, y: 160 },
  'china': { x: 730, y: 180 }
};

const getTripImage = (destination) => {
  const dest = (destination || '').toLowerCase();
  if (dest.includes('vancouver')) {
    return 'https://images.unsplash.com/photo-1559511260-66a654ae982a?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('tokyo') || dest.includes('japan')) {
    return 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('paris') || dest.includes('france')) {
    return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('new york') || dest.includes('york') || dest.includes('usa')) {
    return 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('london') || dest.includes('uk') || dest.includes('united kingdom')) {
    return 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('sydney') || dest.includes('australia')) {
    return 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('rome') || dest.includes('italy') || dest.includes('venice')) {
    return 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('singapore')) {
    return 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('zurich') || dest.includes('swiss') || dest.includes('switzerland') || dest.includes('geneva')) {
    return 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('barcelona') || dest.includes('spain')) {
    return 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('amsterdam') || dest.includes('netherlands')) {
    return 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('delhi') || dest.includes('india')) {
    return 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('rishikesh')) {
    return 'https://images.unsplash.com/photo-1566418879480-1a134a413d33?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('germany') || dest.includes('frankfurt')) {
    return 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('ayodhya')) {
    return 'https://images.unsplash.com/photo-1600664901390-3413f6df1600?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('jodhpur') || dest.includes('jaisalmer') || dest.includes('rajasthan')) {
    return 'https://images.unsplash.com/photo-1602643163983-ed0babc39797?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('manali') || dest.includes('himachal') || dest.includes('spiti') || dest.includes('lahaul')) {
    return 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('ladakh') || dest.includes('kashmir') || dest.includes('leh')) {
    return 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('dharamshala')) {
    return 'https://images.unsplash.com/photo-1626621341515-bbf8a53a914c?auto=format&fit=crop&w=600&q=80';
  }
  if (dest.includes('agra')) {
    return 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80';
  }

  // Use a beautiful Unsplash travel scene as fallback instead of random Picsum stock photos
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';
};

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

const get3DayForecast = (destination, startDateStr) => {
  const day1 = getWeatherForDestination(destination, startDateStr);
  const start = new Date(startDateStr);

  const day2Date = new Date(start);
  day2Date.setDate(start.getDate() + 1);
  const day2 = getWeatherForDestination(destination, day2Date.toISOString());
  day2.temp = day2.temp + 1;
  if (day2.condition === 'Sunny') day2.condition = 'Cloudy';

  const day3Date = new Date(start);
  day3Date.setDate(start.getDate() + 2);
  const day3 = getWeatherForDestination(destination, day3Date.toISOString());
  day3.temp = day3.temp - 1;
  if (day3.condition === 'Sunny') day3.condition = 'Windy';

  return [
    { date: start, ...day1 },
    { date: day2Date, ...day2 },
    { date: dateStr => day3Date, ...day3, date: day3Date }
  ];
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

const TripCoverImage = ({ destination, defaultImage, className }) => {
  const [imageSrc, setImageSrc] = useState(defaultImage || '');
  const [loading, setLoading] = useState(!defaultImage);

  useEffect(() => {
    let active = true;

    // If we already have a direct unsplash/external URL that isn't a loremflickr or placeholder one, use it
    if (defaultImage && !defaultImage.includes('loremflickr.com') && !defaultImage.includes('akhilbharat.in')) {
      setImageSrc(defaultImage);
      setLoading(false);
      return;
    }

    const fetchRealImage = async () => {
      try {
        const cleanKeyword = (destination || '').split(',')[0].trim();
        const searchQuery = encodeURIComponent(cleanKeyword);
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
          const pageTitle = searchData.query.search[0].title;
          const imageQueryUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=600&origin=*`;
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
        console.error("Failed to fetch real image for destination:", destination, err);
      }

      // Fallback to our mapped Unsplash/Picsum generator
      if (active) {
        setImageSrc(getTripImage(destination));
        setLoading(false);
      }
    };

    fetchRealImage();

    return () => {
      active = false;
    };
  }, [destination, defaultImage]);

  return (
    <div className={`relative w-full h-full bg-slate-100 ${loading ? 'animate-pulse' : ''}`}>
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : null}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={destination}
          className={className}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';
          }}
        />
      ) : null}
    </div>
  );
};

const ActivityCard = ({ item, tripCurrency, isFavorited, onToggleFavorite, onMoveUp, onMoveDown, onEdit }) => {
  const { formatCurrency } = useCurrency();
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
    <div className="relative pl-0 sm:pl-8 pb-6 sm:pb-8 last:pb-0 group">
      {/* Timeline line and node */}
      <div className="absolute left-[11px] top-2 bottom-0 w-[2px] bg-slate-200 dark:bg-slate-800 group-last:hidden z-0 hidden sm:block" />
      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-[3px] border-rose-500 flex items-center justify-center z-10 shadow-sm transition-transform duration-300 group-hover:scale-110 hidden sm:block">
        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
      </div>

      <div className="border hover:border-rose-300 rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row gap-5 items-stretch sm:items-start"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        {/* Left image block */}
        <div className="relative w-full h-44 sm:w-36 sm:h-28 rounded-2xl overflow-hidden shrink-0 shadow-sm border group/img bg-slate-100 dark:bg-slate-800"
          style={{ borderColor: 'var(--border-primary)' }}>
          {loading || !imageSrc ? (
            <div className="w-full h-full animate-pulse flex items-center justify-center bg-[var(--bg-tertiary)]">
              <div className="h-4 w-4 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
            </div>
          ) : (
            <img
              src={imageSrc}
              alt={item.location}
              className="w-full h-full object-cover group-hover/img:scale-108 transition-transform duration-500"
            />
          )}
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(item.location || item.activity)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-700 dark:text-slate-355 hover:bg-white dark:hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer border border-slate-100 dark:border-slate-800"
          >
            <Search className="h-3.5 w-3.5 text-slate-500" />
          </a>
        </div>

        {/* Right content block */}
        <div className="flex-1 flex flex-col justify-between space-y-2.5 w-full text-left">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center space-x-2 text-rose-500 text-[10px] font-black uppercase tracking-wider bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20">
                <Clock className="h-3.5 w-3.5" />
                <span>{item.time}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-slate-400 hover:text-rose-500 transition cursor-pointer border border-[var(--border-primary)] active:scale-90"
                    title="Edit Activity"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                )}
                {onMoveUp && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                    className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-slate-400 hover:text-rose-500 transition cursor-pointer border border-[var(--border-primary)] active:scale-90"
                    title="Move Up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                )}
                {onMoveDown && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                    className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-slate-400 hover:text-rose-500 transition cursor-pointer border border-[var(--border-primary)] active:scale-90"
                    title="Move Down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                  className="p-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition cursor-pointer shrink-0 border border-[var(--border-primary)] active:scale-90"
                  title="Toggle Favorite"
                >
                  <Heart className={`h-4 w-4 transition-colors ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>
            </div>

            <h4 className="text-base font-extrabold tracking-tight leading-snug" style={{ color: 'var(--text-primary)' }}>
              {item.location}
            </h4>

            <p className="text-sm leading-relaxed font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
              {item.activity}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs pt-1.5">
            <div className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl font-bold border ${Number(item.estimatedCost) > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-slate-400 dark:text-slate-550'}`}>
              <DollarSign className={`h-3.5 w-3.5 shrink-0 ${Number(item.estimatedCost) > 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{Number(item.estimatedCost) > 0 ? `${formatCurrency(item.estimatedCost, tripCurrency.code || tripCurrency).formatted}` : 'Free'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default function DashboardStub() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [activeDayTab, setActiveDayTab] = useState(1);
  const [dashboardView, setDashboardView] = useState('grid');
  const [mobileViewMode, setMobileViewMode] = useState('list');
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
  const [showWeatherPopup, setShowWeatherPopup] = useState(false);
  const carouselRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  // Custom confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: null
  });

  const showConfirm = ({ title, message, confirmText, cancelText, type = 'danger', onConfirm }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText: confirmText || 'Confirm',
      cancelText: cancelText || 'Cancel',
      type,
      onConfirm
    });
  };

  // Budget Tracking State
  const [budgetData, setBudgetData] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: 'Food', itemName: '', plannedAmount: '', actualAmount: '', date: '', notes: '' });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isModalMaximized, setIsModalMaximized] = useState(false);

  // Favorites State
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [passportStamps, setPassportStamps] = useState([]);

  const displayStamps = useMemo(() => {
    const merged = [...passportStamps];
    trips.forEach(trip => {
      const exists = merged.some(m => m.tripId === trip.id || m.id === trip.id || (m.destination === trip.destination && m.startDate === trip.startDate));
      if (!exists) {
        merged.push({
          id: trip.id,
          tripId: trip.id,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate
        });
      }
    });
    return merged;
  }, [passportStamps, trips]);

  // Travel Stats & Analytics
  const travelStats = useMemo(() => {
    if (!trips || trips.length === 0) {
      return {
        totalTrips: 0,
        countriesVisited: 0,
        totalSpend: 0,
        estimatedDistance: 0,
        totalDays: 0,
        travelVibe: 'Explorer'
      };
    }
    const uniqueDestinations = new Set();
    let totalBudget = 0;
    let totalDays = 0;
    const interestCounts = {};

    trips.forEach(t => {
      if (t.destination) {
        const parts = t.destination.split(',');
        const country = parts[parts.length - 1].trim();
        uniqueDestinations.add(country);
      }
      totalBudget += Number(t.budget) || 0;

      const start = new Date(t.startDate);
      const end = new Date(t.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
      totalDays += days;

      if (t.interests && Array.isArray(t.interests)) {
        t.interests.forEach(interest => {
          interestCounts[interest] = (interestCounts[interest] || 0) + 1;
        });
      }
    });

    let topInterest = '';
    let maxCount = 0;
    Object.entries(interestCounts).forEach(([interest, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topInterest = interest;
      }
    });

    let travelVibe = 'Urban Explorer';
    if (topInterest) {
      const vibeMap = {
        'Food': 'Culinary Explorer',
        'History': 'History Buff',
        'Nature': 'Nature Lover',
        'Adventure': 'Thrill Seeker',
        'Architecture': 'Design Connoisseur',
        'Art': 'Art Enthusiast',
        'Shopping': 'Fashion & Shopaholic',
        'Beaches': 'Beach Bum'
      };
      travelVibe = vibeMap[topInterest] || `${topInterest} Admirer`;
    }

    return {
      totalTrips: trips.length,
      countriesVisited: uniqueDestinations.size || 1,
      totalSpend: totalBudget,
      estimatedDistance: trips.length * 4850,
      totalDays,
      travelVibe
    };
  }, [trips]);

  // Travel Milestones & Achievements
  const travelMilestones = useMemo(() => {
    return [
      {
        id: 'globetrotter',
        title: 'Globetrotter',
        description: 'Explore 3 or more destinations',
        requirement: 'Visited 3+ destinations',
        unlocked: travelStats.countriesVisited >= 3,
        icon: Globe,
        gradient: 'from-blue-500/25 to-indigo-500/25',
        border: 'border-blue-200 dark:border-blue-900/30',
        iconBg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
      },
      {
        id: 'timetraveler',
        title: 'Time Traveler',
        description: 'Plan trips totaling 7 or more days',
        requirement: '7+ total travel days',
        unlocked: travelStats.totalDays >= 7,
        icon: Clock,
        gradient: 'from-amber-500/25 to-orange-500/25',
        border: 'border-amber-200 dark:border-amber-900/30',
        iconBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
      },
      {
        id: 'eliteexplorer',
        title: 'Elite Explorer',
        description: 'Create 3 or more custom trip plans',
        requirement: '3+ created trips',
        unlocked: travelStats.totalTrips >= 3,
        icon: Award,
        gradient: 'from-rose-500/25 to-pink-500/25',
        border: 'border-rose-200 dark:border-rose-900/30',
        iconBg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
      },
      {
        id: 'budgetcaptain',
        title: 'Budget Captain',
        description: 'Track budgets to unlock spend analytics',
        requirement: 'Spend logged (> ₹0)',
        unlocked: travelStats.totalSpend > 0,
        icon: Coins,
        gradient: 'from-emerald-500/25 to-teal-500/25',
        border: 'border-emerald-200 dark:border-emerald-900/30',
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
      },
      {
        id: 'jetset',
        title: 'Jet Setter',
        description: 'Plan 5 or more trips to become a Jet Setter',
        requirement: '5+ total trips',
        unlocked: travelStats.totalTrips >= 5,
        icon: Plane,
        gradient: 'from-purple-500/25 to-violet-500/25',
        border: 'border-purple-200 dark:border-purple-900/30',
        iconBg: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'
      },
      {
        id: 'wanderer',
        title: 'Wanderer',
        description: 'Accumulate 30 or more travel days',
        requirement: '30+ total travel days',
        unlocked: travelStats.totalDays >= 30,
        icon: Map,
        gradient: 'from-sky-500/25 to-cyan-500/25',
        border: 'border-sky-200 dark:border-sky-900/30',
        iconBg: 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400'
      },
      {
        id: 'continent',
        title: 'Continent Hopper',
        description: 'Visit destinations in 5 or more distinct regions',
        requirement: '5+ unique regions',
        unlocked: travelStats.countriesVisited >= 5,
        icon: TrendingUp,
        gradient: 'from-orange-500/25 to-red-500/25',
        border: 'border-orange-200 dark:border-orange-900/30',
        iconBg: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
      },
      {
        id: 'highroller',
        title: 'High Roller',
        description: 'Plan trips with a combined budget over ₹5,00,000',
        requirement: 'Total budget ≥ ₹5L',
        unlocked: travelStats.totalSpend >= 500000,
        icon: DollarSign,
        gradient: 'from-yellow-500/25 to-amber-400/25',
        border: 'border-yellow-200 dark:border-yellow-900/30',
        iconBg: 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400'
      }
    ];
  }, [travelStats]);

  const [activeQuoteIdx, setActiveQuoteIdx] = useState(0);

  const travelQuotes = useMemo(() => [
    {
      text: "The world is a book and those who do not travel read only one page.",
      author: "Saint Augustine"
    },
    {
      text: "Travel makes one modest. You see what a tiny place you occupy in the world.",
      author: "Gustave Flaubert"
    },
    {
      text: "To travel is to live.",
      author: "Hans Christian Andersen"
    },
    {
      text: "We travel not to escape life, but for life not to escape us.",
      author: "Anonymous"
    },
    {
      text: "Not all those who wander are lost.",
      author: "J.R.R. Tolkien"
    },
    {
      text: "Broad, wholesome, charitable views of men and things cannot be acquired by vegetating in one little corner of the earth all one's lifetime.",
      author: "Mark Twain"
    }
  ], []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveQuoteIdx(prev => (prev + 1) % travelQuotes.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [travelQuotes]);


  const [packingList, setPackingList] = useState([]);
  const [packingLoading, setPackingLoading] = useState(false);

  // Local Events State
  const [localEvents, setLocalEvents] = useState([]);
  const [localEventsLoading, setLocalEventsLoading] = useState(false);

  const [editingActivity, setEditingActivity] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const [showEditTripModal, setShowEditTripModal] = useState(false);
  const [editTripForm, setEditTripForm] = useState({ startDate: '', endDate: '', budget: '', travelers: 1 });

  const handleSaveTripDetails = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedTrip) return;
    try {
      const updatedTrip = await api.put(`/trips/${selectedTrip.id}`, {
        startDate: editTripForm.startDate,
        endDate: editTripForm.endDate,
        budget: parseFloat(editTripForm.budget) || 0,
        travelers: parseInt(editTripForm.travelers) || 1
      });
      if (updatedTrip) {
        setSelectedTrip(updatedTrip);
        setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
        setShowEditTripModal(false);
        showToast('Trip details updated successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update trip details.', 'error');
    }
  };

  // Collaboration State
  const socketRef = useRef(null);
  const [collaborators, setCollaborators] = useState([]);
  const [presenceList, setPresenceList] = useState({});
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const REAL_COORDINATES = {
    'singapore': [1.3521, 103.8198],
    'tokyo': [35.6762, 139.6503],
    'japan': [35.6762, 139.6503],
    'paris': [48.8566, 2.3522],
    'france': [48.8566, 2.3522],
    'london': [51.5074, -0.1278],
    'uk': [51.5074, -0.1278],
    'united kingdom': [51.5074, -0.1278],
    'new york': [40.7128, -74.0060],
    'usa': [37.0902, -95.7129],
    'sydney': [-33.8688, 151.2093],
    'australia': [-25.2744, 133.7751],
    'rome': [41.9028, 12.4964],
    'italy': [41.8719, 12.5674],
    'venice': [45.4408, 12.3155],
    'zurich': [47.3769, 8.5417],
    'swiss': [46.8182, 8.2275],
    'switzerland': [46.8182, 8.2275],
    'geneva': [46.2044, 6.1432],
    'barcelona': [41.3851, 2.1734],
    'spain': [40.4637, -3.7492],
    'amsterdam': [52.3676, 4.9041],
    'netherlands': [52.1326, 5.2913],
    'delhi': [28.6139, 77.2090],
    'new delhi': [28.6139, 77.2090],
    'india': [20.5937, 78.9629],
    'ayodhya': [26.7956, 82.1943],
    'jodhpur': [26.2389, 73.0243],
    'jaisalmer': [26.9157, 70.9083],
    'manali': [32.2396, 77.1887],
    'spiti': [32.2461, 78.0349],
    'lahaul': [32.6738, 77.1050],
    'ladakh': [34.1526, 77.5771],
    'kashmir': [34.0837, 74.7973],
    'leh': [34.1526, 77.5771],
    'toronto': [43.6532, -79.3832],
    'canada': [56.1304, -106.3468],
    'beijing': [39.9042, 116.4074],
    'china': [35.8617, 104.1954],
    'frankfurt': [50.1109, 8.6821],
    'germany': [51.1657, 10.4515]
  };

  useEffect(() => {
    if (dashboardView !== 'map') return;

    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletLoaded(true);
      document.body.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, [dashboardView]);

  const getSelectedTripCurrency = () => {
    if (!selectedTrip) return CURRENCIES.USD;
    const parts = (selectedTrip.travelStyle || '').split('|');
    const code = parts[1] || 'USD';
    return CURRENCIES[code] || CURRENCIES.USD;
  };

  useEffect(() => {
    if (!leafletLoaded || dashboardView !== 'map' || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const activeTrips = trips.length > 0 ? trips : PRE_PLANNED_TRIPS.slice(0, 8);

    const map = window.L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: false
    });
    mapInstanceRef.current = map;

    // Google Maps Tile Layer (no API key required for these public tiles)
    window.L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps',
      maxZoom: 19
    }).addTo(map);

    const customIcon = window.L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const bounds = [];
    activeTrips.forEach(t => {
      const destName = (t.destination || '').toLowerCase();
      const matchKey = Object.keys(REAL_COORDINATES).find(k => destName.includes(k));
      const coords = matchKey ? REAL_COORDINATES[matchKey] : [20, 77];

      const marker = window.L.marker(coords, { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <h4 style="margin: 0 0 4px; font-weight: bold; font-size: 13px; color: #1e293b;">${t.destination}</h4>
          <p style="margin: 0; font-size: 11px; color: #64748b;">Click to view itinerary</p>
        </div>
      `);

      marker.on('click', () => {
        setSelectedTrip(t);
        setActiveDayTab(1);
      });

      bounds.push(coords);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, dashboardView, trips]);

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedTrip) return;
    try {
      setInviteLoading(true);
      const res = await api.post(`/trips/${selectedTrip.id}/collaborators`, { email: inviteEmail });
      showToast('Collaborator added! Redirecting to collaborative workspace...', 'success');
      setInviteEmail('');
      setShowInviteModal(false);

      // If a separate cloned trip was created for collaboration, redirect there
      if (res && res.tripId) {
        setSelectedTrip(null);
        navigate(`/trips/${res.tripId}/collaborate`);
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to add collaborator.', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

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

  const fetchPassportStamps = async () => {
    try {
      const data = await api.get('/auth/profile');
      let history = data.user?.travel_history || data.user?.travelHistory || [];
      if (typeof history === 'string') {
        try { history = JSON.parse(history); } catch (e) { history = []; }
      }
      setPassportStamps(Array.isArray(history) ? history : []);
    } catch (err) {
      console.error('Failed to fetch passport stamps:', err);
    }
  };

  const handleDeleteStamp = async (stampId, e) => {
    if (e) e.stopPropagation();

    showConfirm({
      title: 'Remove Stamp?',
      message: 'Are you sure you want to remove this stamp from your passport collection? This action cannot be undone.',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const updatedStamps = passportStamps.filter(s => s.id !== stampId && s.tripId !== stampId);
          setPassportStamps(updatedStamps);

          await api.put('/auth/profile', {
            name: user.name,
            email: user.email,
            travelHistory: updatedStamps
          });
          showToast('Passport stamp removed.', 'success');
        } catch (err) {
          console.error('Failed to delete passport stamp:', err);
          showToast('Failed to remove passport stamp.', 'error');
        }
      }
    });
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

  const handleMoveActivity = async (index, direction) => {
    if (!selectedTrip) return;
    const activeDayList = getDayItineraries(selectedTrip);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= activeDayList.length) return;

    const itemA = activeDayList[index];
    const itemB = activeDayList[targetIndex];

    const tempTime = itemA.time;
    itemA.time = itemB.time;
    itemB.time = tempTime;

    const updatedItineraries = selectedTrip.itineraries.map(it => {
      if (it.id === itemA.id) return { ...it, time: itemA.time };
      if (it.id === itemB.id) return { ...it, time: itemB.time };
      return it;
    });

    try {
      const updatedTrip = await api.put(`/trips/${selectedTrip.id}`, {
        itinerary: updatedItineraries
      });
      if (updatedTrip) {
        setSelectedTrip(updatedTrip);
        setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
        showToast('Activity order updated.', 'success');
      }
    } catch (err) {
      showToast('Failed to update activity order.', 'error');
    }
  };

  const handleUpdateActivity = async (updatedActivity) => {
    if (!selectedTrip) return;
    const updatedItineraries = selectedTrip.itineraries.map(item =>
      item.id === updatedActivity.id ? updatedActivity : item
    );

    try {
      const updatedTrip = await api.put(`/trips/${selectedTrip.id}`, {
        itinerary: updatedItineraries.map(item => ({
          id: item.id,
          day: item.day,
          activity: item.activity,
          time: item.time,
          location: item.location,
          estimatedCost: item.estimatedCost || item.estimated_cost || 0
        }))
      });
      if (updatedTrip) {
        setSelectedTrip(updatedTrip);
        setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
        showToast('Activity updated successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update activity.', 'error');
    }
  };

  const fetchAISuggestions = async () => {
    if (!editingActivity || !selectedTrip) return;
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const suggestions = await api.post('/trips/suggest-activity', {
        destination: selectedTrip.destination,
        activity: editingActivity.activity,
        location: editingActivity.location,
        time: editingActivity.time
      });
      setAiSuggestions(suggestions || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch AI suggestions.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const fetchLocalEvents = async (tripId) => {
    if (!tripId) return;
    setLocalEventsLoading(true);
    try {
      const data = await api.get(`/trips/${tripId}/events`);
      setLocalEvents(data);
    } catch (err) {
      console.error('Failed to fetch local events:', err);
    } finally {
      setLocalEventsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTrip && activeDayTab === 'events') {
      fetchLocalEvents(selectedTrip.id);
    }
  }, [selectedTrip, activeDayTab]);

  // Socket.io Client Connection Effect
  useEffect(() => {
    if (!selectedTrip || selectedTrip.isPrePlanned) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setCollaborators([]);
      return;
    }

    // Connect to Socket.io backend
    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    // Join room
    socket.emit('join-trip-room', { tripId: selectedTrip.id, userName: user.name });

    // Listeners
    socket.on('collaborators-list', (list) => {
      setCollaborators(list.filter(name => name !== user.name));
    });

    socket.on('collaborator-joined', (name) => {
      showToast(`${name} joined collaborative editing session!`, 'info');
    });

    socket.on('collaborator-left', (name) => {
      showToast(`${name} left collaborative editing session.`, 'info');
    });

    socket.on('budget-updated', () => {
      fetchBudget(selectedTrip.id);
      showToast('Collaborator updated trip budget.', 'info');
    });

    socket.on('packing-updated', ({ data }) => {
      setPackingList(data);
      setSelectedTrip(prev => {
        if (prev && prev.id === selectedTrip.id) {
          return { ...prev, packingList: data };
        }
        return prev;
      });
      showToast('Collaborator updated packing list.', 'info');
    });

    socket.on('presence-updated', ({ userName, activeTab }) => {
      setPresenceList(prev => ({
        ...prev,
        [userName]: activeTab
      }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setCollaborators([]);
    };
  }, [selectedTrip]);

  // Sync user presence tab selection
  useEffect(() => {
    if (socketRef.current && selectedTrip) {
      socketRef.current.emit('presence-changed', {
        tripId: selectedTrip.id,
        userName: user.name,
        activeTab: activeDayTab
      });
    }
  }, [activeDayTab, selectedTrip]);

  // Packing List functions
  const fetchPackingList = async (tripId) => {
    if (!tripId) return;

    // Use preloaded packing list if available in selectedTrip
    if (selectedTrip && selectedTrip.id === tripId && selectedTrip.packingList) {
      setPackingList(selectedTrip.packingList);
      return;
    }

    setPackingLoading(true);

    if (typeof tripId === 'string' && tripId.startsWith('pre-')) {
      const diff = Math.abs(new Date(selectedTrip.endDate) - new Date(selectedTrip.startDate));
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
      const parts = selectedTrip.travelStyle.split('|');
      const style = parts[0];
      const weather = getWeatherForDestination(selectedTrip.destination, selectedTrip.startDate);

      const defaultPacking = [
        {
          category: "Clothing",
          items: [
            { name: "Daily Outfits", quantity: `${days}`, reason: "Outfits matching trip duration", checked: false },
            { name: "Comfortable Walking Shoes", quantity: "1 pair", reason: "For daily sightseeing", checked: false },
            { name: "Undergarments & Socks", quantity: `${days + 1}`, reason: "Daily essentials", checked: false },
            ...(weather.temp < 15 ? [{ name: "Warm Jacket/Sweater", quantity: "1-2", reason: "Cold climate protection", checked: false }] : []),
            ...(weather.condition.toLowerCase().includes('rain') ? [{ name: "Umbrella / Raincoat", quantity: "1", reason: "Rainy weather", checked: false }] : [])
          ]
        },
        {
          category: "Toiletries",
          items: [
            { name: "Toothbrush & Toothpaste", quantity: "1", reason: "Daily hygiene", checked: false },
            { name: "Deodorant", quantity: "1", reason: "Stay fresh", checked: false },
            { name: "Sunscreen", quantity: "1", reason: "Sun protection", checked: false }
          ]
        },
        {
          category: "Electronics",
          items: [
            { name: "Phone Charger", quantity: "1", reason: "Device charging", checked: false },
            { name: "Universal Travel Adapter", quantity: "1", reason: "Socket compatibility", checked: false },
            { name: "Power Bank", quantity: "1", reason: "Charging on the go", checked: false }
          ]
        },
        {
          category: "Documents",
          items: [
            { name: "Passport / ID Card", quantity: "1", reason: "Identity verification", checked: false },
            { name: "Trip Itinerary Printout", quantity: "1", reason: "Offline navigation", checked: false }
          ]
        }
      ];

      // Cache it on the preplanned trip object too
      selectedTrip.packingList = defaultPacking;
      setPackingList(defaultPacking);
      setPackingLoading(false);
      return;
    }

    try {
      const data = await api.get(`/trips/${tripId}/packing`);
      setPackingList(data || []);

      // Update selectedTrip locally so it has the list cached
      setSelectedTrip(prev => {
        if (prev && prev.id === tripId) {
          return { ...prev, packingList: data };
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to fetch packing list:', err);
      setPackingList([]);
    } finally {
      setPackingLoading(false);
    }
  };

  const handleTogglePackingItem = async (categoryIdx, itemIdx) => {
    const updatedList = [...packingList];
    updatedList[categoryIdx].items[itemIdx].checked = !updatedList[categoryIdx].items[itemIdx].checked;
    setPackingList(updatedList);

    // Update selectedTrip object's cached packingList in state
    if (selectedTrip) {
      setSelectedTrip(prev => ({
        ...prev,
        packingList: updatedList
      }));

      // Also update the trip object inside the main trips array so it is preserved if modal is closed & reopened
      setTrips(prevTrips =>
        prevTrips.map(t => t.id === selectedTrip.id ? { ...t, packingList: updatedList } : t)
      );
    }

    if (selectedTrip && !selectedTrip.isPrePlanned) {
      try {
        await api.put(`/trips/${selectedTrip.id}/packing`, { packingList: updatedList });
        if (socketRef.current) {
          socketRef.current.emit('packing-changed', {
            tripId: selectedTrip.id,
            action: 'update',
            data: updatedList
          });
        }
      } catch (err) {
        console.error('Failed to update packing checklist:', err);
      }
    }
  };

  // Fetch packing list when active tab changes to packing
  useEffect(() => {
    if (selectedTrip && activeDayTab === 'packing') {
      fetchPackingList(selectedTrip.id);
    }
  }, [selectedTrip?.id, activeDayTab]);

  // Reset packing list state when switching selected trip
  useEffect(() => {
    setPackingList([]);
  }, [selectedTrip?.id]);

  // Budget tracking functions
  const fetchBudget = async (tripId) => {
    if (!tripId) return;
    setBudgetLoading(true);
    setShowExpenseForm(false);

    if (typeof tripId === 'string' && tripId.startsWith('pre-')) {
      const totalBudget = parseFloat(selectedTrip.budget) || 0;
      const itineraryItems = selectedTrip.itineraries || [];
      const expenses = [];

      const totalPlanned = itineraryItems.reduce(
        (sum, item) => sum + parseFloat(item.estimatedCost || 0),
        0
      );
      const totalActual = 0;
      const remaining = totalBudget - totalActual;
      const utilizationPercent = 0;

      const categoryMap = {};
      const addToCategory = (cat, planned, actual) => {
        if (!categoryMap[cat]) {
          categoryMap[cat] = { category: cat, planned: 0, actual: 0, count: 0, items: [] };
        }
        categoryMap[cat].planned += planned;
        categoryMap[cat].actual += actual;
        categoryMap[cat].count += 1;
      };

      const autoCategorize = (item) => {
        const name = ((item.activity || '') + ' ' + (item.location || '')).toLowerCase();
        if (name.includes('food') || name.includes('restaurant') || name.includes('dinner') || name.includes('lunch') || name.includes('breakfast') || name.includes('cafe') || name.includes('market') || name.includes('tasting') || name.includes('meal')) {
          return 'Food & Dining';
        }
        if (name.includes('museum') || name.includes('gallery') || name.includes('tour') || name.includes('guide') || name.includes('ticket') || name.includes('entrance') || name.includes('admission')) {
          return 'Activities & Tours';
        }
        if (name.includes('hotel') || name.includes('hostel') || name.includes('resort') || name.includes('stay') || name.includes('lodging') || name.includes('accommodation')) {
          return 'Accommodation';
        }
        if (name.includes('flight') || name.includes('train') || name.includes('bus') || name.includes('taxi') || name.includes('uber') || name.includes('ferry') || name.includes('transport') || name.includes('cab') || name.includes('rental') || name.includes('gas') || name.includes('fuel')) {
          return 'Transportation';
        }
        if (name.includes('shop') || name.includes('souvenir') || name.includes('gift') || name.includes('boutique') || name.includes('mall') || name.includes('bazaar')) {
          return 'Shopping';
        }
        if (name.includes('beach') || name.includes('park') || name.includes('hike') || name.includes('trek') || name.includes('nature') || name.includes('scenic') || name.includes('viewpoint')) {
          return 'Outdoor & Nature';
        }
        return 'Miscellaneous';
      };

      itineraryItems.forEach(item => {
        const cat = autoCategorize(item);
        addToCategory(cat, parseFloat(item.estimatedCost || 0), 0);
      });

      const categoryBreakdown = Object.values(categoryMap).map(c => ({
        ...c,
        planned: parseFloat(c.planned.toFixed(2)),
        actual: parseFloat(c.actual.toFixed(2)),
        diff: parseFloat((c.actual - c.planned).toFixed(2)),
      })).sort((a, b) => b.planned - a.planned);

      const dailyMap = {};
      itineraryItems.forEach(item => {
        const day = item.day;
        if (!dailyMap[day]) dailyMap[day] = { day, planned: 0, actual: 0, items: [] };
        dailyMap[day].planned += parseFloat(item.estimatedCost || 0);
        dailyMap[day].items.push({
          type: 'itinerary',
          name: item.activity,
          location: item.location,
          planned: parseFloat(item.estimatedCost || 0),
          actual: 0,
          time: item.time,
        });
      });
      const dailyBreakdown = Object.values(dailyMap).sort((a, b) => a.day - b.day);

      setBudgetData({
        tripId,
        destination: selectedTrip.destination,
        totalBudget,
        totalPlanned,
        totalActual,
        remaining,
        utilizationPercent,
        categoryBreakdown,
        dailyBreakdown,
        expenses,
        isPrePlanned: true
      });
      setBudgetLoading(false);
      return;
    }

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
      if (socketRef.current) {
        socketRef.current.emit('budget-changed', { tripId, action: 'create' });
      }
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
      if (socketRef.current) {
        socketRef.current.emit('budget-changed', { tripId, action: 'update' });
      }
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
      if (socketRef.current) {
        socketRef.current.emit('budget-changed', { tripId, action: 'delete' });
      }
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

              if (isCancelled || !window.mapInstance) break;
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

            if (isCancelled || !window.mapInstance) break;
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
    if (mobileViewMode === 'map' && window.mapInstance) {
      setTimeout(() => {
        window.mapInstance.invalidateSize();
      }, 100);
    }
  }, [mobileViewMode]);

  useEffect(() => {
    if (user) {
      fetchTrips();
      fetchFavorites();
      fetchPassportStamps();
    }
  }, [user]);

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
                          Est. Cost: ${formatCurrency(act.estimatedCost, tripCurrency.code || tripCurrency).formatted}
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
          <div class="metric-card"><div class="metric-label">Budget</div><div class="metric-value">${formatCurrency(trip.budget, tripCurrency.code || tripCurrency).formatted}</div></div>
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

  const exportTripToICS = (trip) => {
    try {
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Xplorism//Itinerary Export//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ];

      const formatICSDate = (date, hrs, mins) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(hrs).padStart(2, '0');
        const mi = String(mins).padStart(2, '0');
        return `${yyyy}${mm}${dd}T${hh}${mi}00`;
      };

      const itineraries = trip.itineraries || [];
      const tripStartDate = new Date(trip.startDate);

      itineraries.forEach((act, idx) => {
        const dayNum = parseInt(act.day) || 1;
        const eventDate = new Date(tripStartDate);
        eventDate.setDate(eventDate.getDate() + (dayNum - 1));

        let hours = 9;
        let minutes = 0;
        const timeStr = act.time || '';
        const cleanTime = timeStr.toLowerCase().trim();
        const match = cleanTime.match(/(\d+):(\d+)\s*(am|pm)/);
        if (match) {
          hours = parseInt(match[1]);
          minutes = parseInt(match[2]);
          const isPm = match[3] === 'pm';
          if (isPm && hours < 12) hours += 12;
          if (!isPm && hours === 12) hours = 0;
        } else {
          if (cleanTime.includes('morning')) { hours = 9; }
          else if (cleanTime.includes('afternoon')) { hours = 14; }
          else if (cleanTime.includes('evening')) { hours = 18; }
          else if (cleanTime.includes('night')) { hours = 21; }
        }

        const dtStart = formatICSDate(eventDate, hours, minutes);
        const endMinutes = (minutes + 30) % 60;
        const endHours = hours + Math.floor((minutes + 30) / 60) + 1;
        const dtEnd = formatICSDate(eventDate, endHours % 24, endMinutes);

        const escapeText = (str) => (str || '').replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');

        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:trip-${trip.id}-day-${dayNum}-${idx}@xplorism.com`);
        icsContent.push(`DTSTAMP:${formatICSDate(new Date(), 12, 0)}Z`);
        icsContent.push(`DTSTART;TZID=UTC:${dtStart}`);
        icsContent.push(`DTEND;TZID=UTC:${dtEnd}`);
        icsContent.push(`SUMMARY:${escapeText(act.activity)}`);
        if (act.location) {
          icsContent.push(`LOCATION:${escapeText(act.location)}`);
        }
        icsContent.push(`DESCRIPTION:Day ${dayNum} - ${escapeText(act.activity)}${act.estimatedCost ? ` (Estimated Cost: ${act.estimatedCost})` : ''}`);
        icsContent.push('END:VEVENT');
      });

      icsContent.push('END:VCALENDAR');

      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${trip.destination.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_itinerary.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Calendar export (.ics) downloaded!', 'success');
    } catch (err) {
      console.error('Failed to export calendar', err);
      showToast('Failed to export calendar', 'error');
    }
  };

  const shareTripLink = (trip) => {
    const shareUrl = `${window.location.origin}/shared-trip/${trip.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Shareable link copied to clipboard!', 'success');
    }).catch(err => {
      console.error('Could not copy link', err);
      alert(`Here is your shareable link:\n${shareUrl}`);
    });
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

  const calculateExpectedBudgetDivision = (itineraries) => {
    if (!itineraries || itineraries.length === 0) return [];
    const categoryMap = {};
    const autoCategorize = (item) => {
      const name = ((item.activity || '') + ' ' + (item.location || '')).toLowerCase();
      if (name.includes('food') || name.includes('restaurant') || name.includes('dinner') || name.includes('lunch') || name.includes('breakfast') || name.includes('cafe') || name.includes('market') || name.includes('tasting') || name.includes('meal')) {
        return 'Food';
      }
      if (name.includes('museum') || name.includes('gallery') || name.includes('tour') || name.includes('guide') || name.includes('ticket') || name.includes('entrance') || name.includes('admission')) {
        return 'Activities';
      }
      if (name.includes('hotel') || name.includes('hostel') || name.includes('resort') || name.includes('stay') || name.includes('lodging') || name.includes('accommodation')) {
        return 'Lodging';
      }
      if (name.includes('flight') || name.includes('train') || name.includes('bus') || name.includes('taxi') || name.includes('uber') || name.includes('ferry') || name.includes('transport') || name.includes('cab') || name.includes('rental') || name.includes('gas') || name.includes('fuel')) {
        return 'Transport';
      }
      if (name.includes('shop') || name.includes('souvenir') || name.includes('gift') || name.includes('boutique') || name.includes('mall') || name.includes('bazaar')) {
        return 'Shopping';
      }
      return 'Misc';
    };

    itineraries.forEach(item => {
      const cat = autoCategorize(item);
      const cost = parseFloat(item.estimatedCost || item.estimated_cost || 0);
      if (cost > 0) {
        categoryMap[cat] = (categoryMap[cat] || 0) + cost;
      }
    });

    return Object.entries(categoryMap).map(([category, amount]) => ({ category, amount }));
  };

  const renderMapView = () => {
    const activeTrips = trips.length > 0 ? trips : PRE_PLANNED_TRIPS.slice(0, 8);

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden min-h-[450px] flex flex-col justify-between">
        <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.15] bg-grid-pattern pointer-events-none" />

        <div className="relative w-full h-[360px] bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full min-h-[360px]" style={{ zIndex: 10 }} />
          {!leafletLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-20">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
                <span className="text-xs font-bold text-slate-500">Loading Map...</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {activeTrips.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTrip(t);
                setActiveDayTab(1);
              }}
              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-955/20 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center space-x-1.5"
            >
              <MapPin className="h-3 w-3 text-rose-500" />
              <span>{t.destination}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-x-clip" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Decorative Ambient Blur Overlays */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <style>{`
        .marquee-wrapper {
          overflow-x: hidden;
          width: 100%;
          position: relative;
          padding-bottom: 12px;
          -webkit-mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
          mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
        }
        .marquee-track {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          gap: 16px;
          width: max-content;
          animation: marqueeScroll 260s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marqueeScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @media (min-width: 768px) {
          .marquee-track {
            gap: 24px;
            animation-duration: 300s;
          }
        }
        .marquee-card {
          width: 280px;
          min-width: 280px;
          max-width: 280px;
          flex-shrink: 0;
        }
        @media (min-width: 768px) {
          .marquee-card {
            width: 320px;
            min-width: 320px;
            max-width: 320px;
          }
        }
      `}</style>

      <Navbar activeTab="trips" />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 min-h-[85vh] pb-24">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8 md:mb-10 text-left">
          <div className="w-full md:w-auto">
            <div className="flex items-center justify-between md:justify-start space-x-2.5 mb-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 md:p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm">
                  <Compass className="h-4.5 w-4.5 md:h-5 md:w-5" />
                </div>
                <span className="text-[11px] md:text-xs font-black text-rose-500 uppercase tracking-widest">{t('travel_hub') || 'Personal Travel Hub'}</span>
              </div>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="md:hidden px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-extrabold text-xs transition-all duration-200 shadow-md shadow-rose-500/10 active:scale-95 flex items-center justify-center space-x-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t('create_new_trip')}</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-1.5 whitespace-nowrap">{t('dashboard_title')}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm md:text-base">{t('dashboard_desc')}</p>
          </div>
          <div className="hidden md:flex items-center justify-end gap-3">
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-extrabold text-xs transition-all duration-200 shadow-md shadow-rose-500/10 active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('create_new_trip')}</span>
            </button>
          </div>
        </div>

        {/* Pre-planned Trips Section */}
        <div className="mb-12">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">{t('recommended_trips')}</h2>
          </div>

          <div className="relative w-full">
            <div
              className={`absolute left-0 top-0 bottom-0 w-12 z-20 pointer-events-none transition-opacity duration-300 ${showLeftFade ? 'opacity-100' : 'opacity-0'}`}
              style={{ background: 'linear-gradient(to right, var(--bg-primary), transparent)' }}
            />
            <div
              className={`absolute right-0 top-0 bottom-0 w-12 z-20 pointer-events-none transition-opacity duration-300 ${showRightFade ? 'opacity-100' : 'opacity-0'}`}
              style={{ background: 'linear-gradient(to left, var(--bg-primary), transparent)' }}
            />

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
                      className="group marquee-card bg-white rounded-3xl border border-slate-100 interactive-card cursor-pointer overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      <div className="relative h-40 w-full overflow-hidden">
                        <TripCoverImage
                          destination={trip.destination}
                          defaultImage={trip.image}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex items-center space-x-1.5 z-10">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-rose-550 border border-slate-100/50 backdrop-blur-sm shadow-sm">
                            {style}
                          </span>
                          {(() => {
                            const w = getWeatherForDestination(trip.destination, trip.startDate);
                            const Icon = w.condition === 'Sunny' ? Sun : w.condition === 'Cloudy' ? Cloud : w.condition === 'Rainy' ? CloudRain : w.condition === 'Snowy' ? Snowflake : Wind;
                            let animClass = "";
                            if (w.condition === 'Sunny') animClass = "animate-spin-slow text-amber-500";
                            else if (w.condition === 'Cloudy') animClass = "animate-pulse text-sky-400";
                            else if (w.condition === 'Rainy') animClass = "animate-bounce text-blue-500";
                            else if (w.condition === 'Snowy') animClass = "animate-bounce text-sky-200";
                            else animClass = "animate-pulse text-teal-400";
                            return (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-slate-700 border border-slate-100/50 backdrop-blur-sm shadow-sm flex items-center space-x-1">
                                <Icon className={`h-3 w-3 ${animClass}`} />
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
                          <p className="text-slate-555 text-[11px] mb-4">{days} {t('days_schedule')}</p>
                        </div>
                        <div className="flex items-center justify-between text-slate-555 text-xs pt-3 border-t border-slate-50">
                          <div className="flex items-center space-x-1.5">
                            <Users className="h-4 w-4 text-rose-455" />
                            <span>{trip.travelers} {t('travelers')}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                            <span>{formatCurrency(trip.budget, tripCurrency.code || tripCurrency).formatted}</span>
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
        <div className="mb-6 pt-2 border-t border-slate-200/50 flex items-center justify-between gap-3 flex-nowrap">
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap shrink-0">{t('my_saved_itineraries')}</h2>

          <div className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setDashboardView('grid')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${dashboardView === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-500' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {t('grid_view')}
            </button>
            <button
              onClick={() => setDashboardView('map')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${dashboardView === 'map' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-500' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {t('map_view')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            <p className="text-slate-555 text-sm">{t('loading_saved')}</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl text-center flex flex-col items-center justify-center border border-dashed border-slate-200 shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-505 mb-6 border border-slate-100">
              <TripIcon className="h-8 w-8 text-rose-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{t('no_trips')}</h2>
            <p className="text-slate-555 max-w-sm text-sm mb-6 leading-relaxed">
              {t('get_started')}
            </p>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-6 py-3 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-sm font-semibold transition cursor-pointer shadow-sm"
            >
              {t('start_planning')}
            </button>
          </div>
        ) : dashboardView === 'map' ? (
          renderMapView()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                  className="group relative bg-white rounded-2xl sm:rounded-[32px] interactive-card border border-slate-200/60 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden shadow-sm"
                >
                  <div>
                    {/* Cover image header */}
                    <div className="relative h-36 sm:h-48 w-full overflow-hidden">
                      <TripCoverImage
                        destination={trip.destination}
                        defaultImage={trip.image}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-black/10" />

                      {/* Top style badge & weather pill */}
                      <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 flex items-center space-x-1.5 sm:space-x-2">
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-white/95 text-rose-550 border border-slate-100/50 backdrop-blur-sm shadow-sm">
                          {style}
                        </span>
                        <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-white/95 text-slate-700 backdrop-blur-md text-[8px] sm:text-[9px] font-black flex items-center space-x-1 sm:space-x-1.5 border border-slate-100/50 shadow-lg">
                          <WeatherIcon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${weather.condition === 'Sunny' ? 'text-amber-500 animate-spin-slow' : weather.condition === 'Rainy' ? 'text-sky-500' : 'text-slate-555'}`} />
                          <span>{weather.temp}°C</span>
                        </span>
                      </div>

                      {/* Top Action buttons */}
                      <div className="absolute top-2.5 sm:top-4 right-2.5 sm:right-4 flex items-center space-x-1.5 sm:space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportTripToPDF(trip);
                          }}
                          className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl sm:rounded-2xl bg-white/90 hover:bg-rose-500 text-slate-700 hover:text-white hover:border-rose-500 transition-all duration-300 shadow-md cursor-pointer border border-slate-200/50 flex items-center justify-center active:scale-90"
                          title="Export Trip PDF"
                        >
                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTrip(trip, e)}
                          className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl sm:rounded-2xl bg-white/90 hover:bg-red-650 text-slate-700 hover:text-white hover:border-red-650 transition-all duration-300 shadow-md cursor-pointer border border-slate-200/50 flex items-center justify-center active:scale-90"
                          title="Delete Trip"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Card Content body */}
                    <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1.5 sm:mb-2 transition-colors duration-300 truncate">
                        {trip.destination}
                      </h3>

                      <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 text-xs mb-3 sm:mb-4">
                        <Calendar className="h-3.5 w-3.5 text-rose-505 shrink-0" />
                        <span className="font-bold">{formatDate(trip.startDate)} - {formatDate(trip.endDate)} ({days} {days === 1 ? t('day') : t('days')})</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-505 dark:text-slate-400 text-xs pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center space-x-1.5">
                          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-505 shrink-0" />
                          <span className="font-bold">{trip.travelers} {t('travelers')}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 font-extrabold text-slate-900 dark:text-white">
                          <span>{formatCurrency(trip.budget, tripCurrency.code || tripCurrency).formatted}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {trip.interests && trip.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 px-4 sm:px-6 pb-4 sm:pb-6 pt-2.5 sm:pt-3 border-t border-slate-100/60 dark:border-slate-800/60">
                      {trip.interests.slice(0, 4).map((interest, idx) => (
                        <span key={idx} className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/40 dark:border-rose-900/30 text-[8.5px] sm:text-[9px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-700 dark:hover:text-rose-300 transition-all duration-200">
                          {interest}
                        </span>
                      ))}
                      {trip.interests.length > 4 && (
                        <span className="text-[10px] text-rose-500 dark:text-rose-455 font-extrabold uppercase tracking-wider flex items-center ml-1 shrink-0">+{trip.interests.length - 4} more</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Enhanced Travel Stats & Analytics Section */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-12 pb-4 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">{t('my_travel_journey')}</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          {/* Card 1: Total Spend */}
          <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-slate-900 dark:to-slate-950 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-350 flex flex-col sm:flex-row items-start sm:items-center space-y-2.5 sm:space-y-0 sm:space-x-4 group">
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <Coins className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9.5px] sm:text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block truncate">{t('total_spend')}</span>
              <span className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 block truncate">
                {activeCurrency.symbol}{travelStats.totalSpend.toLocaleString(activeCurrency.locale)}
              </span>
            </div>
          </div>

          {/* Card 2: Regions Visited */}
          <div className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-950 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-350 flex flex-col sm:flex-row items-start sm:items-center space-y-2.5 sm:space-y-0 sm:space-x-4 group">
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <Globe className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9.5px] sm:text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block truncate">{t('regions_visited')}</span>
              <span className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 block truncate">
                {travelStats.countriesVisited} {travelStats.countriesVisited === 1 ? t('destination_count') : t('destinations_count')}
              </span>
            </div>
          </div>

          {/* Card 3: Days Traveled */}
          <div className="bg-gradient-to-br from-rose-50 to-white dark:from-slate-900 dark:to-slate-950 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-350 flex flex-col sm:flex-row items-start sm:items-center space-y-2.5 sm:space-y-0 sm:space-x-4 group">
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9.5px] sm:text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block truncate">{t('days_traveled')}</span>
              <span className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 block truncate">
                {travelStats.totalDays} {t('days_unit')}
              </span>
            </div>
          </div>

          {/* Card 4: Travel Vibe */}
          <div className="bg-gradient-to-br from-amber-50 to-white dark:from-slate-900 dark:to-slate-950 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-350 flex flex-col sm:flex-row items-start sm:items-center space-y-2.5 sm:space-y-0 sm:space-x-4 group">
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9.5px] sm:text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block truncate">{t('travel_vibe')}</span>
              <span className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 block truncate">
                {travelStats.travelVibe}
              </span>
            </div>
          </div>
        </div>

        {/* Passport Stamps Collection */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">{t('passport_stamp_collection')}</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t('passport_stamp_subtitle')}</p>
            </div>
            <span className="text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
              {t('stamps_label')}: {displayStamps.length}
            </span>
          </div>

          {displayStamps.length === 0 ? (
            <div className="text-center py-10 sm:py-16 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center">
              <Globe className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 dark:text-slate-750 mb-3 animate-bounce" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{t('passport_empty_title')}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[280px]">{t('passport_empty_desc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 sm:gap-6 justify-items-center">
              {displayStamps.map((tItem, idx) => {
                const dest = tItem.destination.split(',')[0].trim().substring(0, 3).toUpperCase();
                const cityName = tItem.destination.split(',')[0].trim();
                const dateObj = tItem.startDate ? new Date(tItem.startDate) : null;
                const isValidDate = dateObj && !isNaN(dateObj.getTime());
                const year = isValidDate ? dateObj.getFullYear() : '';
                const month = isValidDate ? dateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : '';

                // Rotations and colors for realistic randomized ink stamps look
                const rotations = ['rotate-3', '-rotate-6', 'rotate-12', '-rotate-3', 'rotate-6', '-rotate-12', 'rotate-9', '-rotate-9'];
                const borderStyles = [
                  'border-rose-500 text-rose-500 bg-rose-50/15 dark:bg-rose-950/5',
                  'border-blue-500 text-blue-500 bg-blue-50/15 dark:bg-blue-950/5',
                  'border-emerald-500 text-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/5',
                  'border-amber-500 text-amber-500 bg-amber-50/15 dark:bg-amber-950/5'
                ];

                const stampRotation = rotations[idx % rotations.length];
                const stampColor = borderStyles[idx % borderStyles.length];
                const isTripActive = trips.some(trip => trip.id === tItem.tripId || trip.id === tItem.id);

                return (
                  <div key={tItem.id} className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-double flex flex-col items-center justify-center shrink-0 select-none shadow-sm transition-all duration-350 hover:scale-115 hover:shadow-md cursor-default ${stampColor} ${stampRotation} ${!isTripActive ? 'opacity-60 grayscale-[30%]' : ''}`}>
                    {isValidDate && (
                      <span className="text-[7px] sm:text-[8px] font-black tracking-widest opacity-80">{month} {year}</span>
                    )}
                    <span className="text-lg sm:text-xl font-extrabold tracking-tighter my-0.5">{dest}</span>
                    <span className="text-[6.5px] sm:text-[7px] font-black tracking-widest opacity-80 uppercase max-w-[60px] sm:max-w-[70px] truncate">{cityName}</span>
                    {!isTripActive && (
                      <button
                        onClick={(e) => handleDeleteStamp(tItem.id || tItem.tripId, e)}
                        className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-0.5 shadow-sm border border-white dark:border-slate-900 transition-colors duration-200 cursor-pointer active:scale-90 flex items-center justify-center"
                        title="Remove Stamp"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Travel Milestones & Achievements */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm mt-6 sm:mt-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">{t('travel_milestones_title')}</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t('travel_milestones_subtitle')}</p>
            </div>
            <span className="text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-rose-500 uppercase tracking-widest shrink-0">
              {travelMilestones.filter(m => m.unlocked).length} / {travelMilestones.length} {t('unlocked_label')}
            </span>
          </div>

          {/* Horizontal scroll row */}
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {travelMilestones.map((milestone) => {
              const MilestoneIcon = milestone.icon;
              return (
                <div
                  key={milestone.id}
                  className={`relative flex-shrink-0 w-44 sm:w-52 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border overflow-hidden transition-all duration-350 ${milestone.unlocked
                    ? `bg-gradient-to-br ${milestone.gradient} ${milestone.border} shadow-md hover:scale-105 hover:shadow-xl cursor-default`
                    : `bg-gradient-to-br ${milestone.gradient} ${milestone.border} cursor-default`
                    }`}
                >
                  {/* Blur overlay for locked badges */}
                  {!milestone.unlocked && (
                    <div className="absolute inset-0 z-10 rounded-2xl sm:rounded-3xl backdrop-blur-[3px] bg-white/50 dark:bg-slate-900/60 flex flex-col items-center justify-center">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 mb-1.5">
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="text-[8.5px] sm:text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('locked_label')}</span>
                      <span className="text-[7.5px] sm:text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-1 px-2 text-center">{milestone.requirement}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2.5 sm:mb-3">
                    <div className={`p-2 sm:p-2.5 rounded-xl ${milestone.iconBg} transition duration-300`}>
                      <MilestoneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    {milestone.unlocked && (
                      <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                        ✓ {t('unlocked_label')}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs sm:text-sm font-black tracking-tight text-slate-800 dark:text-white mt-1">
                    {milestone.title}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {milestone.description}
                  </p>

                  <div className="border-t border-slate-200/60 dark:border-slate-700/40 mt-3 sm:mt-4 pt-2 sm:pt-2.5 text-[8.5px] sm:text-[9px] font-bold tracking-wide text-slate-400 dark:text-slate-500">
                    {t('goal_label')}: {milestone.requirement}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Curated Travel Quotes Carousel */}
        <div className="relative mt-6 sm:mt-8 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 group/quote min-h-[140px] animate-fade-in">
          {/* Subtle glowing background circles */}
          <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

          {/* Left Block: Icon and title */}
          <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400">
              <Quote className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-black text-rose-500 uppercase tracking-widest block">{t('daily_vibe')}</span>
              <h3 className="text-xs sm:text-sm font-black text-slate-850 dark:text-white tracking-tight mt-0.5">{t('wanderlust_quotes')}</h3>
            </div>
          </div>

          {/* Center Block: Display active quote */}
          <div className="flex-1 max-w-xl mx-auto text-center md:text-left px-2 sm:px-6">
            <p className="text-xs font-bold text-slate-705 dark:text-slate-200 italic leading-relaxed transition-all duration-500">
              "{travelQuotes[activeQuoteIdx].text}"
            </p>
            <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest mt-1.5 sm:mt-2 block">
              — {travelQuotes[activeQuoteIdx].author}
            </span>
          </div>

          {/* Right Block: Manual pagination buttons */}
          <div className="flex items-center justify-center space-x-2 shrink-0">
            <button
              onClick={() => setActiveQuoteIdx(prev => (prev - 1 + travelQuotes.length) % travelQuotes.length)}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 text-slate-400 hover:text-slate-655 dark:hover:text-slate-300 flex items-center justify-center transition cursor-pointer active:scale-90"
              title="Previous Quote"
            >
              <ChevronLeft className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </button>
            <button
              onClick={() => setActiveQuoteIdx(prev => (prev + 1) % travelQuotes.length)}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 text-slate-400 hover:text-slate-655 dark:hover:text-slate-300 flex items-center justify-center transition cursor-pointer active:scale-90"
              title="Next Quote"
            >
              <ChevronRight className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </button>
          </div>
        </div>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-slate-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative w-full mx-auto bg-white border border-slate-200 shadow-xl flex flex-col overflow-hidden text-slate-800 transition-all duration-300 ${isModalMaximized
                  ? 'max-w-[98vw] h-[95vh] max-h-[95vh] rounded-2xl'
                  : 'max-w-6xl h-full md:h-[680px] max-h-screen md:max-h-[90vh] rounded-none md:rounded-3xl'
                  }`}
              >
                {/* Mobile Quick Action Buttons & Close Button */}
                <div className="md:hidden absolute top-4 right-4 z-55 flex items-center space-x-2">
                  <button
                    disabled={isSavingTrip || isExporting}
                    onClick={() => shareTripLink(selectedTrip)}
                    className="h-9 w-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] flex items-center justify-center transition active:scale-90 shadow-sm cursor-pointer"
                    title="Share Link"
                  >
                    <Share2 className="h-4 w-4 text-rose-500" />
                  </button>
                  <button
                    disabled={isSavingTrip || isExporting}
                    onClick={() => exportTripToICS(selectedTrip)}
                    className="h-9 w-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] flex items-center justify-center transition active:scale-90 shadow-sm cursor-pointer"
                    title="Export Calendar"
                  >
                    <Calendar className="h-4 w-4 text-rose-500" />
                  </button>
                  <button
                    disabled={isSavingTrip || isExporting}
                    onClick={() => exportTripToPDF(selectedTrip)}
                    className="h-9 w-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] flex items-center justify-center transition active:scale-90 shadow-sm cursor-pointer"
                    title="Export PDF"
                  >
                    {isExporting ? (
                      <div className="h-3.5 w-3.5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 text-rose-500" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrip(null);
                      setIsModalMaximized(false);
                    }}
                    className="h-9 w-9 rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 dark:text-slate-200 flex items-center justify-center transition active:scale-90"
                    title="Close"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Absolute Top-Right Window Controls & Actions (Desktop Only) */}
                <div className="hidden md:flex absolute top-4 right-4 z-50 items-center space-x-2">
                  <button
                    disabled={isSavingTrip || isExporting}
                    onClick={() => shareTripLink(selectedTrip)}
                    className="p-2.5 md:px-4 md:py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer bg-white shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-[36px]"
                    title="Copy shareable link"
                  >
                    <Share2 className="h-3.5 w-3.5 text-rose-500" />
                    <span className="hidden md:inline">Share Link</span>
                  </button>
                  <button
                    disabled={isSavingTrip || isExporting}
                    onClick={() => exportTripToICS(selectedTrip)}
                    className="p-2.5 md:px-4 md:py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer bg-white shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-[36px]"
                    title="Export calendar file (.ics)"
                  >
                    <Calendar className="h-3.5 w-3.5 text-rose-500" />
                    <span className="hidden md:inline">Export Calendar</span>
                  </button>
                  <button
                    disabled={isSavingTrip || isExporting}
                    onClick={() => exportTripToPDF(selectedTrip)}
                    className="p-2.5 md:px-4 md:py-2 rounded-xl border border-slate-200 hover:border-slate-355 hover:bg-slate-55 text-slate-705 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer bg-white shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-[36px]"
                  >
                    {isExporting ? (
                      <>
                        <div className="h-3 w-3 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                        <span className="hidden md:inline">Exporting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 text-rose-500" />
                        <span className="hidden md:inline">Export PDF</span>
                      </>
                    )}
                  </button>
                  <button
                    disabled={isSavingTrip || isExporting}
                    onClick={() => setIsModalMaximized(!isModalMaximized)}
                    className="h-[36px] w-[36px] rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition cursor-pointer bg-white shadow-sm flex items-center justify-center disabled:opacity-50"
                    title={isModalMaximized ? "Restore down" : "Maximize"}
                  >
                    {isModalMaximized ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
                  </button>
                  <button
                    disabled={isSavingTrip || isExporting}
                    onClick={() => {
                      if (!isSavingTrip && !isExporting) {
                        setSelectedTrip(null);
                        setIsModalMaximized(false);
                      }
                    }}
                    className="h-[36px] w-[36px] rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-rose-600 transition cursor-pointer bg-white shadow-sm flex items-center justify-center disabled:opacity-50"
                    title="Close"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
                <div className="pt-14 pb-5 px-5 md:pt-16 md:pb-6 md:px-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 md:pr-[420px]">
                    <div className="flex items-center space-x-2 text-rose-500 mb-1">
                      <Sparkles className="h-4.5 w-4.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">{style} Mode</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-955 leading-tight">{selectedTrip.destination}</h2>
                    <div className="flex items-center space-x-1.5 flex-wrap text-slate-500 text-xs mt-1">
                      <span>{formatDate(selectedTrip.startDate)} - {formatDate(selectedTrip.endDate)} ({getTripDaysCount(selectedTrip.startDate, selectedTrip.endDate)} days)</span>
                      <span>•</span>
                      <span>{selectedTrip.travelers} {t('travelers')}</span>
                      <span>•</span>
                      <span>{t('budget_label')}: {formatCurrency(selectedTrip.budget, tripCurrency.code || tripCurrency).formatted}</span>
                      {!selectedTrip.isPrePlanned && (
                        <button
                          onClick={() => {
                            setEditTripForm({
                              startDate: (selectedTrip.startDate || '').split('T')[0],
                              endDate: (selectedTrip.endDate || '').split('T')[0],
                              budget: selectedTrip.budget,
                              travelers: selectedTrip.travelers
                            });
                            setShowEditTripModal(true);
                          }}
                          className="text-rose-500 hover:text-rose-600 font-bold ml-1 flex items-center space-x-0.5 cursor-pointer underline decoration-dotted transition"
                          title="Edit Trip Details"
                        >
                          <Edit className="h-3 w-3" />
                          <span>(Edit)</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setShowWeatherPopup(true)}
                      className="flex items-center space-x-3 mt-3 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-primary)] p-2.5 rounded-2xl w-fit shadow-sm hover:bg-[var(--border-primary)] transition cursor-pointer active:scale-95 text-left group/weather"
                      style={{ color: 'var(--text-secondary)' }}
                      title="View 3-Day Weather Forecast"
                    >
                      <div className="flex items-center space-x-1.5 font-bold" style={{ color: 'var(--text-primary)' }}>
                        <WeatherIcon className={`h-4 w-4 group-hover/weather:scale-110 transition-transform ${weather.condition === 'Sunny' ? 'text-amber-500' : weather.condition === 'Rainy' ? 'text-blue-500' : 'text-slate-400'}`} />
                        <span>{weather.temp}°C • {weather.condition}</span>
                      </div>
                      <span className="h-3 w-[1px] bg-[var(--border-primary)]" />
                      <span className="italic">{weather.desc}</span>
                      <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest pl-1 opacity-0 group-hover/weather:opacity-100 transition-opacity">Forecast →</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* Real-time Collaboration Active Avatars */}
                    {!selectedTrip.isPrePlanned && (
                      <div className="flex items-center space-x-2.5 mr-2 bg-rose-50/40 hover:bg-rose-50/70 border border-rose-100/40 px-3.5 py-1.5 rounded-full shadow-sm hover:shadow transition duration-250">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          <div
                            className="flex h-6 w-6 rounded-full ring-2 ring-white bg-rose-500 text-white text-[10px] font-black items-center justify-center select-none shadow-sm cursor-help leading-none"
                            title={`You (${user.name}) - Active`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {collaborators.map((name, idx) => (
                            <div
                              key={idx}
                              className="flex h-6 w-6 rounded-full ring-2 ring-white bg-indigo-600 text-white text-[10px] font-black items-center justify-center select-none shadow-sm cursor-help animate-pulse leading-none"
                              title={`${name} - Editing (Tab: ${presenceList[name] || 'Itinerary'})`}
                            >
                              {name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                        {selectedTrip.userId === user.id ? (
                          <button
                            onClick={() => navigate(`/trips/${selectedTrip.id}/collaborate`)}
                            className="flex flex-col text-left shrink-0 hover:text-rose-600 transition cursor-pointer group/add-collab border-none bg-transparent p-0 outline-none"
                          >
                            <span className="text-[10px] font-extrabold text-rose-500 group-hover/add-collab:text-rose-600 uppercase tracking-wider leading-none flex items-center">
                              <UserPlus className="h-3 w-3 mr-1 shrink-0" />
                              <span>Add to Collaboration</span>
                            </span>
                            {collaborators.length > 0 && (
                              <span className="text-[9px] font-bold text-slate-500 mt-0.5 leading-none">
                                {collaborators.length + 1} online
                              </span>
                            )}
                          </button>
                        ) : (
                          <div className="flex flex-col text-left shrink-0">
                            <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider leading-none">Collaboration</span>
                            {collaborators.length > 0 && (
                              <span className="text-[9px] font-bold text-slate-500 mt-0.5 leading-none">
                                {collaborators.length + 1} online
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
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
                  </div>
                </div>

                <div className="px-6 py-4 border-b flex items-center space-x-2 overflow-x-auto whitespace-nowrap scrollbar-none"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
                  {getDaysArray(selectedTrip).map((day) => (
                    <button
                      key={day}
                      onClick={() => setActiveDayTab(day)}
                      className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer active:scale-95 ${activeDayTab === day ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] border border-[var(--border-primary)] shadow-sm'}`}
                    >
                      Day {day}
                    </button>
                  ))}
                  <button
                    onClick={() => setActiveDayTab('nearby')}
                    className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center space-x-1.5 md:ml-auto active:scale-95 ${activeDayTab === 'nearby' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'text-sky-500 hover:text-sky-600 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shadow-sm'}`}
                  >
                    <TripIcon className="h-4 w-4" />
                    <span>Nearby Places</span>
                  </button>
                  <button
                    onClick={() => setActiveDayTab('budget')}
                    className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center space-x-1.5 active:scale-95 ${activeDayTab === 'budget' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-emerald-500 hover:text-emerald-600 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shadow-sm'}`}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Budget</span>
                  </button>
                  <button
                    onClick={() => setActiveDayTab('packing')}
                    className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center space-x-1.5 active:scale-95 ${activeDayTab === 'packing' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' : 'text-amber-500 hover:text-amber-600 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shadow-sm'}`}
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span>Packing List</span>
                  </button>
                  <button
                    onClick={() => setActiveDayTab('favorites')}
                    className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center space-x-1.5 active:scale-95 ${activeDayTab === 'favorites' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'text-rose-500 hover:text-rose-650 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shadow-sm'}`}
                  >
                    <Heart className="h-4 w-4" />
                    <span>Favorites</span>
                  </button>
                  <button
                    onClick={() => setActiveDayTab('events')}
                    className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center space-x-1.5 active:scale-95 ${activeDayTab === 'events' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-indigo-500 hover:text-indigo-650 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shadow-sm'}`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Local Events</span>
                  </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  <div className={`w-full md:w-7/12 overflow-y-auto p-4 sm:p-6 border-r border-[var(--border-primary)] space-y-6 pb-20 md:pb-6 ${mobileViewMode === 'list' ? 'block' : 'hidden md:block'}`}>
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
                            nearbyPlaces.map((place, idx) => {
                              const isFav = favorites.some(fav => fav.name.toLowerCase().trim() === place.name.toLowerCase().trim());
                              return (
                                <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between relative group">
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="text-xs font-bold text-slate-800 mb-1">{place.name}</h4>
                                      <button
                                        onClick={() => handleToggleFavorite(place)}
                                        className="p-1 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition cursor-pointer shrink-0"
                                        title="Toggle Favorite"
                                      >
                                        <Heart className={`h-3.5 w-3.5 transition-colors ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                                      </button>
                                    </div>
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
                              );
                            })
                          )}
                        </div>
                      </div>
                    ) : activeDayTab === 'budget' ? (
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-emerald-500" />
                            <span>Budget Tracking Dashboard</span>
                          </span>
                          <button
                            onClick={() => {
                              setSelectedTrip(null);
                              navigate(`/trips/${selectedTrip.id}/budget`);
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl transition shadow-sm cursor-pointer self-start sm:self-auto"
                          >
                            Manage Expenses & Details
                          </button>
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
                            {/* Summary Card */}
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                              <div>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Total Trip Budget Limit</span>
                                <p className="text-2xl font-extrabold text-emerald-800">
                                  {formatCurrency(budgetData.totalBudget ?? 0, tripCurrency.code || tripCurrency).formatted}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">This is the total cap allocated for your travel expenses.</p>
                              </div>

                              {/* SVG Donut Chart */}
                              {budgetData.categoryBreakdown && budgetData.categoryBreakdown.length > 0 && (() => {
                                let accumPercent = 0;
                                return (
                                  <div className="relative h-24 w-24 flex items-center justify-center shrink-0 bg-white/40 dark:bg-slate-900/20 rounded-full p-1.5">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="3" />
                                      {budgetData.categoryBreakdown.map((cat, idx) => {
                                        const percent = budgetData.totalBudget > 0 ? (Number(cat.planned) / Number(budgetData.totalBudget)) * 100 : 0;
                                        if (percent <= 0) return null;

                                        const colors = [
                                          '#10b981', // emerald-500
                                          '#f43f5e', // rose-500
                                          '#0ea5e9', // sky-500
                                          '#eab308', // yellow-500
                                          '#6366f1', // indigo-500
                                          '#a855f7'  // purple-500
                                        ];
                                        const strokeColor = colors[idx % colors.length];
                                        const dashArray = `${percent} ${100 - percent}`;
                                        const dashOffset = 100 - accumPercent;
                                        accumPercent += percent;

                                        return (
                                          <circle
                                            key={idx}
                                            cx="18"
                                            cy="18"
                                            r="15.915"
                                            fill="transparent"
                                            stroke={strokeColor}
                                            strokeWidth="3.2"
                                            strokeDasharray={dashArray}
                                            strokeDashoffset={dashOffset}
                                          />
                                        );
                                      })}
                                    </svg>
                                    <div className="absolute flex flex-col items-center text-center">
                                      <span className="text-[9px] font-black text-emerald-800 dark:text-emerald-300 leading-none">Limit</span>
                                      <span className="text-[8px] text-slate-500 leading-none mt-0.5">100%</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Category Breakdown (Allocation) */}
                            {budgetData.categoryBreakdown && budgetData.categoryBreakdown.length > 0 && (
                              <div className="bg-white border border-slate-100 rounded-xl p-4 mt-3 space-y-2.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                                  <Tag className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                                  Expected Budget Allocation
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {budgetData.categoryBreakdown.map((cat, idx) => {
                                    const percent = budgetData.totalBudget > 0 ? Math.round((Number(cat.planned) / Number(budgetData.totalBudget)) * 100) : 0;
                                    return (
                                      <div key={idx} className="bg-slate-50/70 border border-slate-100/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm space-y-2.5">
                                        <div className="flex justify-between items-center w-full">
                                          <span className="text-xs font-bold text-slate-700">{cat.category}</span>
                                          <span className="text-xs font-black text-slate-900">
                                            {formatCurrency(cat.planned, tripCurrency.code || tripCurrency).formatted}
                                          </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }} />
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 block">{percent}% of total budget</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : activeDayTab === 'packing' ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                            <CheckSquare className="h-4 w-4 mr-1 text-amber-500" />
                            <span>AI Packing Checklist Assistant</span>
                          </span>
                        </div>
                        {packingLoading ? (
                          <div className="flex flex-col items-center justify-center py-12 space-y-2">
                            <div className="h-6 w-6 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-slate-400">Customizing your packing list...</span>
                          </div>
                        ) : packingList.length === 0 ? (
                          <p className="text-slate-400 text-xs text-center py-8">Failed to generate packing list.</p>
                        ) : (() => {
                          const totalItems = packingList.reduce((acc, cat) => acc + cat.items.length, 0);
                          const checkedItems = packingList.reduce((acc, cat) => acc + cat.items.filter(i => i.checked).length, 0);
                          const percentCompleted = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
                          return (
                            <div className="space-y-6">
                              {/* Progress bar */}
                              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Checklist Progress</span>
                                  <span className="text-xs font-black text-amber-800">{checkedItems} / {totalItems} items ({percentCompleted}%)</span>
                                </div>
                                <div className="w-full h-2.5 bg-amber-100/50 rounded-full overflow-hidden border border-amber-200/30">
                                  <div className="h-full bg-amber-500 rounded-full transition-all duration-550 ease-out" style={{ width: `${percentCompleted}%` }} />
                                </div>
                              </div>
                              {packingList.map((cat, catIdx) => (
                                <div key={catIdx} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                                    {cat.category}
                                  </h4>
                                  <div className="space-y-2.5">
                                    {cat.items.map((item, itemIdx) => (
                                      <label
                                        key={itemIdx}
                                        className={`flex items-start space-x-3 p-3 rounded-xl border bg-white cursor-pointer select-none transition ${item.checked
                                          ? 'border-emerald-100 bg-emerald-50/10 text-slate-400'
                                          : 'border-slate-100 hover:border-slate-200 text-slate-800'
                                          }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={item.checked || false}
                                          onChange={() => handleTogglePackingItem(catIdx, itemIdx)}
                                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500/40 focus:ring-offset-0 focus:ring-2 cursor-pointer"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-baseline justify-between gap-2">
                                            <span className={`text-xs font-bold ${item.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                              {item.name}
                                            </span>
                                            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full shrink-0">
                                              Qty: {item.quantity}
                                            </span>
                                          </div>
                                          {item.reason && (
                                            <p className={`text-[10px] mt-0.5 leading-relaxed ${item.checked ? 'text-slate-300' : 'text-slate-400'}`}>
                                              {item.reason}
                                            </p>
                                          )}
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
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
                    ) : activeDayTab === 'events' ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-indigo-500" />
                            <span>Local Events Calendar ({localEvents.length})</span>
                          </span>
                          {localEvents.length > 0 && (
                            <span className="bg-indigo-50 text-indigo-605 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {localEvents.length}
                            </span>
                          )}
                        </div>
                        {localEventsLoading ? (
                          <div className="flex flex-col items-center justify-center py-12 space-y-2">
                            <div className="h-6 w-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-slate-400">Discovering events...</span>
                          </div>
                        ) : localEvents.length === 0 ? (
                          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 text-center">
                            <Calendar className="h-8 w-8 text-indigo-300 mx-auto mb-3 animate-bounce" />
                            <p className="text-sm text-slate-505">No events found for these dates</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {localEvents.map((event, idx) => {
                              const isFav = favorites.some(fav => fav.name.toLowerCase().trim() === event.title.toLowerCase().trim());
                              return (
                                <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between relative group">
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="text-xs font-bold text-slate-800 mb-1">{event.title}</h4>
                                      <button
                                        onClick={() => handleToggleFavorite({
                                          name: event.title,
                                          type: 'event',
                                          description: event.description,
                                          location: event.location,
                                          category: event.category
                                        })}
                                        className="p-1 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition cursor-pointer shrink-0"
                                        title="Toggle Favorite"
                                      >
                                        <Heart className={`h-3.5 w-3.5 transition-colors ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                                      </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                      <span className="inline-flex items-center text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                        <Calendar className="h-2.5 w-2.5 mr-0.5 text-slate-400" />
                                        {event.date}
                                      </span>
                                      <span className="inline-flex items-center text-[9px] font-medium text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded">
                                        {event.category}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-3">{event.description}</p>
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center space-x-1 mt-3 pt-2.5 border-t border-slate-50 text-[9px] text-slate-400">
                                      <MapPin className="h-3 w-3 text-slate-400" />
                                      <span className="truncate">{event.location}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      getDayItineraries(selectedTrip).length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-8">No activities scheduled for this day.</p>
                      ) : (
                        <div className="space-y-6">
                          {(() => {
                            const activeDayList = getDayItineraries(selectedTrip);
                            return activeDayList.map((item, idx) => {
                              const isFav = favorites.some(fav =>
                                fav.name.toLowerCase().trim() === (item.location || '').toLowerCase().trim() ||
                                fav.name.toLowerCase().trim() === (item.activity || '').toLowerCase().trim()
                              );
                              return (
                                <ActivityCard
                                  key={item.id || idx}
                                  item={item}
                                  tripCurrency={tripCurrency}
                                  isFavorited={isFav}
                                  onToggleFavorite={() => handleToggleFavorite(item)}
                                  onMoveUp={idx > 0 && !selectedTrip.isPrePlanned ? () => handleMoveActivity(idx, 'up') : null}
                                  onMoveDown={idx < activeDayList.length - 1 && !selectedTrip.isPrePlanned ? () => handleMoveActivity(idx, 'down') : null}
                                  onEdit={() => { setEditingActivity(item); setAiSuggestions([]); }}
                                />
                              );
                            });
                          })()}
                        </div>
                      )
                    )}
                  </div>

                  <div className={`w-full md:w-5/12 bg-slate-50/50 p-4 flex flex-col flex-1 md:flex-initial md:h-auto border-t md:border-t-0 border-slate-100 pb-20 md:pb-4 ${mobileViewMode === 'map' ? 'flex' : 'hidden md:flex'}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-rose-500" />
                      <span>{activeDayTab === 'nearby' ? 'Nearby Attractions (100 km)' : activeDayTab === 'events' ? 'Local Events Route Map' : activeDayTab === 'budget' ? 'Budget Area Map' : activeDayTab === 'packing' ? 'Packing Area Map' : activeDayTab === 'favorites' ? 'Saved Favorites Map' : `Day ${activeDayTab} Landmark Route`}</span>
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
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2 z-10 pb-20 md:pb-4">
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

                {/* Mobile View Toggle */}
                <div className="md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-55 flex items-center bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-lg border border-slate-800 dark:border-slate-800/80 rounded-full shadow-2xl p-1.5 w-[280px]">
                  <button
                    type="button"
                    onClick={() => setMobileViewMode('list')}
                    className={`flex-1 py-2.5 rounded-full text-xs font-extrabold transition-all duration-300 flex items-center justify-center space-x-2 whitespace-nowrap ${mobileViewMode === 'list' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <TripIcon className="h-4 w-4" />
                    <span>Timeline</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileViewMode('map')}
                    className={`flex-1 py-2.5 rounded-full text-xs font-extrabold transition-all duration-300 flex items-center justify-center space-x-2 whitespace-nowrap ${mobileViewMode === 'map' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Map View</span>
                  </button>
                </div>
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

      {/* Edit Activity Modal with AI Suggestions */}
      <AnimatePresence>
        {editingActivity && (() => {
          const tripCurrency = getSelectedTripCurrency();
          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Edit className="h-5 w-5 text-rose-500" />
                    <span>Edit Activity Details</span>
                  </h3>
                  <button
                    onClick={() => setEditingActivity(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                  {/* Basic Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Time</label>
                      <input
                        type="text"
                        value={editingActivity.time || ''}
                        onChange={(e) => setEditingActivity({ ...editingActivity, time: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-rose-400 focus:outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-505 mb-1">Estimated Cost ({tripCurrency.symbol})</label>
                      <input
                        type="number"
                        value={editingActivity.estimatedCost || editingActivity.estimated_cost || 0}
                        onChange={(e) => setEditingActivity({ ...editingActivity, estimatedCost: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-rose-400 focus:outline-none dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-505 mb-1">Location / Landmark</label>
                    <input
                      type="text"
                      value={editingActivity.location || ''}
                      onChange={(e) => setEditingActivity({ ...editingActivity, location: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-rose-400 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-505 mb-1">Activity / Plan Details</label>
                    <textarea
                      value={editingActivity.activity || ''}
                      onChange={(e) => setEditingActivity({ ...editingActivity, activity: e.target.value })}
                      rows={3}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-rose-400 focus:outline-none dark:text-white"
                    />
                  </div>

                  {/* AI Section */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center">
                        <Sparkles className="h-4 w-4 mr-1 animate-pulse" />
                        <span>AI Alternatives (Xplorism AI)</span>
                      </span>
                      <button
                        type="button"
                        onClick={fetchAISuggestions}
                        disabled={aiLoading}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold transition flex items-center space-x-1 disabled:opacity-50 cursor-pointer border-none"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Thinking...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3" />
                            <span>Ask Xplorism AI</span>
                          </>
                        )}
                      </button>
                    </div>

                    {aiSuggestions.length > 0 && (
                      <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                        {aiSuggestions.map((sug, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setEditingActivity({
                                ...editingActivity,
                                location: sug.location,
                                activity: sug.activity,
                                estimatedCost: sug.estimatedCost
                              });
                            }}
                            className="p-3 bg-rose-50/30 hover:bg-rose-50/70 border border-rose-100/50 dark:bg-slate-800 dark:border-slate-750 dark:hover:bg-slate-800/80 rounded-2xl cursor-pointer transition text-left group/sug"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover/sug:text-rose-600 transition truncate">{sug.location}</h4>
                              <span className="text-[10px] font-black text-rose-500">{formatCurrency(sug.estimatedCost, tripCurrency.code || tripCurrency).formatted}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{sug.activity}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3 bg-slate-50/50 dark:bg-slate-900/50 p-4 -mx-6 -mb-6 rounded-b-3xl">
                  <button
                    onClick={() => setEditingActivity(null)}
                    className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-750 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateActivity(editingActivity);
                      setEditingActivity(null);
                    }}
                    className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Edit Trip Details Modal */}
      <AnimatePresence>
        {showEditTripModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-rose-500" />
                  <span>Edit Trip Details</span>
                </h3>
                <button
                  onClick={() => setShowEditTripModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTripDetails} className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={editTripForm.startDate}
                      onChange={(e) => setEditTripForm({ ...editTripForm, startDate: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-rose-400 focus:outline-none dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-505 mb-1">End Date</label>
                    <input
                      type="date"
                      value={editTripForm.endDate}
                      onChange={(e) => setEditTripForm({ ...editTripForm, endDate: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-rose-400 focus:outline-none dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-505 mb-1">Travelers</label>
                    <input
                      type="number"
                      min="1"
                      value={editTripForm.travelers}
                      onChange={(e) => setEditTripForm({ ...editTripForm, travelers: parseInt(e.target.value) || 1 })}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-rose-400 focus:outline-none dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-505 mb-1">Budget ({getSelectedTripCurrency().symbol})</label>
                    <input
                      type="number"
                      min="0"
                      value={editTripForm.budget}
                      onChange={(e) => setEditTripForm({ ...editTripForm, budget: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-rose-400 focus:outline-none dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3 bg-slate-50/50 dark:bg-slate-900/50 p-4 -mx-6 -mb-6 rounded-b-3xl">
                  <button
                    type="button"
                    onClick={() => setShowEditTripModal(false)}
                    className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-750 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
            className={`fixed bottom-36 right-6 z-[9999] flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 ${toast.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
              : 'bg-rose-50/95 border-rose-200 text-rose-800'
              }`}
          >
            <span className="text-xs font-bold tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWeatherPopup && selectedTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-secondary)' }}>
                <div className="flex items-center space-x-2">
                  <CloudSun className="h-5 w-5 text-rose-500" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--text-primary)]">Weather Forecast</h3>
                </div>
                <button
                  onClick={() => setShowWeatherPopup(false)}
                  className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-450 hover:text-rose-500 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 text-left overflow-y-auto">
                <div className="text-center pb-2">
                  <h4 className="text-lg font-black text-[var(--text-primary)]">{selectedTrip.destination}</h4>
                  <p className="text-xs text-[var(--text-secondary)]">3-Day Trip Outlook</p>
                </div>

                <div className="space-y-4">
                  {get3DayForecast(selectedTrip.destination, selectedTrip.startDate).map((dayForecast, idx) => {
                    const WeatherIcon = dayForecast.condition === 'Sunny' ? Sun : dayForecast.condition === 'Cloudy' ? Cloud : dayForecast.condition === 'Rainy' ? CloudRain : dayForecast.condition === 'Snowy' ? Snowflake : Wind;
                    const dateFormatted = dayForecast.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border flex items-center justify-between bg-[var(--bg-tertiary)] border-[var(--border-primary)] shadow-sm"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-black text-[var(--text-primary)]">{dateFormatted}</p>
                          <p className="text-[11px] text-[var(--text-secondary)] italic">{dayForecast.desc}</p>
                        </div>
                        <div className="flex items-center space-x-3.5">
                          <div className="text-right">
                            <p className="text-base font-black text-[var(--text-primary)]">{dayForecast.temp}°C</p>
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{dayForecast.condition}</p>
                          </div>
                          <div className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center">
                            <WeatherIcon className={`h-5 w-5 ${dayForecast.condition === 'Sunny' ? 'text-amber-500' : dayForecast.condition === 'Rainy' ? 'text-blue-500' : 'text-slate-400'}`} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Additional metrics box */}
                <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                  <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-1">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Humidity</p>
                    <p className="text-xs font-black text-[var(--text-primary)]">65%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-1">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Wind</p>
                    <p className="text-xs font-black text-[var(--text-primary)]">14 km/h</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-1">
                    <p className="text-[9px] uppercase font-bold text-slate-400">UV Index</p>
                    <p className="text-xs font-black text-[var(--text-primary)]">4 Mod</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInviteModal && selectedTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border shadow-2xl p-6 relative flex flex-col text-left"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              <button
                onClick={() => setShowInviteModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-[var(--text-primary)] transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-3 mb-4 text-rose-505">
                <UserPlus className="h-6 w-6" />
                <h3 className="text-lg font-black text-[var(--text-primary)] font-sans">Invite Collaborator</h3>
              </div>

              <p className="text-[var(--text-secondary)] text-xs mb-6 leading-relaxed">
                Enter the registered email address of the person you want to invite to this trip.
              </p>

              <form onSubmit={handleAddCollaborator} className="space-y-4 font-sans">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block mb-1.5">User Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="e.g. companion@example.com"
                    required
                    disabled={inviteLoading}
                    className="w-full px-3.5 py-3 rounded-xl text-sm border focus:outline-none focus:border-rose-500/40"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-3 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)] text-xs font-bold transition cursor-pointer"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading || !inviteEmail.trim()}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold transition shadow-lg shadow-rose-500/10 cursor-pointer"
                  >
                    {inviteLoading ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Premium Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-transparent"
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl p-6 z-10"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-2xl flex-shrink-0 ${confirmDialog.type === 'danger'
                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-500'
                  }`}>
                  <Trash2 className="h-6 w-6" />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-black tracking-tight mb-2">
                    {confirmDialog.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {confirmDialog.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)] text-xs font-bold transition cursor-pointer"
                  style={{ borderColor: 'var(--border-primary)' }}
                >
                  {confirmDialog.cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-lg cursor-pointer ${confirmDialog.type === 'danger'
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/10'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/10'
                    }`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

