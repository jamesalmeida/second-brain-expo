import * as Location from 'expo-location';

export const LocationService = {
  getCurrentLocation: async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return {
          success: false,
          message: 'Location permission is required to use this feature'
        };
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        success: true,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return {
        success: false,
        message: 'Failed to get current location'
      };
    }
  },

  searchNearbyPlaces: async (query) => {
    try {
      const locationResult = await LocationService.getCurrentLocation();
      if (!locationResult.success) {
        return locationResult;
      }

      // You'll need to implement your own place search here
      // Could use Google Places API, Foursquare API, etc.
      // Return array of nearby places matching the query
      
      return {
        success: true,
        places: [] // Array of nearby places
      };
    } catch (error) {
      console.error('Error searching places:', error);
      return {
        success: false,
        message: 'Failed to search nearby places'
      };
    }
  }
};
