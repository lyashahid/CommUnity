// Centralized Color Palette for CommUnity App
// Primary Theme: Green, Sage, Brown, Beige
// Maintains red for errors and ensures good contrast

export const colors = {
  // Primary Brand Colors
  primary: '#557C55',        // Main Green
  primaryLight: '#6B8E6B',   // Lighter Green
  primaryDark: '#4A6B4A',    // Darker Green
  
  // Secondary Colors
  sage: '#A6CF98',           // Sage Green
  brown: '#A06D48',          // Warm Brown
  beige: '#F2F1EB',          // Light Beige
  cream: '#F5F9F0',          // Soft Cream
  
  // Text Colors (ensuring contrast)
  text: {
    primary: '#1A1A1A',      // Main text
    secondary: '#4A4A4A',    // Secondary text
    tertiary: '#7A7A7A',     // Tertiary text
    inverse: '#FFFFFF',       // White text
    placeholder: '#9CA3AF',  // Placeholder text
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',       // Main background
    secondary: '#F8F9FA',    // Light gray background
    tertiary: '#F3F4F6',     // Card background
    accent: '#F5F9F0',       // Beige accent background
  },
  
  // Status Colors (keeping important colors)
  status: {
    success: '#10B981',      // Green for success
    warning: '#F59E0B',      // Amber for warnings
    error: '#EF4444',        // Red for errors (important)
    info: '#3B82F6',         // Blue for info
    neutral: '#6B7280',      // Gray for neutral
  },
  
  // UI Element Colors
  ui: {
    border: '#E5E7EB',       // Light borders
    divider: '#F3F4F6',      // Dividers
    shadow: 'rgba(0, 0, 0, 0.1)', // Shadows
    overlay: 'rgba(0, 0, 0, 0.5)', // Overlays
  },
  
  // Interactive States
  interactive: {
    primary: '#557C55',      // Primary buttons
    primaryHover: '#4A6B4A', // Primary hover
    secondary: '#A06D48',    // Secondary buttons
    secondaryHover: '#8B5E3E', // Secondary hover
    disabled: '#D1D5DB',     // Disabled state
  },
  
  // Navigation Colors
  navigation: {
    active: '#557C55',       // Active tab/icon
    inactive: '#9CA3AF',     // Inactive tab/icon
    background: '#FFFFFF',   // Nav background
  },
  
  // Gradient Colors
  gradients: {
    primary: ['#557C55', '#6B8E6B'],
    secondary: ['#A06D48', '#8B5E3E'],
    accent: ['#F2F1EB', '#F5F9F0'],
    subtle: ['rgba(166, 207, 152, 0.1)', 'rgba(160, 109, 72, 0.1)'],
  },
  
  // Urgency Colors (maintaining distinction)
  urgency: {
    low: '#10B981',          // Green
    medium: '#F59E0B',       // Amber  
    high: '#EF4444',         // Red
  },
  
  // Category Colors
  categories: {
    default: '#557C55',
    errands: '#A06D48',
    tutoring: '#6B8E6B',
    tech: '#3B82F6',
    petCare: '#8B5E3E',
    homeRepair: '#A06D48',
    transportation: '#4A6B4A',
    gardening: '#6B8E6B',
    cleaning: '#9CA3AF',
    moving: '#A06D48',
    general: '#557C55',
  },
};

// Helper functions for common color operations
export const getColor = (key: keyof typeof colors) => colors[key];

export const getStatusColor = (status: 'success' | 'warning' | 'error' | 'info' | 'neutral') => 
  colors.status[status];

export const getUrgencyColor = (urgency: 'low' | 'medium' | 'high' | undefined) => 
  urgency ? colors.urgency[urgency] : colors.urgency.medium;

export const getCategoryColor = (category: string) => {
  const categoryMap: { [key: string]: string } = {
    'Errands': colors.categories.errands,
    'Tutoring': colors.categories.tutoring,
    'Tech Support': colors.categories.tech,
    'Pet Care': colors.categories.petCare,
    'Home Repair': colors.categories.homeRepair,
    'Transportation': colors.categories.transportation,
    'Gardening': colors.categories.gardening,
    'Cleaning': colors.categories.cleaning,
    'Moving Help': colors.categories.moving,
    'General': colors.categories.general,
  };
  return categoryMap[category] || colors.categories.default;
};

export const getTextColor = (variant: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'placeholder') => 
  colors.text[variant];

export const getBackgroundColor = (variant: 'primary' | 'secondary' | 'tertiary' | 'accent') => 
  colors.background[variant];
