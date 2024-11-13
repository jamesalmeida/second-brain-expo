import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsNestedMenu from './SettingsNestedMenu';
import { useChat } from '../../contexts/ChatContext';

const ShowHideModels = ({ 
  isDarkMode,
  textColor,
  borderColor,
  onBack
}) => {
  const { availableModels, defaultModel, hiddenModels, toggleModelVisibility } = useChat();

  return (
    <SettingsNestedMenu title="Show/Hide Models" onBack={onBack} isDarkMode={isDarkMode}>
      <View style={styles.container}>
        {availableModels.map((model) => (
          <TouchableOpacity
            key={model.id}
            style={[
              styles.modelItem,
              { borderBottomColor: borderColor }
            ]}
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
            <Switch
              value={!hiddenModels.includes(model.name)}
              onValueChange={() => toggleModelVisibility(model.name)}
              disabled={defaultModel === model.name}
              trackColor={{ false: '#e9e9ea', true: '#34c759' }}
              thumbColor={'#ffffff'}
              ios_backgroundColor="#e9e9ea"
            />
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
  modelDescription: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default ShowHideModels;