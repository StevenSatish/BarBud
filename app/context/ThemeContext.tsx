import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'blue' | 'cyan' | 'pink' | 'green' | 'gold'; 

const themeColors: Record<ThemeType, any> = {
  blue: {
    accent: 'rgb(71, 136, 207)',
    button: 'rgb(30, 41, 70)',
    background: 'rgb(15, 23, 42)',
    tabBar: 'rgb(22, 30, 54)'
  },
  cyan: {
    accent: 'rgb(60, 193, 174)',
    button: 'rgb(20, 40, 45)',
    background: 'rgb(12, 28, 32)',
    tabBar: 'rgb(18 38 42)'
  },
  pink: {
    accent: 'rgb(219, 80, 153)',
    button: 'rgb(59, 28, 48)',
    background: 'rgb(32, 18, 28)',
    tabBar: 'rgb(42 22 35)'
  },
  green: {
    accent: 'rgb(102, 207, 140)',
    button: 'rgb(34, 54, 42)',
    background: 'rgb(17, 24, 21)',
    tabBar: 'rgb(25 34 30)'
  },
  gold: {
    accent: 'rgb(223, 154, 95)',
    button: 'rgb(60, 30, 20)',
    background: 'rgb(30, 18, 12)',
    tabBar: 'rgb(40 26 18)'
  }
};

type ThemeContextType = {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: any;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('blue');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setThemeState(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: themeColors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default useTheme; 