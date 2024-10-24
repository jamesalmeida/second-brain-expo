import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '../contexts/ThemeContext';
import { useChat } from '../contexts/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Slider from '@react-native-community/slider';

const Settings = ({ bottomSheetRef, snapPoints, handleSheetChanges, renderBackdrop }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { apiKey, setApiKey, useBuiltInKey, setUseBuiltInKey, builtInKeyCode } = useChat();
  const [isCodeModalVisible, setIsCodeModalVisible] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [isApiKeyFrozen, setIsApiKeyFrozen] = useState(false);

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
      // Verify the API key
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      if (response.status === 200) {
        // API key is valid
        await AsyncStorage.setItem('openai_api_key', apiKey);
        setIsApiKeyValid(true);
        setIsApiKeyFrozen(true);
        setUseBuiltInKey(false);
        await AsyncStorage.setItem('use_built_in_key', 'false');
        console.log('API key saved successfully');
      } else {
        // API key is invalid
        setIsApiKeyValid(false);
        setIsApiKeyFrozen(false);
        Alert.alert('Invalid API Key', 'The provided API key is not valid. Please check and try again.');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      setIsApiKeyValid(false);
      setIsApiKeyFrozen(false);
      Alert.alert('Error', 'Failed to verify API key. Please check your internet connection and try again.');
    }
  };

  const toggleBuiltInKey = () => {
    if (!useBuiltInKey) {
      setIsCodeModalVisible(true);
    } else {
      setUseBuiltInKey(false);
      saveBuiltInKeyState(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (enteredCode === builtInKeyCode) {
      setUseBuiltInKey(true);
      await saveBuiltInKeyState(true);
      setIsCodeModalVisible(false);
      setEnteredCode('');
    } else {
      Alert.alert('Incorrect Code', 'Please try again.');
    }
  };

  const saveBuiltInKeyState = async (state) => {
    try {
      await AsyncStorage.setItem('use_built_in_key', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving built-in key state:', error);
    }
  };

  const backgroundColor = isDarkMode ? '#1c1c1e' : 'white';
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const borderColor = isDarkMode ? '#2c2c2e' : '#cccccc';

  const handleCloseModal = () => {
    setIsCodeModalVisible(false);
    setEnteredCode('');
  };

  const removeApiKey = async () => {
    try {
      await AsyncStorage.removeItem('openai_api_key');
      setApiKey('');
      setIsApiKeyValid(false);
      setIsApiKeyFrozen(false);
      console.log('API key removed successfully');
    } catch (error) {
      console.error('Error removing API key:', error);
    }
  };

  const clearApiKey = () => {
    setApiKey('');
    setIsApiKeyValid(false);
    setIsApiKeyFrozen(false);
  };

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

        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={{ color: textColor }}>
            {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
          />
        </View>

        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={{ color: textColor }}>Use Built-in API Key:</Text>
          <Switch
            value={useBuiltInKey}
            onValueChange={toggleBuiltInKey}
          />
        </View>

        <View style={[styles.settingItem, { borderBottomColor: borderColor, opacity: useBuiltInKey ? 0.5 : 1, flexDirection: 'column', alignItems: 'flex-start' }]}>
          <View style={styles.labelContainer}>
            <Text style={{ color: textColor }}>Use Your Own OpenAI API Key:</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input, 
                { color: textColor, borderColor },
                isApiKeyFrozen && styles.frozenInput
              ]}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Enter your OpenAI API key"
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
              secureTextEntry
              editable={!useBuiltInKey && !isApiKeyFrozen}
            />
            {apiKey.length > 0 && (
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={isApiKeyFrozen ? null : clearApiKey}
                disabled={isApiKeyFrozen}
              >
                <Ionicons 
                  name={isApiKeyFrozen ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={isApiKeyFrozen ? "green" : textColor} 
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.saveButton, isApiKeyValid ? styles.removeButton : null]} 
            onPress={isApiKeyValid ? removeApiKey : saveApiKey} 
            disabled={useBuiltInKey}
          >
            <Text style={[styles.saveButtonText, useBuiltInKey && { opacity: 0.5 }]}>
              {isApiKeyValid ? 'Remove' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={{ color: textColor }}>AI Voice On/Off</Text>
          <Switch
            value={false} // Placeholder value
            onValueChange={() => {}} // Placeholder function
          />
        </View>

        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={{ color: textColor }}>Choose AI Voice</Text>
        </TouchableOpacity>

        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={{ color: textColor }}>AI Voice Speed</Text>
          <Slider
            style={{width: 200, height: 40}}
            minimumValue={0}
            maximumValue={1}
            value={0.5} // Placeholder value
            onValueChange={() => {}} // Placeholder function
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#000000"
          />
        </View>

        {/* TODO: Add more settings options */}
      </BottomSheetView>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isCodeModalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Enter Code to Enable Built-in API Key</Text>
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              value={enteredCode}
              onChangeText={setEnteredCode}
              placeholder="Enter code"
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
              keyboardType="numeric"
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={handleCloseModal}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.submitButton]} 
                onPress={handleCodeSubmit}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 15,
    paddingRight: 40, // Make room for the icon
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
    width: '100%', // Make the button full width
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '48%', // Adjust this value to control button width
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    width: '100%',
    justifyContent: 'space-between',
  },
  checkmarkContainer: {
    marginLeft: 10,
  },
  frozenInput: {
    backgroundColor: '#E0E0E0',
    color: '#888888',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -12 }], // Half the icon size to center it
  },
  iconButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -18 }], // Changed from -12 to -18
  },
});

export default Settings;
