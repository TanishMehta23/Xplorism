import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Compass, Zap, MapPin, CloudRain, Star, Plus, Calendar, DollarSign, Users, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  
  const { scrollY } = useScroll();

  // Maps scroll positions from 0px (top of page) to 400px down.
  // Closed lid is flat (-90deg), fully open lid is perfectly upright (0deg) to eliminate trapezoidal skew.
  const rotateX = useTransform(scrollY, [0, 400], [-90, 0], { clamp: true });
  const scale = useTransform(scrollY, [0, 400], [0.8, 1.0], { clamp: true });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 120 },
    },
  };

  return (
    <div className="bg-white text-slate-800 min-h-screen font-sans selection:bg-rose-100 selection:text-rose-600">
      
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <Link to="/" className="flex items-center space-x-3 text-2xl font-bold tracking-tight">
          <img 
            src="/logo.png" 
            alt="Xplorism Logo" 
            className="h-14 w-14 object-contain rounded-full shadow-sm" 
          />
          <span className="text-slate-900 font-extrabold tracking-tight">
            Xplorism
          </span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all duration-200"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-lg bg-slate-955 hover:bg-slate-855 text-white font-semibold text-sm transition-all duration-200"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-6 pt-20 pb-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight text-slate-900"
        >
          <span className="text-[#f87171]">Discover Your Next Adventure:</span>
          <br />
          <span className="text-slate-955 font-black">Personalized Itineraries at Your Fingertips</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
        >
          Your personal trip planner and travel curator, creating custom itineraries tailored to your interests and budget.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex justify-center"
        >
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="px-7 py-3.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-slate-950/10"
          >
            <span>Get Started, It's Free</span>
          </Link>
        </motion.div>
      </header>

      {/* Interactive 3D Laptop Showcase */}
      <section className="relative max-w-6xl mx-auto px-6 py-10 flex flex-col items-center overflow-hidden">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-10 animate-pulse">
          Scroll down to open your planner
        </div>

        {/* 3D Viewport container */}
        <div className="w-full flex flex-col items-center" style={{ perspective: '1500px' }}>
          
          {/* Laptop Screen (Lid) */}
          <motion.div
            style={{ 
              rotateX, 
              scale,
              transformOrigin: 'bottom', 
              transformStyle: 'preserve-3d',
            }}
            className="w-[90%] md:w-[85%] max-w-[800px] aspect-[16/10] bg-[#0c111d] border-[10px] md:border-[14px] border-slate-900 rounded-t-3xl relative shadow-[0_-20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
          >
            {/* Webcam / Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-b-md z-30 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-800 mr-2" />
              <div className="h-1 w-1 rounded-full bg-green-500/80 animate-pulse" />
            </div>

            {/* Inner Screen Mockup Content */}
            <div className="absolute inset-0 bg-white overflow-hidden text-slate-800 p-3 md:p-6 select-none font-sans text-[10px] md:text-xs">
              
              {/* Mock Screen Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <img 
                    src="/logo.png" 
                    alt="Xplorism Logo" 
                    className="h-8 w-8 object-contain rounded-full" 
                  />
                  <span className="font-extrabold text-slate-900 tracking-tight">Xplorism</span>
                </div>
                <div className="flex items-center space-x-2 scale-90 md:scale-100 origin-right">
                  <button className="px-2.5 py-1 rounded-full border border-slate-200 hover:bg-slate-50 font-medium text-[9px] md:text-[10px] text-slate-600 transition">
                    + Create Trip
                  </button>
                  <button className="px-2.5 py-1 rounded-full border border-slate-200 hover:bg-slate-50 font-medium text-[9px] md:text-[10px] text-slate-600 transition">
                    My Trips
                  </button>
                  <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                    G
                  </div>
                </div>
              </div>

              {/* Main Banner */}
              <div className="mt-3 relative rounded-xl overflow-hidden aspect-[16/6.5] bg-slate-100">
                <img 
                  src="/las_vegas.png" 
                  alt="Las Vegas Strip" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Destination Details */}
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs md:text-base font-extrabold text-slate-900">Las Vegas, NV, USA</h3>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 font-medium text-[8px] md:text-[9px]">
                      <Calendar className="h-2.5 w-2.5" />
                      <span>2 Day</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium text-[8px] md:text-[9px]">
                      <DollarSign className="h-2.5 w-2.5" />
                      <span>Moderate Budget</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium text-[8px] md:text-[9px]">
                      <Users className="h-2.5 w-2.5" />
                      <span>No. Of Traveler: 2 People</span>
                    </span>
                  </div>
                </div>
                
                <button className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition">
                  <Navigation className="h-3.5 w-3.5 fill-current rotate-45" />
                </button>
              </div>

              {/* Hotel Recommendations Section */}
              <div className="mt-5">
                <h4 className="text-[10px] md:text-xs font-extrabold text-slate-900 mb-2">Hotel Recommendation</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {/* Card 1 */}
                  <div className="border border-slate-100 rounded-lg overflow-hidden bg-white p-1.5 flex flex-col justify-between">
                    <div className="aspect-[4/3] rounded-md bg-gradient-to-br from-rose-100 to-rose-200 mb-1.5 flex items-center justify-center text-rose-300">
                      <Compass className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-[8px] md:text-[9px] text-slate-900 leading-tight">The Venetian Resort</h5>
                      <p className="text-[7px] text-slate-400 leading-tight mt-0.5">3355 Las Vegas Blvd S</p>
                      <p className="text-[7px] font-bold text-slate-700 mt-1">$150-$300 / night</p>
                    </div>
                    <div className="flex items-center space-x-0.5 text-amber-500 text-[7px] mt-1">
                      <Star className="h-1.5 w-1.5 fill-current" />
                      <span>4.5 stars</span>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="border border-slate-100 rounded-lg overflow-hidden bg-white p-1.5 flex flex-col justify-between">
                    <div className="aspect-[4/3] rounded-md bg-gradient-to-br from-teal-100 to-teal-200 mb-1.5 flex items-center justify-center text-teal-300">
                      <Compass className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-[8px] md:text-[9px] text-slate-900 leading-tight">The Wynn Las Vegas</h5>
                      <p className="text-[7px] text-slate-400 leading-tight mt-0.5">3131 Las Vegas Blvd S</p>
                      <p className="text-[7px] font-bold text-slate-700 mt-1">$200-$400 / night</p>
                    </div>
                    <div className="flex items-center space-x-0.5 text-amber-500 text-[7px] mt-1">
                      <Star className="h-1.5 w-1.5 fill-current" />
                      <span>5.0 stars</span>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="border border-slate-100 rounded-lg overflow-hidden bg-white p-1.5 flex flex-col justify-between">
                    <div className="aspect-[4/3] rounded-md bg-gradient-to-br from-amber-100 to-amber-200 mb-1.5 flex items-center justify-center text-amber-300">
                      <Compass className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-[8px] md:text-[9px] text-slate-900 leading-tight">The Cosmopolitan</h5>
                      <p className="text-[7px] text-slate-400 leading-tight mt-0.5">3708 Las Vegas Blvd S</p>
                      <p className="text-[7px] font-bold text-slate-700 mt-1">$180-$350 / night</p>
                    </div>
                    <div className="flex items-center space-x-0.5 text-amber-500 text-[7px] mt-1">
                      <Star className="h-1.5 w-1.5 fill-current" />
                      <span>4.0 stars</span>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="border border-slate-100 rounded-lg overflow-hidden bg-white p-1.5 flex flex-col justify-between">
                    <div className="aspect-[4/3] rounded-md bg-gradient-to-br from-indigo-100 to-indigo-200 mb-1.5 flex items-center justify-center text-indigo-300">
                      <Compass className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-[8px] md:text-[9px] text-slate-900 leading-tight">ARIA Resort & Casino</h5>
                      <p className="text-[7px] text-slate-400 leading-tight mt-0.5">3730 Las Vegas Blvd S</p>
                      <p className="text-[7px] font-bold text-slate-700 mt-1">$160-$320 / night</p>
                    </div>
                    <div className="flex items-center space-x-0.5 text-amber-500 text-[7px] mt-1">
                      <Star className="h-1.5 w-1.5 fill-current" />
                      <span>4.5 stars</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

          {/* Black Hinge Connection Bar */}
          <div className="w-[85%] max-w-[760px] h-[8px] bg-slate-955 z-10 border-b border-slate-800" />

          {/* Laptop Base (Keyboard Tray) */}
          <div 
            className="w-[98%] md:w-[94%] max-w-[880px] h-[18px] md:h-[24px] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 rounded-b-2xl relative shadow-[0_20px_40px_rgba(0,0,0,0.35)] border-t border-slate-500/20"
            style={{ 
              transform: 'rotateX(15deg)', 
              transformOrigin: 'top',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Trackpad indentation */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 md:w-32 h-[8px] md:h-[12px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-b-lg border-x border-b border-slate-700/20" />
            
            {/* Front Lip shadow edge */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-950 rounded-b-2xl" />
          </div>

        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-100">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">Plan Simpler. Travel Better.</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm">
            Everything you need for an unforgettable journey, organized in a clean layout.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Card 1 */}
          <motion.div variants={itemVariants} className="bg-slate-50/50 border border-slate-100 p-8 rounded-2xl hover:shadow-md transition-all duration-200">
            <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Custom Itinerary Builder</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Enter your budget, dates, and styles. Get customized day-by-day plans, dining recommendations, and travel markers.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={itemVariants} className="bg-slate-50/50 border border-slate-100 p-8 rounded-2xl hover:shadow-md transition-all duration-200">
            <div className="h-12 w-12 rounded-xl bg-teal-55 flex items-center justify-center text-teal-600 mb-6">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Interactive Mapping</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Map out destinations on Leaflet OpenStreetMap. Keep coordinates of all sights, hotels, and restaurants in one place.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={itemVariants} className="bg-slate-50/50 border border-slate-100 p-8 rounded-2xl hover:shadow-md transition-all duration-200">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6">
              <CloudRain className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Weather Forecasting</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Check real-time 5-day forecasts and suggestions on clothing to optimize your daily activity selection.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2.5 text-xl font-bold">
            <img 
              src="/logo.png" 
              alt="Xplorism Logo" 
              className="h-11 w-11 object-contain rounded-full" 
            />
            <span className="text-slate-900 font-extrabold">Xplorism</span>
          </div>
          <p className="text-xs text-slate-400 mt-4 md:mt-0">
            &copy; {new Date().getFullYear()} Xplorism. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
