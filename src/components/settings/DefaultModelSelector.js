import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsNestedMenu from './SettingsNestedMenu';
import { useChat } from '../../contexts/ChatContext';

const DefaultModelSelector = ({ 
  isDarkMode,
  textColor,
  borderColor,
  onBack
}) => {
  const { availableModels, defaultModel, saveDefaultModel, hiddenModels } = useChat();

  // Filter out hidden models
  const visibleModels = availableModels.filter(model => !hiddenModels.includes(model.name));

  return (
    <SettingsNestedMenu title="Choose Default Model" onBack={onBack} isDarkMode={isDarkMode}>
      <View style={styles.container}>
        {visibleModels.map((model) => (
          <TouchableOpacity
            key={model.id}
            style={[
              styles.modelItem,
              { borderBottomColor: borderColor },
              defaultModel === model.name && styles.selectedModel
            ]}
            onPress={() => saveDefaultModel(model.name)}
          >
            <View style={styles.modelInfo}>
              <Text style={[styles.modelName, { color: textColor }]}>
                {model.name}
              </Text>
            </View>
            {defaultModel === model.name && (
              <Ionicons name="checkmark" size={24} color="#007AFF" />
            )}
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
  },
  selectedModel: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
});

export default DefaultModelSelector;