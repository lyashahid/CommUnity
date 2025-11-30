import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '@/theme/colors';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorSchemeName;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  colors: any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = '@app_theme';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [isLoading, setIsLoading] = useState(true);

  const getColorScheme = (): ColorSchemeName => {
    if (theme === 'system') {
      return systemColorScheme;
    }
    return theme;
  };

  const colorScheme = getColorScheme();
  const isDark = colorScheme === 'dark';

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeState(savedTheme as Theme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  if (isLoading) {
    // Provide fallback context during loading instead of returning null
    const fallbackValue = {
      theme: 'system' as Theme,
      colorScheme: 'light' as ColorSchemeName,
      isDark: false,
      setTheme,
      colors: lightColors,
    };
    return <ThemeContext.Provider value={fallbackValue}>{children}</ThemeContext.Provider>;
  }

  const colors = isDark ? darkColors : lightColors;

  const value = {
    theme,
    colorScheme,
    isDark,
    setTheme,
    colors,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return fallback values to prevent crashes during initial load
    const fallbackColors = lightColors || {
      primary: '#5FA8D3',
      text: { primary: '#2A2A2A', secondary: '#6C6C6C' },
      background: { primary: '#FFFFFF', secondary: '#FCEFE6' },
      status: { error: '#F46A5F', warning: '#F4C16D', neutral: '#6C6C6C' },
      success: '#9AA657',
      surface: { primary: '#FFFFFF' },
      primaryLight: '#E8F4F8'
    };
    
    return {
      theme: 'system',
      colorScheme: 'light',
      isDark: false,
      setTheme: () => {},
      colors: fallbackColors,
    };
  }
  return context;
};
