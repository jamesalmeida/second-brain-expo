import React from 'react';
import { View, Text, Switch, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsNestedMenu from './SettingsNestedMenu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OpenAI } from 'openai';

const APIKeySettings = ({ 
  isDarkMode,
  textColor,
  borderColor,
  apiKey,
  setApiKey,
  grokApiKey,
  setGrokApiKey,
  useBuiltInKey,
  isApiKeyValid,
  isApiKeyFrozen,
  isGrokApiKeyValid,
  setIsGrokApiKeyValid,
  isGrokApiKeyFrozen,
  setIsGrokApiKeyFrozen,
  clearApiKey,
  saveApiKey,
  removeApiKey,
  saveGrokApiKey,
  toggleBuiltInKey,
  onBack
}) => {
  return (
    <SettingsNestedMenu title="API Settings" onBack={onBack} isDarkMode={isDarkMode}>
      <View style={styles.container}>
        {/* ADD YOUR OWN OPENAI API KEY */}
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

        {/* ADD YOUR OWN GROK API KEY */}
        <View style={[styles.settingItem, { borderBottomColor: borderColor, opacity: useBuiltInKey ? 0.5 : 1, flexDirection: 'column', alignItems: 'flex-start' }]}>
          <View style={styles.labelContainer}>
            <Text style={{ color: textColor }}>Grok API Key:</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input, 
                { color: textColor, borderColor },
                isGrokApiKeyFrozen && styles.frozenInput
              ]}
              value={grokApiKey}
              onChangeText={setGrokApiKey}
              placeholder="Enter your Grok API key"
              placeholderTextColor={isDarkMode ? '#999' : '#666'}
              secureTextEntry
              editable={!isGrokApiKeyFrozen}
            />
            {grokApiKey.length > 0 && (
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={isGrokApiKeyFrozen ? null : () => setGrokApiKey('')}
                disabled={isGrokApiKeyFrozen}
              >
                <Ionicons 
                  name={isGrokApiKeyFrozen ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={isGrokApiKeyFrozen ? "green" : textColor} 
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.saveButton, isGrokApiKeyValid ? styles.removeButton : null]} 
            onPress={isGrokApiKeyValid ? async () => {
              setGrokApiKey('');
              setIsGrokApiKeyValid(false);
              setIsGrokApiKeyFrozen(false);
              await AsyncStorage.removeItem('grok_api_key');
              await AsyncStorage.removeItem('use_grok_key');
            } : async () => {
              try {
                const openai = new OpenAI({
                  apiKey: grokApiKey,
                  baseURL: "https://api.x.ai/v1"
                });

                const completion = await openai.chat.completions.create({
                  model: "grok-beta",
                  messages: [{ role: "user", content: "Hello" }]
                });

                if (completion) {
                  await AsyncStorage.setItem('grok_api_key', grokApiKey);
                  setIsGrokApiKeyValid(true);
                  setIsGrokApiKeyFrozen(true);
                  console.log('Grok API key saved successfully');
                }
              } catch (error) {
                console.error('Error saving Grok API key:', error);
                Alert.alert('Invalid API Key', 'The provided Grok API key is not valid. Please check and try again.');
              }
            }}
          >
            <Text style={styles.saveButtonText}>
              {isGrokApiKeyValid ? 'Remove' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* USE BUILT-IN API KEY */}
        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={{ color: textColor }}>Use Built-in API Key:</Text>
          <Switch
            value={useBuiltInKey}
            onValueChange={toggleBuiltInKey}
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
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    width: '100%',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    width: '100%',
    marginBottom: 15,
    paddingRight: 40,
  },
  iconButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -18 }],
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
  },
  frozenInput: {
    backgroundColor: '#E0E0E0',
    color: '#888888',
  },
});

export default APIKeySettings;