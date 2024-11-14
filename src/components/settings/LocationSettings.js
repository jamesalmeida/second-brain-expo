import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsNestedMenu from './SettingsNestedMenu';
import SavedLocationsMenu from './SavedLocationsMenu';

const LocationSettings = ({ 
  isDarkMode,
  hasLocationPermission,
  toggleLocationAccess,
  onBack,
  textColor,
  borderColor
}) => {
  const [currentMenu, setCurrentMenu] = useState('main');

  if (currentMenu === 'savedLocations') {
    return (
      <SavedLocationsMenu
        isDarkMode={isDarkMode}
        onBack={() => setCurrentMenu('main')}
        textColor={textColor}
        borderColor={borderColor}
      />
    );
  }

  return (
    <SettingsNestedMenu title="Location Settings" onBack={onBack} isDarkMode={isDarkMode}>
      <View style={styles.container}>
        {/* LOCATION ACCESS */}
        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <View style={styles.settingItemContent}>
            <Text style={{ color: textColor }}>Location Access</Text>
            {hasLocationPermission && (
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color="green" 
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
          <Switch
            value={hasLocationPermission}
            onValueChange={toggleLocationAccess}
            trackColor={{ false: '#767577', true: '#34c759' }}
            thumbColor={'#ffffff'}
            ios_backgroundColor="#767577"
          />
        </View>

        {hasLocationPermission && (
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: borderColor }]}
            onPress={() => setCurrentMenu('savedLocations')}
          >
            <Text style={{ color: textColor }}>Saved Locations</Text>
            <View style={styles.settingItemContent}>
              <Ionicons name="chevron-forward" size={24} color={textColor} />
            </View>
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 15,
    borderBottomWidth: 1,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default LocationSettings;