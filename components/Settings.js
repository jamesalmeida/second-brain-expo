import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '../contexts/ThemeContext';
import { useChat } from '../contexts/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Settings = ({ bottomSheetRef, snapPoints, handleSheetChanges, renderBackdrop }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { apiKey, setApiKey, useBuiltInKey, setUseBuiltInKey } = useChat();

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const storedApiKey = await AsyncStorage.getItem('openai_api_key');
      if (storedApiKey !== null) {
        setApiKey(storedApiKey);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  };

  const saveApiKey = async () => {
    try {
      await AsyncStorage.setItem('openai_api_key', apiKey);
      if (apiKey) {
        setUseBuiltInKey(false);
        await AsyncStorage.setItem('use_built_in_key', 'false');
      }
      console.log('API key saved successfully');
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const toggleBuiltInKey = async () => {
    const newValue = !useBuiltInKey;
    setUseBuiltInKey(newValue);
    await AsyncStorage.setItem('use_built_in_key', JSON.stringify(newValue));
  };

  const backgroundColor = isDarkMode ? '#1c1c1e' : 'white';
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
        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={{ color: textColor }}>Use Built-in API Key:</Text>
          <Switch
            value={useBuiltInKey}
            onValueChange={toggleBuiltInKey}
          />
        </View>
        <View style={[styles.settingItem, { borderBottomColor: borderColor, opacity: useBuiltInKey ? 0.5 : 1 }]}>
          <Text style={{ color: textColor }}>Use Your Own OpenAI API Key:</Text>
          <TextInput
            style={[styles.input, { color: textColor, borderColor }]}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter your OpenAI API key"
            placeholderTextColor={isDarkMode ? '#999' : '#666'}
            secureTextEntry
            editable={!useBuiltInKey}
          />
          <TouchableOpacity style={styles.saveButton} onPress={saveApiKey} disabled={useBuiltInKey}>
            <Text style={[styles.saveButtonText, useBuiltInKey && { opacity: 0.5 }]}>Save</Text>
          </TouchableOpacity>
        </View>
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
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Settings;
