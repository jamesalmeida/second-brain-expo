import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState('system'); // 'light', 'dark', or 'system'
  const [isDarkMode, setIsDarkMode] = useState(deviceColorScheme === 'dark');

  useEffect(() => {
    if (themePreference === 'system') {
      setIsDarkMode(deviceColorScheme === 'dark');
    }
  }, [deviceColorScheme, themePreference]);

  const setTheme = (preference) => {
    setThemePreference(preference);
    if (preference !== 'system') {
      setIsDarkMode(preference === 'dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, themePreference, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

