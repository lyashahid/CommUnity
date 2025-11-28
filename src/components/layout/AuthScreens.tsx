import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, MapPin, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Screen } from '../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { IllustrationLogin } from '../assets/illustrations/Illustrations';

interface AuthProps {
  screen: Screen;
  setScreen: (screen: Screen) => void;
}

export const AuthScreens: React.FC<AuthProps> = ({ screen, setScreen }) => {
  const isLogin = screen === Screen.LOGIN;
  const [showPassword, setShowPassword] = useState(false);

  const toggleScreen = () => {
    setScreen(isLogin ? Screen.SIGNUP : Screen.LOGIN);
  };

  return (
    <div className="min-h-full flex flex-col bg-brand-light relative">
      {/* Header Background */}
      <div className="absolute top-0 left-0 w-full h-64 bg-brand-green/10 rounded-b-[3rem] -z-0" />

      {/* Navigation */}
      <div className="px-6 py-6 z-10 flex items-center">
        <button 
          onClick={() => setScreen(Screen.ONBOARDING)} 
          className="p-2 rounded-full bg-white/50 hover:bg-white transition-colors"
        >
          <ArrowLeft size={24} className="text-brand-dark" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pb-8 z-10 -mt-4">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
           <div className="w-32 h-32 mb-4 animate-float">
             <IllustrationLogin className="w-full h-full drop-shadow-lg" />
           </div>
           <h1 className="text-3xl font-bold text-brand-dark mb-2">
             {isLogin ? 'Welcome Back!' : 'Join CommUnity'}
           </h1>
           <p className="text-brand-gray text-center max-w-xs">
             {isLogin 
               ? 'We missed you! Log in to see who needs help nearby.' 
               : 'Create an account to start connecting with your neighbors.'}
           </p>
        </div>

        {/* Form Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl shadow-xl shadow-brand-dark/5 border border-brand-beige"
        >
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setScreen(Screen.HOME); }}>
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <Input 
                  placeholder="Full Name" 
                  icon={<User size={20} />} 
                />
                <Input 
                  placeholder="Zip Code" 
                  type="number"
                  icon={<MapPin size={20} />} 
                />
              </motion.div>
            )}
            
            <Input 
              type="email" 
              placeholder="Email Address" 
              icon={<Mail size={20} />} 
            />
            
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                icon={<Lock size={20} />} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-brand-green transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-brand-green font-medium hover:text-[#466a46]">
                  Forgot Password?
                </button>
              </div>
            )}

            <Button type="submit" fullWidth className="mt-4 shadow-brand-green/20">
              {isLogin ? 'Log In' : 'Sign Up'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <Button variant="social" className="text-sm">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2" />
              Google
            </Button>
            <Button variant="social" className="text-sm">
              <img src="https://www.svgrepo.com/show/475647/apple-color.svg" alt="Apple" className="w-5 h-5 mr-2" />
              Apple
            </Button>
          </div>
        </motion.div>

        {/* Footer Switcher */}
        <div className="mt-8 text-center">
          <p className="text-brand-gray">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={toggleScreen}
              className="text-brand-green font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};