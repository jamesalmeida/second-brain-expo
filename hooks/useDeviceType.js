import { Platform, Dimensions } from 'react-native';

export const useDeviceType = () => {
  const { width, height } = Dimensions.get('window');
  const isTablet = Platform.isPad || (Platform.OS === 'ios' && Math.min(width, height) >= 768);
  
  return {
    isTablet,
    width,
    height
  };
};
