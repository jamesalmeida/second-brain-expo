import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsNestedMenu from './SettingsNestedMenu';
import { useChat } from '../../contexts/ChatContext';
import ShowHideModels from './ShowHideModels';
import DefaultModelSelector from './DefaultModelSelector';

const AIModelsSettings = ({ 
  isDarkMode,
  textColor,
  borderColor,
  onBack
}) => {
  const [currentMenu, setCurrentMenu] = React.useState('main');
  const { availableModels, hiddenModels, defaultModel } = useChat();

  const handleBack = () => {
    if (currentMenu === 'main') {
      onBack();
    } else {
      setCurrentMenu('main');
    }
  };

  if (currentMenu === 'showhide') {
    return (
      <ShowHideModels
        isDarkMode={isDarkMode}
        textColor={textColor}
        borderColor={borderColor}
        onBack={() => setCurrentMenu('main')}
      />
    );
  }

  if (currentMenu === 'default') {
    return (
      <DefaultModelSelector
        isDarkMode={isDarkMode}
        textColor={textColor}
        borderColor={borderColor}
        onBack={() => setCurrentMenu('main')}
      />
    );
  }

  return (
    <SettingsNestedMenu title="AI Models" onBack={handleBack} isDarkMode={isDarkMode}>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: borderColor }]}
          onPress={() => setCurrentMenu('showhide')}
        >
          <Text style={{ color: textColor }}>Show/Hide AI Models</Text>
          <View style={styles.settingItemContent}>
            <Text style={{ color: isDarkMode ? '#666666' : '#999999' }}>
              {availableModels.filter(model => !hiddenModels.includes(model.name)).length} of {availableModels.length} active
            </Text>
            <Ionicons name="chevron-forward" size={24} color={textColor} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: borderColor }]}
          onPress={() => setCurrentMenu('default')}
        >
          <Text style={{ color: textColor }}>Choose Default AI Model</Text>
          <View style={styles.settingItemContent}>
            <Text style={{ color: isDarkMode ? '#666666' : '#999999' }}>
              {defaultModel}
            </Text>
            <Ionicons name="chevron-forward" size={24} color={textColor} />
          </View>
        </TouchableOpacity>
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
    padding: 15,
    borderBottomWidth: 1,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default AIModelsSettings;