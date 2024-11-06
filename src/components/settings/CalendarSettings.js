import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsNestedMenu from './SettingsNestedMenu';
import SelectCalendars from './SelectCalendars';

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

  return (
    <SettingsNestedMenu title="Calendar Settings" onBack={handleBack} isDarkMode={isDarkMode}>
      <View style={styles.container}>
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
});

export default CalendarSettings;
