import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// Base English dictionary used as standard source text for Google Translate
const baseEnglish = {
  // Navbar
  trips: 'Trips',
  shared_trips: 'Shared Trips',
  weather: 'Weather',
  tracker: 'Tracker',
  hotels: 'Bookings',
  budgets: 'Budgets',
  logged_in_as: 'Logged in as',
  profile: 'Profile',
  logout: 'Log Out',
  light_mode: 'Light Mode',
  dark_mode: 'Dark Mode',
  vault: 'Vault',
  community: 'Community',
  sign_in: 'Sign In',
  sign_up: 'Sign Up',
  go_to_dashboard: 'Go to Dashboard',
  get_started_free: "Get Started, It's Free",
  scroll_down_planner: 'Scroll down to open your planner',

  // Sky Radar / Tracker Page
  live_tracker: 'Live Aviation Radar',
  sky_radar: 'Sky Radar',
  live_api: 'Live',
  simulated_radar: 'Simulated Radar',
  tracked: 'Tracked',
  avg_speed: 'Avg Speed',
  avg_altitude: 'Avg Alt',
  search_placeholder: 'Search flight no. or country...',
  scanning_skies: 'Ingesting live ADS-B state vectors from international airspace...',
  error_connecting: 'Airspace data link interrupted. Retrying live telemetry feed in 8s...',
  try_again: 'Try again',
  next_update: 'Next update in',
  full_map: 'Full Map',
  show_radar_list: 'Show Radar List',
  en_route: 'EN ROUTE',
  origin: 'Origin',
  dest: 'Dest',
  heading: 'Heading',
  speed: 'Speed',
  altitude: 'Altitude',
  vrate: 'V-Rate',
  legend_title: 'Altitude Legend',
  legend_cruising: 'Cruising (> 30,000 ft)',
  legend_transition: 'Transition (10,000 - 30,000 ft)',
  legend_approach: 'Approach/Takeoff (< 10,000 ft)',
  legend_selected: 'Selected Aircraft',

  // Dashboard / Trips Page
  travel_hub: 'Personal Travel Hub',
  dashboard_title: 'My Trips Dashboard',
  dashboard_desc: 'Coordinate group schedules, monitor active trips, and manage multi-currency travel budgets.',
  create_new_trip: 'Create New Trip',
  recommended_trips: 'Curated Signature Journeys',
  days_schedule: 'Days Custom Schedule',
  travelers: 'Travelers',
  my_saved_itineraries: 'My Saved Itineraries',
  loading_saved: 'Syncing saved itineraries...',
  no_trips: 'Ready for your next journey?',
  get_started: 'Explore curated sample routes like our Tokyo Food Tour or launch the itinerary studio to build from scratch.',
  start_planning: 'Start Planning',
  day: 'day',
  days: 'days',
  budget_label: 'Budget',
  my_travel_journey: 'My Travel Journey',
  total_spend: 'Total Spend',
  regions_visited: 'Regions Visited',
  destinations_count: 'Destinations',
  destination_count: 'Destination',
  days_traveled: 'Days Traveled',
  days_unit: 'Days',
  travel_vibe: 'Travel Vibe',
  passport_stamp_collection: 'Passport Stamp Collection',
  passport_stamp_subtitle: 'Every trip planned adds a stamp to your digital passport.',
  stamps_label: 'Stamps',
  passport_empty_title: 'Your passport is empty',
  passport_empty_desc: 'Add your very first trip to start collecting visual destination stamps!',
  travel_milestones_title: 'Travel Milestones & Achievements',
  travel_milestones_subtitle: 'Explore more to unlock unique travel badges and track your achievements.',
  unlocked_label: 'Unlocked',
  locked_label: 'Locked',
  goal_label: 'Goal',
  daily_vibe: 'Daily Inspiration',
  wanderlust_quotes: 'Travel Perspectives',
  grid_view: 'Grid View',
  map_view: 'Map View',
  ask_xplorism_ai: 'Trip Concierge',
  online_assistant: '24/7 Travel Specialist',
  chat_welcome_title: 'Hi',
  chat_welcome_subtitle: 'I can curate custom itineraries, check weather forecasts, structure budgets, and uncover hidden local spots. Where are we traveling next?',
  chat_placeholder: 'Ask about destinations, routes, packing...',
  regenerate_response: 'Regenerate response',
  clear_conversation: 'Clear conversation',
  thinking: 'Thinking...',
  login_to_chat: 'Login to Start Chatting',
  chat_guest_desc: 'Your personal trip concierge is ready to help craft customized itineraries, discover local gems, and plan your journey.',
  delete_chat_title: 'Delete Chat',
  delete_chat_confirm: 'Are you sure you want to permanently delete this chat? This action cannot be undone.',
  cancel_action: 'Cancel',
  delete_action: 'Delete',
  deleting_action: 'Deleting...',

  // Profile Page
  account_settings: 'Account & Preferences',
  profile_title: 'User Profile',
  profile_desc: 'Manage your account settings, preferences, and view your stats.',
  back_to_dashboard: 'Back to Dashboard',
  joined: 'Joined',
  google_account_linked: 'Google Account Linked',
  log_out_session: 'Log Out of Session',
  travel_stats: 'Your Travel Stats',
  trips_planned: 'Trips Planned',
  total_itineraries: 'Total itineraries generated',
  favorites: 'Favorites',
  saved_locations: 'Saved locations & hotels',
  total_estimated_budget: 'Total Estimated Budget',
  total_spent: 'Combined value of planned trips',
  account_details: 'Account Details',
  full_name: 'Full Name',
  email_address: 'Email Address',
  change_password_label: 'Change Password',
  new_password_label: 'New Password',
  confirm_new_password_label: 'Confirm New Password',
  security_checklist: 'Security Checklist',
  travel_preferences_title: 'Travel Preferences',
  preferred_style: 'Preferred Travel Style',
  preferred_currency: 'Preferred Currency',
  email_notifications: 'Email Notifications',
  recommendations_desc: 'Recommendations and trip reminders',
  weekly_digest: 'Weekly Digest',
  curated_news_desc: 'Curated newsletters and travel deals',
  favorite_themes: 'Favorite Travel Themes',
  save_preferences: 'Save Preferences',
  save_changes: 'Save Changes',

  // Travel Styles Options
  style_adventure: 'Adventure & Exploring',
  style_leisure: 'Relaxation & Leisure',
  style_balanced: 'Balanced Mix',
  style_budget: 'Budget Backpacking',
  style_culinary: 'Culinary & Culture',

  // Weather Page
  climate_radar: 'Climate & Atmosphere',
  global_weather_forecast: 'Global Weather Forecast',
  weather_desc: 'Check real-time climates before booking your next journey.',
  search_city_placeholder: 'Search city, e.g. New York, London, Tokyo...',
  gathering_forecasts: 'Gathering local atmospheric forecasts...',
  feels_like: 'Feels Like',
  humidity_label: 'Humidity',
  wind_speed_label: 'Wind Speed',
  extended_outlook: 'Extended 7-Day Outlook',
  today: 'Today',
  discover_climates: 'Discover Global Climates',
  discover_climates_desc: 'Enter any city in the search bar above to map its atmospheric conditions and retrieve 7-day weather forecasts.',
  powered_by: 'Climate data powered by Open-Meteo.',

  // Weather Codes Options
  weather_clear_sky: 'Clear Sky',
  weather_mainly_clear: 'Mainly Clear',
  weather_partly_cloudy: 'Partly Cloudy',
  weather_overcast: 'Overcast',
  weather_foggy: 'Foggy',
  weather_rime_fog: 'Depositing Rime Fog',
  weather_light_drizzle: 'Light Drizzle',
  weather_moderate_drizzle: 'Moderate Drizzle',
  weather_dense_drizzle: 'Dense Drizzle',
  weather_slight_rain: 'Slight Rain',
  weather_moderate_rain: 'Moderate Rain',
  weather_heavy_rain: 'Heavy Rain',
  weather_slight_snow: 'Slight Snowfall',
  weather_moderate_snow: 'Moderate Snowfall',
  weather_heavy_snow: 'Heavy Snowfall',
  weather_slight_showers: 'Slight Rain Showers',
  weather_moderate_showers: 'Moderate Rain Showers',
  weather_violent_showers: 'Violent Rain Showers',
  weather_thunderstorm: 'Thunderstorm',
  weather_thunder_hail: 'Thunderstorm with Hail',
  weather_heavy_thunder: 'Heavy Thunderstorm',

  // Budgets List Page
  financial_overview: 'Financial Overview',
  my_saved_budgets: 'My Saved Budgets',
  budgets_desc: 'Monitor, track expenses, and manage budgets across all your saved itineraries.',
  aggregating_budgets: 'Aggregating budget calculations...',
  no_budgets: 'No itineraries budget logged',
  no_budgets_desc: 'Create and save a custom trip itinerary first to track real-time budgets and log expenses.',
  budget_limit: 'Limit',
  budget_spent: 'Spent',
  budget_utilization: 'Utilization',
  allocation_breakdown: 'Allocation Breakdown',
  edit_log_expenses: 'Edit & Log Expenses',

  // Categories Options
  category_accommodation: 'Accommodation',
  category_food_dining: 'Food & Dining',
  category_activities_tours: 'Activities & Tours',
  category_transportation: 'Transportation',
  category_shopping: 'Shopping',
  category_miscellaneous: 'Miscellaneous',

  // Budget Details Page
  budget_tracker: 'Budget Tracker',
  date_schedule: 'Date Schedule',
  traveler: 'Traveler',
  starting_budget: 'Starting Budget',
  calculating_breakdowns: 'Calculating planned breakdowns...',
  no_budget_data: 'No budget data available',
  no_budget_data_desc: "We couldn't compute budget trackers for this itinerary.",
  budget_planned: 'Planned',
  tracked_expenses_desc: 'Real-time tracked expenses',
  remaining_funds: 'Remaining',
  leftover_funds: 'Leftover funds',
  utilization_progress: 'Budget Utilization Progress',
  utilization_progress_desc: 'Shows current spend relative to total budget limit',
  add_new_expense: 'Log New Expense',
  category_label: 'Category',
  item_name_label: 'Item Name',
  date_label: 'Date',
  notes_label: 'Notes (optional)',
  planned_cost: 'Planned Amount',
  actual_spent: 'Actual Spent *',
  actions: 'Actions',
  no_expenses_logged: 'No actual expenses logged yet.',
  add_first_expense_desc: 'Click Add New Expense to start logging real-time costs.',
  item: 'item',
  items: 'items',
  of: 'of',
  save_expense: 'Save Expense',
  expense_history: 'Expense History',
  item_placeholder: 'e.g. Dinner at Bistro',
  notes_placeholder: 'Any additional details',
  cancel: 'Cancel',

  // Toast Notifications
  toast_trip_not_found: 'Trip not found',
  toast_load_trip_fail: 'Failed to load trip details.',
  toast_load_budget_fail: 'Failed to load budget details.',
  toast_fill_fields: 'Please fill in amount and date.',
  toast_expense_added: 'Expense added successfully!',
  toast_add_expense_fail: 'Failed to add expense.',
  toast_expense_updated: 'Expense updated successfully!',
  toast_update_expense_fail: 'Failed to update expense.',
  toast_expense_deleted: 'Expense deleted.',
  toast_delete_expense_fail: 'Failed to delete expense.',
  toast_load_itineraries_fail: 'Failed to load saved itineraries.',
  toast_save_trip_success: 'Pre-planned itinerary saved to your trips!',
  toast_save_trip_fail: 'Failed to save trip.',

  // Vault Page
  secure_storage: 'Encrypted Storage',
  vault_title: 'Document Vault',
  vault_subtitle: 'Securely store and manage your essential travel documents.',
  add_document: 'Add Document',
  expiry_warning: 'Expires soon!',
  expired: 'Expired!',
  passport: 'Passport',
  visa: 'Visa',
  ticket: 'Ticket',
  hotel_voucher: 'Hotel Voucher',
  insurance: 'Insurance',
  other: 'Other',
  doc_number: 'Document Number',
  expiry_date: 'Expiry Date',
  notes: 'Notes / Details',
  file_upload: 'Upload File',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  download: 'Download',
  confirm_delete: 'Are you sure you want to delete this document?',
  no_documents: 'No documents stored in your vault. Start by adding one!',

  // Community Feed Page
  community_feed: 'Explorers Social Feed',
  community_subtitle: 'Share logs, highlight moments, and interact with co-travelers from all over the world.',
  share_experience: 'Share Experience',
  search_posts_placeholder: 'Search posts by tags, user, or keywords...',
  no_stories_title: 'No stories shared yet',
  no_stories_desc: 'Be the first traveler to write a log and post pictures about your adventures!',
  start_writing: 'Start Writing',
  loading_social_logs: 'Loading social logs...',
  edit_experience: 'Edit Experience',
  share_an_experience: 'Share an Experience',
  experience_title: 'Experience Title',
  hashtags: 'Hashtags',
  type_tag_placeholder: 'Type tag & press Space/Enter',
  add_more: 'add more...',
  tell_story: 'Tell the story',
  tell_story_placeholder: 'Tell us what you experienced, cost-saving tips, or highlights...',
  add_photos_label: 'Add Highlight Photos (Max 5)',
  upload_trip_pictures: 'Upload Trip Pictures',
  upload_trip_pictures_sub: 'Supports multiple images (Max 5, 8MB each)',
  publishing: 'Publishing...',
  post_experience: 'Post Experience',
  confirm_delete_post: 'Are you sure you want to delete this post?',
  likes: 'Likes',
  toast_post_deleted: 'Post deleted successfully',
  deleting: 'Deleting...',

  // Footer
  footer_slogan: 'Unified travel intelligence. Real-time aviation telemetry, collaborative itinerary workspaces, and multi-currency cost management.',
  features_title: 'Features',
  resources_title: 'Resources',
  stay_updated: 'Stay Updated',
  itinerary_builder: 'Itinerary Builder',
  interactive_map: 'Interactive Map',
  weather_forecast: 'Weather Forecast',
  budget_manager: 'Budget Manager',
  document_vault: 'Document Vault',
  travel_guides: 'Travel Guides',
  help_center: 'Help Center',
  community_feed_footer: 'Community Feed',
  terms_of_service: 'Terms of Service',
  privacy_policy: 'Privacy Policy',
  cookie_settings: 'Cookie Settings',
  newsletter_desc: 'Subscribe to our newsletter for the latest travel guides, tips, and feature updates.',
  email_placeholder: 'Enter your email',
  subscribe: 'Subscribe',
  all_rights_reserved: 'All rights reserved.'
};

