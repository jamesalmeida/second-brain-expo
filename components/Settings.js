import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '../contexts/ThemeContext';

const Settings = ({ bottomSheetRef, snapPoints, handleSheetChanges, renderBackdrop }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const backgroundColor = isDarkMode ? '#1c1c1e' : 'white'; // Dark gray for dark mode
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const borderColor = isDarkMode ? '#2c2c2e' : '#cccccc';

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: isDarkMode ? '#ffffff' : '#000000' }}
      backgroundStyle={{ backgroundColor }}
    >
      <BottomSheetView style={[styles.bottomSheetContent, { backgroundColor }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => bottomSheetRef.current?.close()}
        >
          <Ionicons name="close-circle-outline" size={30} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.settingsTitle, { color: textColor }]}>Settings</Text>
        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={{ color: textColor }}>
            {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
          />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={{ color: textColor }}>
            AI Voice On/Off
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={{ color: textColor }}>
            Choose AI Voice 
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={{ color: textColor }}>
            AI Voice Speed
          </Text>
        </TouchableOpacity>
        {/* TODO: Add more settings options */}
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingItem: {
    width: '100%',
    padding: 15,
    borderBottomWidth: 1,
  },
});

export default Settings;
