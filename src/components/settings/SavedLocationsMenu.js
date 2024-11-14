import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsNestedMenu from './SettingsNestedMenu';
import * as Location from 'expo-location';

const SavedLocationsMenu = ({ isDarkMode, onBack, textColor, borderColor }) => {
  const [savedLocations, setSavedLocations] = useState([]);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');

  useEffect(() => {
    loadSavedLocations();
  }, []);

  const loadSavedLocations = async () => {
    try {
      const locations = await AsyncStorage.getItem('saved_locations');
      if (locations) {
        setSavedLocations(JSON.parse(locations));
      }
    } catch (error) {
      console.error('Error loading saved locations:', error);
    }
  };

  const saveLocation = async (name) => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to save your current location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        id: Date.now().toString(),
        name,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      const updatedLocations = [...savedLocations, newLocation];
      await AsyncStorage.setItem('saved_locations', JSON.stringify(updatedLocations));
      setSavedLocations(updatedLocations);
      setIsAddingLocation(false);
      setNewLocationName('');
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    }
  };

  const deleteLocation = async (id) => {
    try {
      const updatedLocations = savedLocations.filter(location => location.id !== id);
      await AsyncStorage.setItem('saved_locations', JSON.stringify(updatedLocations));
      setSavedLocations(updatedLocations);
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) {
      Alert.alert('Error', 'Please enter a location name');
      return;
    }
    saveLocation(newLocationName.trim());
  };

  return (
    <SettingsNestedMenu title="Saved Locations" onBack={onBack} isDarkMode={isDarkMode}>
      <View style={styles.container}>
        {savedLocations.map(location => (
          <View 
            key={location.id} 
            style={[styles.locationItem, { borderBottomColor: borderColor }]}
          >
            <Text style={[styles.locationName, { color: textColor }]}>
              {location.name}
            </Text>
            <TouchableOpacity 
              onPress={() => deleteLocation(location.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}

        {isAddingLocation ? (
          <View style={[styles.addLocationContainer, { borderBottomColor: borderColor }]}>
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              value={newLocationName}
              onChangeText={setNewLocationName}
              placeholder="Location name"
              placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setIsAddingLocation(false);
                  setNewLocationName('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleAddLocation}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.addButton, { borderColor }]}
            onPress={() => setIsAddingLocation(true)}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
            <Text style={{ color: '#007AFF' }}>Add Location</Text>
          </TouchableOpacity>
        )}
      </View>
    </SettingsNestedMenu>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  locationName: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 5,
  },
  addLocationContainer: {
    padding: 15,
    borderBottomWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 5,
    margin: 15,
  },
});

export default SavedLocationsMenu;