// Supported Languages list: Indian regional languages + Global International languages
export const INDIAN_LANGUAGES = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil' },
  { code: 'mr', native: 'मराठी', english: 'Marathi' },
  { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati' },
  { code: 'kn', native: 'ಕನ್ನಡ', english: 'Kannada' },
  { code: 'ml', native: 'മലയാളം', english: 'Malayalam' },
  { code: 'or', native: 'ଓଡ଼ିଆ', english: 'Odia' },
  { code: 'ur', native: 'اردو', english: 'Urdu' }
];

export const INTERNATIONAL_LANGUAGES = [
  { code: 'es', native: 'Español', english: 'Spanish' },
  { code: 'fr', native: 'Français', english: 'French' },
  { code: 'de', native: 'Deutsch', english: 'German' },
  { code: 'ar', native: 'العربية', english: 'Arabic' },
  { code: 'pt', native: 'Português', english: 'Portuguese' },
  { code: 'it', native: 'Italiano', english: 'Italian' },
  { code: 'ru', native: 'Русский', english: 'Russian' },
  { code: 'ja', native: '日本語', english: 'Japanese' },
  { code: 'ko', native: '한국어', english: 'Korean' },
  { code: 'zh-CN', native: '简体中文', english: 'Chinese (Simplified)' },
  { code: 'tr', native: 'Türkçe', english: 'Turkish' }
];

