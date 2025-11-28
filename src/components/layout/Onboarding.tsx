import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Screen, OnboardingSlideData } from '../types';
import { IllustrationCommunity, IllustrationHelp, IllustrationSkill } from '../assets/illustrations/Illustrations';
import { Button } from '../common/Button';

interface OnboardingProps {
  setScreen: (screen: Screen) => void;
}

const slides: OnboardingSlideData[] = [
  {
    id: 1,
    title: "Ask for Help",
    description: "Need a hand with groceries or moving a couch? Post a request and let your neighbors help.",
    Illustration: IllustrationHelp,
    color: "text-brand-green"
  },
  {
    id: 2,
    title: "Share Your Skills",
    description: "Good at fixing things or baking? Offer your unique skills to brighten someone's day.",
    Illustration: IllustrationSkill,
    color: "text-brand-brown"
  },
  {
    id: 3,
    title: "Build Community",
    description: "Connect with people nearby, earn trust badges, and create a safer, happier neighborhood.",
    Illustration: IllustrationCommunity,
    color: "text-brand-dark"
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ setScreen }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setScreen(Screen.SIGNUP);
    }
  };

  const handleSkip = () => {
    setScreen(Screen.SIGNUP);
  };

  return (
    <div className="flex flex-col h-full bg-brand-light relative overflow-hidden">
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={handleSkip}
          className="text-brand-gray font-medium text-sm hover:text-brand-dark transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slides */}
      <div className="flex-1 relative flex flex-col justify-center">
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col items-center px-8 text-center"
          >
            <div className="w-full max-w-xs aspect-square mb-8 relative">
                {/* Background decorative blob */}
                <div className={`absolute inset-0 bg-brand-beige rounded-full opacity-60 blur-2xl transform scale-90`} />
                <div className="relative z-10 animate-float">
                   {React.createElement(slides[currentIndex].Illustration, { className: "w-full h-full drop-shadow-xl" })}
                </div>
            </div>
            
            <h2 className="text-3xl font-bold text-brand-dark mb-4 font-outfit tracking-tight">
              {slides[currentIndex].title}
            </h2>
            <p className="text-brand-gray text-lg leading-relaxed max-w-xs">
              {slides[currentIndex].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="px-8 pb-12 pt-4">
        {/* Dots */}
        <div className="flex justify-center space-x-2 mb-8">
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              className={`
                h-2 rounded-full transition-all duration-300 
                ${index === currentIndex ? 'w-8 bg-brand-green' : 'w-2 bg-gray-300'}
              `}
            />
          ))}
        </div>

        <Button 
          onClick={handleNext} 
          fullWidth 
          className="group"
        >
          {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          <span className="ml-2 group-hover:translate-x-1 transition-transform">
             {currentIndex === slides.length - 1 ? <Check size={20}/> : <ArrowRight size={20} />}
          </span>
        </Button>
      </div>
    </div>
  );
};