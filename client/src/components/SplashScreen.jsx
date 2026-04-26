import React from 'react';
import logo from '../assets/logo.png';

const SplashScreen = ({ isFadingOut }) => {
  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0b1016] ${isFadingOut ? 'animate-fade-out' : ''}`}>
      <div className="relative flex flex-col items-center">
        {/* Animated Logo */}
        <div className="mb-8">
            <img 
                src={logo} 
                alt="DataNova Logo" 
                className="w-40 h-40 object-contain animate-pulse-glow"
            />
        </div>
        
        {/* Animated Brand Name */}
        <div className="overflow-hidden">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white animate-tracking-in">
                Data<span className="text-emerald-400">Nova</span>
            </h1>
        </div>
        
        {/* Subtle loading indicator replacement - just a soft glow line */}
        <div className="mt-12 w-48 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
