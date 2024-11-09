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
  const snapPoints = ['88%'];
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handleOpenDateSheet = () => {
    Keyboard.dismiss();
    dateBottomSheetRef.current?.snapToIndex(0);
  };

  const handleSheetChanges = (index) => {
    console.log('handleSheetChanges', index);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? 'black' : 'white' }]}>
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Ionicons name="menu" size={24} color={isDarkMode ? 'white' : 'black'} />
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={handleOpenDateSheet}
        style={styles.modelSelector}
      >
        <Ionicons 
          name="calendar-outline" 
          size={20} 
          color={isDarkMode ? 'white' : 'black'} 
          style={styles.calendarIcon}
        />
        <Text style={[styles.dateText, { color: isDarkMode ? 'white' : 'black' }]}>{currentDate}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={createNewChat}>
        <Ionicons name="add" size={24} color={isDarkMode ? 'white' : 'black'} />
      </TouchableOpacity>

      <CalendarBottomSheet
        bottomSheetRef={dateBottomSheetRef}
        snapPoints={snapPoints}
        handleSheetChanges={handleSheetChanges}
        isDarkMode={isDarkMode}
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
  },
  dateText: {
    marginRight: 5,
  },
  calendarIcon: {
    paddingRight: 5,
  },
});

export default Header;
