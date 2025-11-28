import React from 'react';

// A set of abstract, friendly, rounded blob illustrations
// Updated Palette: Green (#557C55), Sage (#A6CF98), Brown (#A06D48), Beige (#F2F1EB)

export const IllustrationCommunity: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="80" fill="#E6E2D6" />
    <path d="M100 180C144.183 180 180 144.183 180 100C180 55.8172 144.183 20 100 20C55.8172 20 20 55.8172 20 100C20 144.183 55.8172 180 100 180Z" stroke="#557C55" strokeWidth="4" strokeDasharray="10 10"/>
    {/* People Blobs */}
    <circle cx="70" cy="110" r="20" fill="#557C55" /> 
    <circle cx="130" cy="110" r="20" fill="#A06D48" />
    <circle cx="100" cy="80" r="20" fill="#A6CF98" />
    {/* Smiles */}
    <path d="M65 115Q70 120 75 115" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M125 115Q130 120 135 115" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M95 85Q100 90 105 85" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const IllustrationHelp: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="40" y="40" width="120" height="120" rx="60" fill="#E6E2D6" />
    {/* Hands reaching */}
    <path d="M50 160C50 160 60 110 90 100" stroke="#557C55" strokeWidth="12" strokeLinecap="round"/>
    <path d="M150 40C150 40 140 90 110 100" stroke="#A06D48" strokeWidth="12" strokeLinecap="round"/>
    <circle cx="100" cy="100" r="15" fill="#A6CF98" />
    {/* Sparkles */}
    <path d="M140 140L145 130L150 140L160 145L150 150L145 160L140 150L130 145L140 140Z" fill="#A06D48" />
    <path d="M60 60L63 53L66 60L73 63L66 66L63 73L60 66L53 63L60 60Z" fill="#557C55" />
  </svg>
);

export const IllustrationSkill: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
     <path d="M100 20C55.8 20 20 55.8 20 100s35.8 80 80 80 80-35.8 80-80-35.8-80-80-80z" fill="#F2F1EB" stroke="#A6CF98" strokeWidth="2"/>
     {/* Tools/Items */}
     <rect x="60" y="60" width="30" height="80" rx="5" transform="rotate(-15 75 100)" fill="#A06D48" />
     <circle cx="120" cy="80" r="25" fill="#557C55" opacity="0.8" />
     <rect x="100" y="110" width="50" height="40" rx="8" fill="#2A2F2A" opacity="0.8" />
     <path d="M110 120h30" stroke="white" strokeWidth="4" strokeLinecap="round"/>
     <path d="M110 135h20" stroke="white" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

export const IllustrationLogin: React.FC<{ className?: string }> = ({ className }) => (
   <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
     <circle cx="100" cy="100" r="90" fill="#F2F1EB" stroke="#557C55" strokeWidth="2" strokeDasharray="4 4" />
     <circle cx="100" cy="90" r="30" fill="#A06D48" />
     <path d="M50 160C50 132.386 72.3858 110 100 110C127.614 110 150 132.386 150 160" stroke="#557C55" strokeWidth="12" strokeLinecap="round" />
     <circle cx="160" cy="40" r="10" fill="#A6CF98" />
     <circle cx="30" cy="100" r="6" fill="#A06D48" />
   </svg>
);