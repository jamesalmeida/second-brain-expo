import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, TextInput, Modal, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '../contexts/ThemeContext';
import { useChat } from '../contexts/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Slider from '@react-native-community/slider';
import { OpenAI } from 'openai';
import * as Calendar from 'expo-calendar';
import * as Location from 'expo-location';
import APISettings from './settings/APIKeySettings';
import CalendarSettings from './settings/CalendarSettings';
import SettingsNestedMenu from './settings/SettingsNestedMenu';
import AIModelsSettings from './settings/AIModelsSettings';

const Settings = ({ bottomSheetRef, snapPoints, handleSheetChanges, renderBackdrop }) => {
  const { isDarkMode, themePreference, setTheme } = useTheme();
  const { 
    apiKey, setApiKey, 
    grokApiKey, setGrokApiKey,
    useBuiltInKey, setUseBuiltInKey,
    useGrokKey, setUseGrokKey,
    builtInKeyCode 
  } = useChat();
  const [isCodeModalVisible, setIsCodeModalVisible] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [isApiKeyFrozen, setIsApiKeyFrozen] = useState(false);
  const [isGrokApiKeyValid, setIsGrokApiKeyValid] = useState(false);
  const [isGrokApiKeyFrozen, setIsGrokApiKeyFrozen] = useState(false);
  const [hasCalendarPermission, setHasCalendarPermission] = useState(false);
  const [hasReminderPermission, setHasReminderPermission] = useState(false);
  const [showCalendarSuccess, setShowCalendarSuccess] = useState(false);
  const [showReminderSuccess, setShowReminderSuccess] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [showLocationSuccess, setShowLocationSuccess] = useState(false);
  const [currentMenu, setCurrentMenu] = useState('main');
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadApiKey();
    checkPermissions();
  }, []);

  useEffect(() => {
    const loadPermissions = async () => {
      const calendarPerm = await AsyncStorage.getItem('calendar_permission');
      if (calendarPerm === 'granted') {
        const { status } = await Calendar.getCalendarPermissionsAsync();
        setHasCalendarPermission(status === 'granted');
      }
      
      const reminderPerm = await AsyncStorage.getItem('reminder_permission');
      if (reminderPerm === 'granted') {
        const { status } = await Calendar.getRemindersPermissionsAsync();
        setHasReminderPermission(status === 'granted');
      }
    };
    
    loadPermissions();
  }, []);

  const loadApiKey = async () => {
    try {
      const storedApiKey = await AsyncStorage.getItem('openai_api_key');
      if (storedApiKey !== null) {
        setApiKey(storedApiKey);
        setIsApiKeyValid(true);
        setIsApiKeyFrozen(true);
      }

      const storedGrokApiKey = await AsyncStorage.getItem('grok_api_key');
      if (storedGrokApiKey !== null) {
        setGrokApiKey(storedGrokApiKey);
        setIsGrokApiKeyValid(true);
        setIsGrokApiKeyFrozen(true);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  };

  const saveApiKey = async () => {
    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://api.openai.com/v1",
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      if (completion) {
        await AsyncStorage.setItem('openai_api_key', apiKey);
        setIsApiKeyValid(true);
        setIsApiKeyFrozen(true);
        setUseBuiltInKey(false);
        await AsyncStorage.setItem('use_built_in_key', 'false');
        console.log('API key saved successfully');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      setIsApiKeyValid(false);
      setIsApiKeyFrozen(false);
      Alert.alert('Error', 'Failed to verify API key. Please check your API key and try again.');
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

  const saveGrokApiKey = async () => {
    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${grokApiKey}`,
          "X-Api-Key": grokApiKey
        },
        body: JSON.stringify({
          model: "grok-beta",
          messages: [{ role: "user", content: "Hello" }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data) {
        await AsyncStorage.setItem('grok_api_key', grokApiKey);
        setIsGrokApiKeyValid(true);
        setIsGrokApiKeyFrozen(true);
        setUseGrokKey(true);
        await AsyncStorage.setItem('use_grok_key', 'true');
        console.log('Grok API key saved successfully');
      }
    } catch (error) {
      console.error('Error saving Grok API key:', error);
      setIsGrokApiKeyValid(false);
      setIsGrokApiKeyFrozen(false);
      Alert.alert('Invalid API Key', 'The provided Grok API key is not valid. Please check and try again.');
    }
  };

  const checkPermissions = async () => {
    const calendarStatus = await Calendar.getCalendarPermissionsAsync();
    console.log('Initial calendar permission status:', calendarStatus.status);
    setHasCalendarPermission(calendarStatus.status === 'granted');
    
    const reminderStatus = await Calendar.getRemindersPermissionsAsync();
    console.log('Initial reminder permission status:', reminderStatus.status);
    setHasReminderPermission(reminderStatus.status === 'granted');
    
    const locationStatus = await Location.getForegroundPermissionsAsync();
    console.log('Initial location permission status:', locationStatus.status);
    setHasLocationPermission(locationStatus.status === 'granted');
  };

  const toggleCalendarAccess = async () => {
    console.log('Attempting to toggle calendar access. Current status:', hasCalendarPermission);
    if (!hasCalendarPermission) {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      console.log('Calendar permission request response:', status);
      if (status === 'granted') {
        setHasCalendarPermission(true);
        await AsyncStorage.setItem('calendar_permission', 'granted');
        setShowCalendarSuccess(true);
        setTimeout(() => setShowCalendarSuccess(false), 2000);
      }
    } else {
      Alert.alert(
        'Revoke Calendar Access',
        'To revoke calendar access, please go to your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleReminderAccess = async () => {
    console.log('Attempting to toggle reminder access. Current status:', hasReminderPermission);
    if (!hasReminderPermission) {
      const { status } = await Calendar.requestRemindersPermissionsAsync();
      console.log('Reminder permission request response:', status);
      if (status === 'granted') {
        setHasReminderPermission(true);
        setShowReminderSuccess(true);
        setTimeout(() => setShowReminderSuccess(false), 2000);
      }
    } else {
      Alert.alert(
        'Revoke Reminders Access',
        'To revoke reminders access, please go to your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleLocationAccess = async () => {
    console.log('Attempting to toggle location access. Current status:', hasLocationPermission);
    if (!hasLocationPermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission request response:', status);
      if (status === 'granted') {
        setHasLocationPermission(true);
        setShowLocationSuccess(true);
        setTimeout(() => setShowLocationSuccess(false), 2000);
      }
    } else {
      Alert.alert(
        'Revoke Location Access',
        'To revoke location access, please go to your device settings.',
        [{ text: 'OK' }]
      );
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

  const slideToCalendarSettings = () => {
    setCurrentMenu('calendar');
    Animated.timing(slideAnim, {
      toValue: -1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const slideBackToMain = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setCurrentMenu('main'));
  };

  const handleMenuTransition = (menuName) => {
    Animated.timing(slideAnim, {
      toValue: -1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setCurrentMenu(menuName));
  };

  const handleSheetClose = (index) => {
    if (index === -1) {
      setCurrentMenu('main');
      slideAnim.setValue(0);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetClose}
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

        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [-1, 0],
                    outputRange: [-400, 0]
                  })
                }
              ]
            }
          ]}
        >
          <View style={styles.titleContainer}>
            <Text style={[styles.settingsTitle, { color: textColor }]}>🧠 Settings</Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => bottomSheetRef.current?.close()}
          >
            <Ionicons name="close-circle-outline" size={30} color={textColor} />
          </TouchableOpacity>

          {/* CHANGE APP THEME */}
          <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
            <Text style={{ color: textColor }}>Theme</Text>
            <View style={styles.themeButtonGroup}>
              <TouchableOpacity 
                style={[
                  styles.themeButton, 
                  themePreference === 'light' && styles.activeThemeButton,
                  { borderColor }
                ]}
                onPress={() => setTheme('light')}
              >
                <Ionicons name="sunny" size={20} color={textColor} />
                <Text style={{ color: textColor, marginLeft: 5 }}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.themeButton, 
                  themePreference === 'system' && styles.activeThemeButton,
                  { borderColor }
                ]}
                onPress={() => setTheme('system')}
              >
                <Ionicons name="phone-portrait" size={20} color={textColor} />
                <Text style={{ color: textColor, marginLeft: 5 }}>System</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.themeButton, 
                  themePreference === 'dark' && styles.activeThemeButton,
                  { borderColor }
                ]}
                onPress={() => setTheme('dark')}
              >
                <Ionicons name="moon" size={20} color={textColor} />
                <Text style={{ color: textColor, marginLeft: 5 }}>Dark</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* API Key Settings Button */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: borderColor }]}
            onPress={() => {
              setCurrentMenu('api');
              Animated.timing(slideAnim, {
                toValue: -1,
                duration: 300,
                useNativeDriver: true,
              }).start();
            }}
          >
            <Text style={{ color: textColor }}>API Keys</Text>
            <Ionicons name="chevron-forward" size={24} color={textColor} />
          </TouchableOpacity>

          {/* Calendar Settings Button */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: borderColor }]}
            onPress={slideToCalendarSettings}
          >
            <Text style={{ color: textColor }}>Calendar & Reminders Settings</Text>
            <Ionicons name="chevron-forward" size={24} color={textColor} />
          </TouchableOpacity>

          {/* AI Models */}
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: borderColor }]}
            onPress={() => handleMenuTransition('aimodels')}
          >
            <Text style={{ color: textColor }}>AI Models</Text>
            <Ionicons name="chevron-forward" size={24} color={textColor} />
          </TouchableOpacity>

          {/* LOCATION ACCESS */}
          <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
            <View style={styles.settingItemContent}>
              <Text style={{ color: textColor }}>Location Access</Text>
              {hasLocationPermission && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={24} 
                  color="green" 
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>
            <Switch
              value={hasLocationPermission}
              onValueChange={toggleLocationAccess}
              trackColor={{ false: '#767577', true: '#34c759' }}
              thumbColor={'#ffffff'}
              ios_backgroundColor="#767577"
            />
          </View>

        </Animated.View>

        <Animated.View
          style={[
            styles.menuContainer,
            styles.overlayMenu,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [-1, 0],
                    outputRange: [0, 400]
                  })
                }
              ]
            }
          ]}
        >
          {currentMenu === 'api' && (
            <APISettings
              isDarkMode={isDarkMode}
              textColor={textColor}
              borderColor={borderColor}
              apiKey={apiKey}
              setApiKey={setApiKey}
              grokApiKey={grokApiKey}
              setGrokApiKey={setGrokApiKey}
              useBuiltInKey={useBuiltInKey}
              isApiKeyValid={isApiKeyValid}
              isApiKeyFrozen={isApiKeyFrozen}
              isGrokApiKeyValid={isGrokApiKeyValid}
              setIsGrokApiKeyValid={setIsGrokApiKeyValid}
              isGrokApiKeyFrozen={isGrokApiKeyFrozen}
              setIsGrokApiKeyFrozen={setIsGrokApiKeyFrozen}
              clearApiKey={clearApiKey}
              saveApiKey={saveApiKey}
              removeApiKey={removeApiKey}
              saveGrokApiKey={saveGrokApiKey}
              toggleBuiltInKey={toggleBuiltInKey}
              onBack={slideBackToMain}
            />
          )}
          {currentMenu === 'calendar' && (
            <CalendarSettings
              isDarkMode={isDarkMode}
              hasCalendarPermission={hasCalendarPermission}
              hasReminderPermission={hasReminderPermission}
              toggleCalendarAccess={toggleCalendarAccess}
              toggleReminderAccess={toggleReminderAccess}
              onBack={slideBackToMain}
              textColor={textColor}
              borderColor={borderColor}
            />
          )}
          {currentMenu === 'aimodels' && (
            <Animated.View
              style={[
                styles.menuContainer,
                styles.overlayMenu,
                { transform: [{ translateX: slideAnim }] }
              ]}
            >
              <AIModelsSettings
                isDarkMode={isDarkMode}
                textColor={textColor}
                borderColor={borderColor}
                onBack={() => {
                  slideBackToMain();
                }}
              />
            </Animated.View>
          )}
        </Animated.View>
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
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  themeButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeThemeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  grantedButton: {
    backgroundColor: '#34C759',
  },
  columnSettingItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  permissionStatus: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 8,
  },
  settingControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successIcon: {
    marginRight: 8,
  },
  menuContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'inherit',
    left: 0,
  },
  overlayMenu: {
    left: 0,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});

export default Settings;
