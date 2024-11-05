import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsNestedMenu from './SettingsNestedMenu';
import { useChat } from '../../contexts/ChatContext';

const AIModelsSettings = ({ 
  isDarkMode,
  textColor,
  borderColor,
  onBack
}) => {
  const { 
    availableModels,
    defaultModel,
    saveDefaultModel,
    hiddenModels,
    toggleModelVisibility
  } = useChat();

  return (
    <SettingsNestedMenu title="AI Models" onBack={onBack} isDarkMode={isDarkMode}>
      <View style={styles.container}>
        {availableModels.map((model) => (
          <TouchableOpacity
            key={model.id}
            style={[
              styles.modelItem,
              { borderBottomColor: borderColor },
              defaultModel === model.name && styles.selectedModel
            ]}
            onPress={() => !hiddenModels.includes(model.name) && saveDefaultModel(model.name)}
          >
            <View style={styles.modelInfo}>
              <Text style={[
                styles.modelName, 
                { 
                  color: textColor,
                  opacity: hiddenModels.includes(model.name) ? 0.5 : 1 
                }
              ]}>
                {model.name}
              </Text>
              {defaultModel === model.name && (
                <Text style={[styles.modelDescription, { color: textColor + '80' }]}>
                  Default model for new chats
                </Text>
              )}
            </View>
            <View style={styles.controls}>
              {defaultModel === model.name && (
                <Ionicons name="checkmark" size={24} color="#007AFF" style={styles.checkmark} />
              )}
              <Switch
                value={!hiddenModels.includes(model.name)}
                onValueChange={() => toggleModelVisibility(model.name)}
                disabled={defaultModel === model.name}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={hiddenModels.includes(model.name) ? '#f4f3f4' : '#f5dd4b'}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </SettingsNestedMenu>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  modelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    marginBottom: 4,
  },
  modelDescription: {
    fontSize: 12,
  },
  selectedModel: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkmark: {
    marginRight: 10,
  }
});

export default AIModelsSettings;