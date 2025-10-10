import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'blue' | 'cyan' | 'pink' | 'green' | 'orange'; 

const themeColors: Record<ThemeType, any> = {
  blue: {
    background: 'rgb(10, 15, 28)',     // darkest background
    tab:        'rgb(18, 24, 38)',     // dark navy surface for nav/tab bar
    button:     'rgb(22, 32, 56)',     // button, cards, overlays
    accent:     'rgb(58, 112, 172)',   // muted blue accent
    light:      'rgb(140, 175, 220)',  //  soft light blue highlight
    steelGray:  'rgb(85, 95, 110)',    // neutral gray-blue for text/icons
    lightGray:  'rgb(120, 135, 155)',  // muted gray-blue panels
  },
  cyan: {
    background: 'rgb(8, 18, 22)',      // deep teal-black background
    tab:        'rgb(14, 26, 32)',     // dark cyan surface
    button:     'rgb(18, 36, 44)',     // CTA, dark cyan
    accent:     'rgb(45, 150, 160)',   // muted teal accent
    light:      'rgb(130, 195, 200)',  // soft pale teal highlight
    steelGray:  'rgb(85, 105, 110)',   // dark gray with cyan tint
    lightGray:  'rgb(130, 150, 155)',  // desaturated cyan-gray panel
  },
  pink: {
    background: 'rgb(25, 12, 20)',     // deep pink-black background
    tab:        'rgb(32, 18, 28)',     // soft plum tab bar
    button:     'rgb(45, 20, 35)',     // dark burgundy-pink button
    accent:     'rgb(185, 75, 130)',   // muted rose accent
    light:      'rgb(225, 155, 185)',  // soft pink highlight
    steelGray:  'rgb(100, 85, 95)',    // pinkish neutral text
    lightGray:  'rgb(145, 130, 140)',  // rose-gray panels
  },
  green: {
    background: 'rgb(8, 15, 10)',      // near-black green background
    tab:        'rgb(14, 24, 16)',     // dark forest tab bar
    button:     'rgb(20, 45, 28)',     // moss green CTA
    accent:     'rgb(70, 150, 95)',    // muted forest accent
    light:      'rgb(150, 195, 160)',  // pale green highlight
    steelGray:  'rgb(90, 105, 95)',    // gray-green text
    lightGray:  'rgb(140, 155, 145)',  // moss-gray panels
  },
  orange: {
    background: 'rgb(18, 10, 6)',      // dark brown-black background
    tab:        'rgb(26, 15, 10)',     // warm neutral tab bar
    button:     'rgb(45, 25, 15)',     // bronze button
    accent:     'rgb(200, 120, 60)',   // muted amber accent
    light:      'rgb(225, 175, 130)',  // light orange highlight
    steelGray:  'rgb(100, 90, 80)',    // dark neutral gray-brown
    lightGray:  'rgb(150, 135, 120)',  // beige-gray panels
  },
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
        const isValidSavedTheme = !!savedTheme && savedTheme in themeColors;
        if (isValidSavedTheme) {
          setThemeState(savedTheme as ThemeType);
        } else {
          // Fallback to default and clean up any invalid persisted theme
          setThemeState('blue');
          if (savedTheme && !(savedTheme in themeColors)) {
            await AsyncStorage.removeItem('theme');
          }
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