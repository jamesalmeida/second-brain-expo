import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
    currentModel,
    setCurrentModel
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
              currentModel === model.name && styles.selectedModel
            ]}
            onPress={() => setCurrentModel(model.name)}
          >
            <View style={styles.modelInfo}>
              <Text style={[styles.modelName, { color: textColor }]}>
                {model.name}
              </Text>
            </View>
            {currentModel === model.name && (
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

export default AIModelsSettings;