import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsNestedMenu from './SettingsNestedMenu';
import SelectCalendars from './SelectCalendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';
import TimezoneSelector from './TimezoneSelector';

const CalendarSettings = ({ 
  isDarkMode,
  hasCalendarPermission,
  hasReminderPermission,
  toggleCalendarAccess,
  toggleReminderAccess,
  onBack,
  textColor,
  borderColor
}) => {
  const [currentMenu, setCurrentMenu] = useState('main');
  const [selectedTimezone, setSelectedTimezone] = useState('');

  useEffect(() => {
    const loadTimezone = async () => {
      const saved = await AsyncStorage.getItem('selectedTimezone');
      setSelectedTimezone(saved || moment.tz.guess());
    };
    
    loadTimezone();
  }, []);

  const handleTimezoneChange = (newTimezone) => {
    setSelectedTimezone(newTimezone);
    setCurrentMenu('main');
  };

  const handleBack = () => {
    if (currentMenu === 'main') {
      onBack();
    } else {
      setCurrentMenu('main');
    }
  };

  if (currentMenu === 'selectCalendars') {
    return (
      <SelectCalendars
        isDarkMode={isDarkMode}
        onBack={() => setCurrentMenu('main')}
        textColor={textColor}
        borderColor={borderColor}
      />
    );
  }

  if (currentMenu === 'timezone') {
    return (
      <TimezoneSelector
        isDarkMode={isDarkMode}
        onBack={() => setCurrentMenu('main')}
        textColor={textColor}
        borderColor={borderColor}
        onTimezoneSelect={handleTimezoneChange}
      />
    );
  }

  return (
    <SettingsNestedMenu title="Calendar Settings" onBack={handleBack} isDarkMode={isDarkMode}>
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#ffffff' }]}>
        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <View style={styles.settingItemContent}>
            <Text style={{ color: textColor }}>Calendar Access</Text>
            {hasCalendarPermission && (
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color="green" 
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
          <Switch
            value={hasCalendarPermission}
            onValueChange={toggleCalendarAccess}
          />
        </View>

        {hasCalendarPermission && (
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: borderColor }]}
            onPress={() => setCurrentMenu('selectCalendars')}
          >
            <Text style={{ color: textColor }}>Select Calendars</Text>
            <Ionicons name="chevron-forward" size={24} color={textColor} />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: borderColor }]}
          onPress={() => setCurrentMenu('timezone')}
        >
          <Text style={{ color: textColor }}>Timezone</Text>
          <View style={styles.settingItemContent}>
            <Text style={{ color: isDarkMode ? '#666666' : '#999999' }}>
              {selectedTimezone}
            </Text>
            <Ionicons name="chevron-forward" size={24} color={textColor} />
          </View>
        </TouchableOpacity>

        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <View style={styles.settingItemContent}>
            <Text style={{ color: textColor }}>Reminders Access</Text>
            {hasReminderPermission && (
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color="green" 
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
          <Switch
            value={hasReminderPermission}
            onValueChange={toggleReminderAccess}
          />
        </View>
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
  option: {
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionText: {
    fontSize: 16,
  },
  optionDetail: {
    fontSize: 14,
  },
});

export default CalendarSettings;
