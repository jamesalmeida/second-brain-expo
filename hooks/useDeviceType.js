import { Platform, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';

export const useDeviceType = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  const isTablet = Platform.isPad || (Platform.OS === 'ios' && Math.min(dimensions.width, dimensions.height) >= 768);
  
  return {
    isTablet,
    width: dimensions.width,
    height: dimensions.height
  };
};
