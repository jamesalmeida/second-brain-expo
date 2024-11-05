import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsNestedMenu from './SettingsNestedMenu';
import { CalendarService } from '../../services/CalendarService';

const SelectCalendars = ({ isDarkMode, onBack, textColor, borderColor }) => {
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendars();
  }, []);

  const loadCalendars = async () => {
    try {
      const savedVisibility = await AsyncStorage.getItem('calendar_visibility');
      const visibilitySettings = savedVisibility ? JSON.parse(savedVisibility) : {};
      
      const fetchedCalendars = await CalendarService.getCalendars();
      if (!fetchedCalendars.error) {
        const calendarsWithVisibility = fetchedCalendars.map(calendar => ({
          ...calendar,
          isVisible: visibilitySettings[calendar.id] !== false
        }));
        setCalendars(calendarsWithVisibility);
      }
    } catch (error) {
      console.error('Error loading calendars:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCalendarVisibility = async (calendarId) => {
    const updatedCalendars = calendars.map(calendar => {
      if (calendar.id === calendarId) {
        return { ...calendar, isVisible: !calendar.isVisible };
      }
      return calendar;
    });
    setCalendars(updatedCalendars);

    // Save visibility settings to AsyncStorage
    const visibilitySettings = {};
    updatedCalendars.forEach(calendar => {
      visibilitySettings[calendar.id] = calendar.isVisible;
    });
    await AsyncStorage.setItem('calendar_visibility', JSON.stringify(visibilitySettings));
  };

  return (
    <SettingsNestedMenu title="Select Calendars" onBack={onBack} isDarkMode={isDarkMode}>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={textColor} style={styles.loader} />
        ) : (
          calendars.map(calendar => (
            <View 
              key={calendar.id} 
              style={[styles.calendarItem, { borderBottomColor: borderColor }]}
            >
              <View style={styles.calendarInfo}>
                <Text style={[styles.calendarTitle, { color: textColor }]}>
                  {calendar.title}
                </Text>
                <Text style={[styles.calendarSource, { color: textColor + '80' }]}>
                  {calendar.source}
                </Text>
              </View>
              <Switch
                value={calendar.isVisible}
                onValueChange={() => toggleCalendarVisibility(calendar.id)}
                trackColor={{ false: '#767577', true: '#34c759' }}
                thumbColor={'#ffffff'}
              />
            </View>
          ))
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
  calendarItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
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
  },
  loader: {
    marginTop: 20,
  }
});

export default SelectCalendars;
