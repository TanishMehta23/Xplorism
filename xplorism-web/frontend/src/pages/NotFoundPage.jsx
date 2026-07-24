import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 bg-grid-pattern text-slate-100 flex items-center justify-center p-6 overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md relative z-10"
      >
        <div className="h-20 w-20 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 mb-8 mx-auto border border-violet-500/20">
          <HelpCircle className="h-10 w-10" />
        </div>
        
        <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          404
        </h1>
        <h2 className="text-2xl font-bold mb-3">Page Not Found</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-semibold transition"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          <span>Back to Home</span>
        </Link>
      </motion.div>
    </div>
  );
}
