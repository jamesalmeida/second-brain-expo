import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';
import CalendarBottomSheet from './CalendarBottomSheet';

const Header = ({ navigation }) => {
  const { createNewChat } = useChat();
  const { isDarkMode } = useTheme();
  const dateBottomSheetRef = useRef(null);
  const calendarSnapPoints = ['93%'];
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).replace(/^([A-Za-z]+)/, match => match.toUpperCase()); // Capitalize the month

  const handleOpenDateSheet = () => {
    Keyboard.dismiss();
    dateBottomSheetRef.current?.snapToIndex(0);
  };

  const handleSheetChanges = (index) => {
    console.log('handleSheetChanges', index);
  };

  const handleNewChat = () => {
    // Update selected date to current date if it's different
    const currentDate = new Date();
    const currentDateString = currentDate.toDateString();
    const selectedDateString = selectedDate.toDateString();

    if (currentDateString !== selectedDateString) {
      setSelectedDate(currentDate);
    }
    createNewChat();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? 'black' : 'white' }]}>
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Ionicons name="menu" size={24} color={isDarkMode ? 'white' : 'black'} />
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={handleOpenDateSheet}
        style={[
          styles.modelSelector,
          { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }
        ]}
      >
        <Text style={[styles.dateText, { color: isDarkMode ? 'white' : 'black' }]}>
          {formattedDate}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleNewChat}>
        <Ionicons name="create-outline" size={24} color={isDarkMode ? 'white' : 'black'} />
      </TouchableOpacity>

      <CalendarBottomSheet
        bottomSheetRef={dateBottomSheetRef}
        snapPoints={calendarSnapPoints}
        handleSheetChanges={handleSheetChanges}
        isDarkMode={isDarkMode}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateText: {
    // marginLeft: 6,
    fontSize: 16,
  },
  calendarIcon: {
    marginRight: 2,
  },
});

export default Header;
