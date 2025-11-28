export const lightColors = {
  // Primary brand colors
  primary: '#5FA8D3',
  primaryLight: '#E8F4F8',
  coral: '#F46A5F',
  olive: '#9AA657',
  mustard: '#F4C16D',
  cream: '#FCEFE6',
  beige: '#F5E6D3',
  sage: '#9AA657',
  
  // Text colors
  text: {
    primary: '#2A2A2A',
    secondary: '#6C6C6C',
    inverse: '#FFFFFF',
    placeholder: '#9CA3AF',
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#FCEFE6',
    accent: '#F0F9FF',
    tertiary: '#F8FAFC',
  },
  
  // Surface colors
  surface: {
    primary: '#FFFFFF',
    secondary: '#FCEFE6',
    card: '#FFFFFF',
    accent: '#F8FAFC',
  },
  
  // Status colors
  success: '#9AA657',
  warning: '#F4C16D',
  error: '#F46A5F',
  info: '#5FA8D3',
  
  // Category colors
  category: {
    'Errands': '#F46A5F',
    'Tutoring': '#5FA8D3',
    'Tech Support': '#F4C16D',
    'Pet Care': '#9AA657',
    'Home Repair': '#6C6C6C',
    'Transportation': '#5FA8D3',
    'Gardening': '#9AA657',
    'Cleaning': '#F4C16D',
    'Moving Help': '#F46A5F',
    'General': '#6C6C6C'
  },
  
  // Urgency colors
  urgency: {
    high: '#F46A5F',
    medium: '#F4C16D',
    low: '#9AA657'
  },
  
  // Navigation colors
  navigation: {
    active: '#5FA8D3',
    inactive: '#6C6C6C',
    background: '#FFFFFF',
  },
  
  // Gradients
  gradient: {
    primary: ['#5FA8D3', '#7FB8D8'],
    coral: ['#F46A5F', '#F68B83'],
    olive: ['#9AA657', '#B5B970'],
    mustard: ['#F4C16D', '#F6D083'],
    card: ['#FFFFFF', '#FCEFE6']
  },
  
  // Border and shadow colors
  border: '#E5E5E5',
  shadow: 'rgba(42, 42, 42, 0.1)',
  
  // UI specific colors (for backward compatibility)
  ui: {
    border: '#E5E5E5',
  },
  
  // Status colors (nested for backward compatibility)
  status: {
    error: '#F46A5F',
    warning: '#F4C16D',
    neutral: '#6C6C6C',
  },
  
  // Interactive colors
  interactive: {
    disabled: '#E5E7EB',
  },
  
  // Categories (for backward compatibility)
  categories: {
    default: '#6C6C6C',
  },
};

export const darkColors = {
  // Primary brand colors (adjusted for dark mode)
  primary: '#5FA8D3',
  primaryLight: '#2C5F7D',
  coral: '#F46A5F',
  olive: '#9AA657',
  mustard: '#F4C16D',
  cream: '#FCEFE6',
  beige: '#F5E6D3',
  sage: '#9AA657',
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B0',
    inverse: '#2A2A2A',
    placeholder: '#6B7280',
  },
  
  // Background colors
  background: {
    primary: '#1A1A1A',
    secondary: '#2D2D2D',
    accent: '#0F172A',
    tertiary: '#1E293B',
  },
  
  // Surface colors
  surface: {
    primary: '#2D2D2D',
    secondary: '#404040',
    card: '#2D2D2D',
    accent: '#1E293B',
  },
  
  // Status colors (same as light)
  success: '#9AA657',
  warning: '#F4C16D',
  error: '#F46A5F',
  info: '#5FA8D3',
  
  // Category colors (same as light)
  category: {
    'Errands': '#F46A5F',
    'Tutoring': '#5FA8D3',
    'Tech Support': '#F4C16D',
    'Pet Care': '#9AA657',
    'Home Repair': '#6C6C6C',
    'Transportation': '#5FA8D3',
    'Gardening': '#9AA657',
    'Cleaning': '#F4C16D',
    'Moving Help': '#F46A5F',
    'General': '#6C6C6C'
  },
  
  // Urgency colors (same as light)
  urgency: {
    high: '#F46A5F',
    medium: '#F4C16D',
    low: '#9AA657'
  },
  
  // Navigation colors
  navigation: {
    active: '#5FA8D3',
    inactive: '#B0B0B0',
    background: '#2D2D2D',
  },
  
  // Gradients (adjusted for dark mode)
  gradient: {
    primary: ['#5FA8D3', '#2C5F7D'],
    coral: ['#F46A5F', '#C73E31'],
    olive: ['#9AA657', '#6B7344'],
    mustard: ['#F4C16D', '#C4943F'],
    card: ['#2D2D2D', '#404040']
  },
  
  // Border and shadow colors (adjusted for dark mode)
  border: '#404040',
  shadow: 'rgba(0, 0, 0, 0.3)',
  
  // UI specific colors (for backward compatibility)
  ui: {
    border: '#404040',
  },
  
  // Status colors (nested for backward compatibility)
  status: {
    error: '#F46A5F',
    warning: '#F4C16D',
    neutral: '#6C6C6C',
  },
  
  // Interactive colors
  interactive: {
    disabled: '#404040',
  },
  
  // Categories (for backward compatibility)
  categories: {
    default: '#B0B0B0',
  },
};

// Legacy export for backward compatibility
export const colors = lightColors;
