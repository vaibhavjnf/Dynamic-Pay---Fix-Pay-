import React, { useEffect, useState } from 'react';

interface WelcomeScreenProps {
  onLogin: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white relative overflow-hidden font-archivo">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}></div>

      <div className={`relative z-10 flex flex-col items-center w-full max-w-md transition-all duration-700 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        {/* Logo Section */}
        <div className="relative mb-12 flex flex-col items-center">
          <h1 
            className="text-8xl font-black uppercase tracking-tighter relative z-10 leading-none"
            style={{ 
              color: '#CEF431', 
              WebkitTextStroke: '3px black',
              textShadow: '8px 8px 0px #000000',
              transform: 'rotate(-2deg)'
            }}
          >
            FIXPAY
          </h1>
          
          {/* Underline Bar */}
          <div 
            className="h-4 bg-black w-40 mt-6 transform rotate-1"
          ></div>
        </div>

        {/* Tagline Section */}
        <div className="mb-32">
           <div className="bg-[#CEF431] px-4 py-1">
             <span className="text-2xl font-black uppercase text-black tracking-wide">
               MADE SIMPLE
             </span>
           </div>
        </div>

        {/* Start Button */}
        <div className="w-full px-2">
          <button
            onClick={onLogin}
            className="w-full h-20 bg-white border-4 border-black shadow-neo flex items-center justify-center group hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:translate-x-2 active:translate-y-2 active:shadow-none"
          >
             <span className="text-3xl font-black uppercase tracking-widest text-black">START</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default WelcomeScreen;