export const SUPPORTED_LANGUAGES = [
  ...INDIAN_LANGUAGES,
  ...INTERNATIONAL_LANGUAGES
];

export function getActiveLanguage() {
  try {
    // 1. Check googtrans cookie: format is usually /en/<code> or /auto/<code>
    const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
    if (match && match[1]) {
      const parts = decodeURIComponent(match[1]).split('/');
      const code = parts[parts.length - 1];
      if (code && SUPPORTED_LANGUAGES.some(l => l.code === code)) {
        return code;
      }
    }
    // 2. Check localStorage
    const saved = localStorage.getItem('language');
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      return saved;
    }
  } catch (err) {
    console.warn('Error reading active language:', err);
  }
  return 'en';
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getActiveLanguage);

  // Helper to set googtrans cookie across both root path and domain
  const setGoogleTranslateCookie = (targetLang) => {
    try {
      const cookieValue = targetLang === 'en' ? '' : `/en/${targetLang}`;
      const expires = targetLang === 'en' ? 'Thu, 01 Jan 1970 00:00:00 GMT' : 'Fri, 31 Dec 2099 23:59:59 GMT';
      const hostname = window.location.hostname;

      // Set cookie on current path & root path
      document.cookie = `googtrans=${cookieValue}; path=/; expires=${expires}`;
      document.cookie = `googtrans=${cookieValue}; path=/; domain=${hostname}; expires=${expires}`;

      // If domain has multiple segments, also set on root domain
      const hostParts = hostname.split('.');
      if (hostParts.length > 2) {
        const rootDomain = '.' + hostParts.slice(-2).join('.');
        document.cookie = `googtrans=${cookieValue}; path=/; domain=${rootDomain}; expires=${expires}`;
      }
    } catch (e) {
      console.warn('Could not set googtrans cookie:', e);
    }
  };

  // Programmatically trigger Google Translate combo selection
  const triggerGoogleTranslateCombo = (targetLang) => {
    const trigger = () => {
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        if (combo.value !== targetLang) {
          combo.value = targetLang;
          combo.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return true;
      }
      return false;
    };

    // Try immediately, or retry if script is still loading
    if (!trigger()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (trigger() || attempts >= 25) {
          clearInterval(interval);
        }
      }, 200);
    }
  };

  const setLanguage = (newLang) => {
    if (!newLang) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem('language', newLang);
    } catch (e) {
      console.warn(e);
    }
    setGoogleTranslateCookie(newLang);
    triggerGoogleTranslateCombo(newLang);
  };

  // Keep state synchronized with googtrans cookie / storage changes
  useEffect(() => {
    const syncActiveLang = () => {
      const current = getActiveLanguage();
      setLanguageState(prev => (prev !== current ? current : prev));
    };

    window.addEventListener('focus', syncActiveLang);
    return () => window.removeEventListener('focus', syncActiveLang);
  }, []);

  // Load Google Translate script and initialize hidden element cleanly on mount
  useEffect(() => {
    // 1. Ensure hidden mount container exists
    let translateDiv = document.getElementById('google_translate_element');
    if (!translateDiv) {
      translateDiv = document.createElement('div');
      translateDiv.id = 'google_translate_element';
      translateDiv.style.display = 'none';
      translateDiv.style.visibility = 'hidden';
      translateDiv.style.position = 'absolute';
      translateDiv.style.top = '-9999px';
      translateDiv.setAttribute('aria-hidden', 'true');
      translateDiv.classList.add('notranslate');
      document.body.appendChild(translateDiv);
    }

    // 2. Global init callback for Google Translate
    window.googleTranslateElementInit = () => {
      try {
        if (window.google && window.google.translate && window.google.translate.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: SUPPORTED_LANGUAGES.map(l => l.code).join(','),
              autoDisplay: false
            },
            'google_translate_element'
          );

          // Once initialized, apply current language if set
          const active = getActiveLanguage();
          if (active && active !== 'en') {
            setGoogleTranslateCookie(active);
            triggerGoogleTranslateCombo(active);
          }
        }
      } catch (err) {
        console.warn('Google Translate initialization error:', err);
      }
    };

    // 3. Inject script safely avoiding duplicate injections
    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else if (window.google && window.google.translate) {
      window.googleTranslateElementInit();
    }

    // 4. MutationObserver to prevent Google Translate from adding inline 'top' style to body/html
    const observer = new MutationObserver(() => {
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.top = '0px';
      }
      if (document.documentElement.style.top && document.documentElement.style.top !== '0px') {
        document.documentElement.style.top = '0px';
      }
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Standard string resolver - returns English text for Google Translate to translate automatically
  const t = (key) => {
    return baseEnglish[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
