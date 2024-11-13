import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsNestedMenu from './SettingsNestedMenu';
import SelectCalendars from './SelectCalendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';
import TimezoneSelector from './TimezoneSelector';
import { CalendarService } from '../../services/CalendarService';

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
  const [calendarCount, setCalendarCount] = useState({ active: 0, total: 0 });
  const [calendars, setCalendars] = useState([]);
  const [defaultCalendar, setDefaultCalendar] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      // Load timezone
      const saved = await AsyncStorage.getItem('selectedTimezone');
      setSelectedTimezone(saved || moment.tz.guess());

      // Load calendars and default calendar
      const fetchedCalendars = await CalendarService.getCalendars();
      const savedDefault = await AsyncStorage.getItem('default_calendar_id');
      
      if (fetchedCalendars && !fetchedCalendars.error) {
        setCalendars(fetchedCalendars);
        
        // Find default calendar
        if (savedDefault) {
          const defaultCal = fetchedCalendars.find(cal => cal.id === savedDefault);
          setDefaultCalendar(defaultCal || null);
        }

        // Load calendar counts
        const savedVisibility = await AsyncStorage.getItem('calendar_visibility');
        const visibilitySettings = savedVisibility ? JSON.parse(savedVisibility) : {};
        
        const totalCalendars = fetchedCalendars.length;
        const activeCalendars = fetchedCalendars.filter(cal => visibilitySettings[cal.id] !== false).length;
        
        setCalendarCount({
          active: activeCalendars,
          total: totalCalendars
        });
      }
    };
    
    loadSettings();
  }, [currentMenu]);

  const handleCalendarSelect = async (calendar) => {
    try {
      const result = await CalendarService.setDefaultCalendar(calendar.title);
      if (result.success) {
        setDefaultCalendar(calendar);
      }
    } catch (error) {
      console.error('Error setting default calendar:', error);
    }
  };

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

  if (currentMenu === 'selectDefault') {
    return (
      <SettingsNestedMenu title="Select Default Calendar" onBack={() => setCurrentMenu('main')} isDarkMode={isDarkMode}>
        <View style={styles.container}>
          {calendars.map(calendar => (
            <TouchableOpacity
              key={calendar.id}
              style={[
                styles.settingItem,
                { borderBottomColor: borderColor },
                defaultCalendar?.id === calendar.id && styles.selectedCalendar
              ]}
              onPress={() => handleCalendarSelect(calendar)}
            >
              <View style={styles.calendarInfo}>
                <Text style={[styles.calendarTitle, { color: textColor }]}>
                  {calendar.title}
                </Text>
                <Text style={[styles.calendarSource, { color: textColor + '80' }]}>
                  {calendar.source}
                </Text>
              </View>
              {defaultCalendar?.id === calendar.id && (
                <Ionicons name="checkmark" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </SettingsNestedMenu>
    );
  }

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
          <>
            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomColor: borderColor }]}
              onPress={() => setCurrentMenu('selectDefault')}
            >
              <Text style={{ color: textColor }}>Default Calendar</Text>
              <View style={styles.settingItemContent}>
                <Text style={{ color: isDarkMode ? '#666666' : '#999999' }}>
                  {defaultCalendar?.title || 'None selected'}
                </Text>
                <Ionicons name="chevron-forward" size={24} color={textColor} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomColor: borderColor }]}
              onPress={() => setCurrentMenu('selectCalendars')}
            >
              <Text style={{ color: textColor }}>Select Calendars</Text>
              <View style={styles.settingItemContent}>
                <Text style={{ color: isDarkMode ? '#666666' : '#999999' }}>
                  {calendarCount.active} of {calendarCount.total} active
                </Text>
                <Ionicons name="chevron-forward" size={24} color={textColor} />
              </View>
            </TouchableOpacity>
          </>
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
  selectedCalendar: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  calendarInfo: {
    flex: 1,
  },
  calendarTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  calendarSource: {
    fontSize: 12,
  }
});

export default CalendarSettings;
