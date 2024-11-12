import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';
import SettingsNestedMenu from './SettingsNestedMenu';

const TimezoneSelector = ({ isDarkMode, onBack, textColor, borderColor }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timezones, setTimezones] = useState([]);
  const [selectedTimezone, setSelectedTimezone] = useState('');

  useEffect(() => {
    const loadTimezones = async () => {
      const allTimezones = moment.tz.names();
      setTimezones(allTimezones);
      
      // Load saved timezone
      const saved = await AsyncStorage.getItem('selectedTimezone');
      setSelectedTimezone(saved || moment.tz.guess());
    };
    
    loadTimezones();
  }, []);

  const filteredTimezones = timezones.filter(tz => 
    tz.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTimezoneSelect = async (timezone) => {
    setSelectedTimezone(timezone);
    await AsyncStorage.setItem('selectedTimezone', timezone);
    onBack();
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
              <Text style={[styles.timezoneText, { color: textColor }]}>
                {item}
              </Text>
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
  checkmark: {
    color: '#007AFF',
    fontSize: 18,
  },
});

export default TimezoneSelector; 