import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';
import SettingsNestedMenu from './SettingsNestedMenu';

// Common/major timezones list
const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland'
];

const formatTimezoneName = (tz) => {
  const parts = tz.split('/');
  return parts[parts.length - 1].replace(/_/g, ' ');
};

const TimezoneSelector = ({ isDarkMode, onBack, textColor, borderColor, onTimezoneSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timezones, setTimezones] = useState([]);
  const [selectedTimezone, setSelectedTimezone] = useState('');

  useEffect(() => {
    const loadTimezones = async () => {
      // Get the current timezone
      const currentTimezone = moment.tz.guess();
      
      // If the current timezone isn't in our common list, add it
      const tzList = COMMON_TIMEZONES.includes(currentTimezone) 
        ? COMMON_TIMEZONES 
        : [currentTimezone, ...COMMON_TIMEZONES];
      
      setTimezones(tzList);
      
      // Load saved timezone
      const saved = await AsyncStorage.getItem('selectedTimezone');
      setSelectedTimezone(saved || currentTimezone);
    };
    
    loadTimezones();
  }, []);

  const filteredTimezones = timezones.filter(tz => 
    formatTimezoneName(tz).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTimezoneSelect = async (timezone) => {
    setSelectedTimezone(timezone);
    await AsyncStorage.setItem('selectedTimezone', timezone);
    onTimezoneSelect(timezone);
  };

  const renderTimezone = (tz) => {
    const offset = moment.tz(tz).format('Z');
    const name = formatTimezoneName(tz);
    const currentTime = moment.tz(tz).format('HH:mm');
    
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.timezoneText, { color: textColor }]}>
            {name}
          </Text>
          <Text style={[styles.timezoneDetail, { color: isDarkMode ? '#666666' : '#999999' }]}>
            GMT{offset}
          </Text>
        </View>
        <Text style={[styles.currentTime, { color: isDarkMode ? '#666666' : '#999999' }]}>
          {currentTime}
        </Text>
      </View>
    );
  };

  return (
    <SettingsNestedMenu title="Select Timezone" onBack={onBack} isDarkMode={isDarkMode}>
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#ffffff' }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: isDarkMode ? '#1c1c1e' : '#f2f2f7',
              color: textColor,
              borderColor: borderColor
            }
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search timezone..."
          placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
        />
        <FlatList
          data={filteredTimezones}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleTimezoneSelect(item)}
              style={[
                styles.timezoneItem,
                { borderBottomColor: borderColor }
              ]}
            >
              {renderTimezone(item)}
              {selectedTimezone === item && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>
          )}
        />
      </View>
    </SettingsNestedMenu>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  searchInput: {
    margin: 10,
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
  },
  timezoneItem: {
    padding: 15,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timezoneText: {
    fontSize: 16,
  },
  timezoneDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  currentTime: {
    fontSize: 14,
    marginLeft: 8,
  },
  checkmark: {
    color: '#007AFF',
    fontSize: 18,
    marginLeft: 8,
  },
});

export default TimezoneSelector; 