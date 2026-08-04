import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Navbar
    trips: 'Trips',
    weather: 'Weather',
    tracker: 'Tracker',
    hotels: 'Hotels',
    budgets: 'Budgets',
    logged_in_as: 'Logged in as',
    profile: 'Profile',
    logout: 'Log Out',
    light_mode: 'Light Mode',
    dark_mode: 'Dark Mode',
    
    // Tracker Page
    sky_radar: 'Sky Radar',
    live_api: 'Live API',
    simulated_radar: 'Simulated Radar',
    tracked: 'Tracked',
    avg_speed: 'Avg Speed',
    avg_altitude: 'Avg Alt',
    search_placeholder: 'Search flight no. or country...',
    scanning_skies: 'Scanning skies for aircraft...',
    error_connecting: 'Unable to connect to flight server. Retrying...',
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
    legend_selected: 'Selected Aircraft'
  },
  es: {
    // Navbar
    trips: 'Viajes',
    weather: 'Clima',
    tracker: 'Rastreador',
    hotels: 'Hoteles',
    budgets: 'Presupuestos',
    logged_in_as: 'Conectado como',
    profile: 'Perfil',
    logout: 'Cerrar Sesión',
    light_mode: 'Modo Claro',
    dark_mode: 'Modo Oscuro',
    
    // Tracker Page
    sky_radar: 'Radar del Cielo',
    live_api: 'API en Vivo',
    simulated_radar: 'Radar Simulado',
    tracked: 'Rastreados',
    avg_speed: 'Vel. Promedio',
    avg_altitude: 'Alt. Promedio',
    search_placeholder: 'Buscar vuelo o país...',
    scanning_skies: 'Escaneando los cielos...',
    error_connecting: 'Error al conectar con el servidor de vuelo. Reintentando...',
    try_again: 'Intentar de nuevo',
    next_update: 'Próxima actualización en',
    full_map: 'Mapa Completo',
    show_radar_list: 'Mostrar Lista',
    en_route: 'EN RUTA',
    origin: 'Origen',
    dest: 'Destino',
    heading: 'Rumbo',
    speed: 'Velocidad',
    altitude: 'Altitud',
    vrate: 'Tasa Vertical',
    legend_title: 'Leyenda de Altitud',
    legend_cruising: 'Crucero (> 30,000 ft)',
    legend_transition: 'Transición (10k - 30k ft)',
    legend_approach: 'Despegue/Aterrizaje (< 10k ft)',
    legend_selected: 'Aeronave Seleccionada'
  },
  fr: {
    // Navbar
    trips: 'Voyages',
    weather: 'Météo',
    tracker: 'Radar',
    hotels: 'Hôtels',
    budgets: 'Budgets',
    logged_in_as: 'Connecté en tant que',
    profile: 'Profil',
    logout: 'Déconnexion',
    light_mode: 'Mode Clair',
    dark_mode: 'Mode Sombre',
    
    // Tracker Page
    sky_radar: 'Radar Aérien',
    live_api: 'API en Direct',
    simulated_radar: 'Radar Simulé',
    tracked: 'Suivis',
    avg_speed: 'Vitesse Moy.',
    avg_altitude: 'Alt. Moyenne',
    search_placeholder: 'Rechercher un vol ou un pays...',
    scanning_skies: 'Scan du ciel en cours...',
    error_connecting: 'Impossible de se connecter au serveur. Re-tentative...',
    try_again: 'Réessayer',
    next_update: 'Mise à jour dans',
    full_map: 'Plein Écran',
    show_radar_list: 'Afficher la Liste',
    en_route: 'EN VOL',
    origin: 'Origine',
    dest: 'Destination',
    heading: 'Cap',
    speed: 'Vitesse',
    altitude: 'Altitude',
    vrate: 'Vitesse Vert.',
    legend_title: 'Légende des Altitudes',
    legend_cruising: 'Croisière (> 30 000 ft)',
    legend_transition: 'Transition (10k - 30k ft)',
    legend_approach: 'Approche/Décollage (< 10k ft)',
    legend_selected: 'Appareil Sélectionné'
  },
  de: {
    // Navbar
    trips: 'Reisen',
    weather: 'Wetter',
    tracker: 'Flugradar',
    hotels: 'Hotels',
    budgets: 'Budgets',
    logged_in_as: 'Angemeldet als',
    profile: 'Profil',
    logout: 'Abmelden',
    light_mode: 'Heller Modus',
    dark_mode: 'Dunkler Modus',
    
    // Tracker Page
    sky_radar: 'Flugradar',
    live_api: 'Live-API',
    simulated_radar: 'Simulierter Radar',
    tracked: 'Verfolgt',
    avg_speed: 'Durchschnittsgeschw.',
    avg_altitude: 'Durchschnittshöhe',
    search_placeholder: 'Suche Flugnr. oder Land...',
    scanning_skies: 'Scanne den Himmel...',
    error_connecting: 'Verbindung zum Server fehlgeschlagen. Erneuter Versuch...',
    try_again: 'Erneut versuchen',
    next_update: 'Nächstes Update in',
    full_map: 'Vollbildkarte',
    show_radar_list: 'Liste anzeigen',
    en_route: 'UNTERWEGS',
    origin: 'Abflug',
    dest: 'Ankunft',
    heading: 'Kurs',
    speed: 'Geschw.',
    altitude: 'Höhe',
    vrate: 'Steigrate',
    legend_title: 'Höhenlegende',
    legend_cruising: 'Reiseflug (> 30.000 ft)',
    legend_transition: 'Übergang (10k - 30k ft)',
    legend_approach: 'Steig-/Sinkflug (< 10k ft)',
    legend_selected: 'Ausgewähltes Flugzeug'
  },
  hi: {
    // Navbar
    trips: 'यात्राएं',
    weather: 'मौसम',
    tracker: 'ट्रैकर',
    hotels: 'होटल',
    budgets: 'बजट',
    logged_in_as: 'लॉग इन किया है',
    profile: 'प्रोफ़ाइल',
    logout: 'लॉग आउट',
    light_mode: 'लाइट मोड',
    dark_mode: 'डार्क मोड',
    
    // Tracker Page
    sky_radar: 'आकाश रडार',
    live_api: 'लाइव एपीआई',
    simulated_radar: 'सिम्युलेटेड रडार',
    tracked: 'ट्रैक किया गया',
    avg_speed: 'औसत गति',
    avg_altitude: 'औसत ऊंचाई',
    search_placeholder: 'फ्लाइट नंबर या देश खोजें...',
    scanning_skies: 'आसमान में विमानों की खोज की जा रही है...',
    error_connecting: 'फ्लाइट सर्वर से जुड़ने में असमर्थ...',
    try_again: 'पुनः प्रयास करें',
    next_update: 'अगला अपडेट',
    full_map: 'पूरा नक्शा',
    show_radar_list: 'सूची दिखाएं',
    en_route: 'मार्ग में',
    origin: 'प्रस्थान',
    dest: 'गंतव्य',
    heading: 'दिशा',
    speed: 'गति',
    altitude: 'ऊंचाई',
    vrate: 'वर्टिकल रेट',
    legend_title: 'ऊंचाई का नक्शा',
    legend_cruising: 'क्रूज़िंग (> ३०,००० फीट)',
    legend_transition: 'संक्रमण (१०,००० - ३०,००० फीट)',
    legend_approach: 'टेकऑफ़/लैंडिंग (< १०,००० फीट)',
    legend_selected: 'चयनित विमान'
  },
  ar: {
    // Navbar
    trips: 'رحلاتي',
    weather: 'الطقس',
    tracker: 'الرادار',
    hotels: 'الفنادق',
    budgets: 'الميزانية',
    logged_in_as: 'مسجل كـ',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    light_mode: 'وضع فاتح',
    dark_mode: 'وضع داكن',
    
    // Tracker Page
    sky_radar: 'رادار السماء',
    live_api: 'بث مباشر',
    simulated_radar: 'رادار محاكي',
    tracked: 'المتتبع',
    avg_speed: 'متوسط السرعة',
    avg_altitude: 'متوسط الارتفاع',
    search_placeholder: 'بحث برقم الرحلة أو البلد...',
    scanning_skies: 'جاري مسح السماء بحثاً عن طائرات...',
    error_connecting: 'تعذر الاتصال بخادم الرحلة...',
    try_again: 'أعد المحاولة',
    next_update: 'التحديث القادم في',
    full_map: 'الخريطة الكاملة',
    show_radar_list: 'عرض القائمة',
    en_route: 'في الطريق',
    origin: 'المنشأ',
    dest: 'الوجهة',
    heading: 'الاتجاه',
    speed: 'السرعة',
    altitude: 'الارتفاع',
    vrate: 'المعدل العمودي',
    legend_title: 'دليل الارتفاع',
    legend_cruising: 'طيران مستقر (> ٣٠ ألف قدم)',
    legend_transition: 'ارتفاع انتقالي (١٠-٣٠ ألف قدم)',
    legend_approach: 'إقلاع وهبوط (< ١٠ آلاف قدم)',
    legend_selected: 'الطائرة المحددة'
  },
  pt: {
    // Navbar
    trips: 'Viagens',
    weather: 'Clima',
    tracker: 'Rastreador',
    hotels: 'Hotéis',
    budgets: 'Orçamentos',
    logged_in_as: 'Sessão como',
    profile: 'Perfil',
    logout: 'Sair',
    light_mode: 'Modo Claro',
    dark_mode: 'Modo Escuro',
    
    // Tracker Page
    sky_radar: 'Radar Aéreo',
    live_api: 'API em Tempo Real',
    simulated_radar: 'Radar Simulado',
    tracked: 'Rastreados',
    avg_speed: 'Vel. Média',
    avg_altitude: 'Alt. Média',
    search_placeholder: 'Buscar voo ou país...',
    scanning_skies: 'Rastreando aviões nos céus...',
    error_connecting: 'Não foi possível conectar ao servidor...',
    try_again: 'Tentar novamente',
    next_update: 'Próxima atualização em',
    full_map: 'Mapa Completo',
    show_radar_list: 'Mostrar Lista',
    en_route: 'EM ROTA',
    origin: 'Origem',
    dest: 'Destino',
    heading: 'Rumo',
    speed: 'Velocidade',
    altitude: 'Altitude',
    vrate: 'Taxa Vertical',
    legend_title: 'Legenda de Altitude',
    legend_cruising: 'Cruzeiro (> 30.000 ft)',
    legend_transition: 'Transição (10k - 30k ft)',
    legend_approach: 'Decolagem/Pouso (< 10k ft)',
    legend_selected: 'Aeronave Selecionada'
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved && translations[saved] ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
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
