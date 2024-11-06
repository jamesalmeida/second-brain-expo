import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';

const Header = ({ navigation }) => {
  const { createNewChat, availableModels, currentModel, setCurrentModel, hiddenModels } = useChat();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { isDarkMode } = useTheme();

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const selectModel = (model) => {
    setCurrentModel(model);
    toggleModal();
  };

  const visibleModels = availableModels.filter(model => !hiddenModels.includes(model.name));

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? 'black' : 'white' }]}>
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Ionicons name="menu" size={24} color={isDarkMode ? 'white' : 'black'} />
      </TouchableOpacity>
      <TouchableOpacity onPress={toggleModal} style={styles.modelSelector}>
        <Text style={{ color: isDarkMode ? 'white' : 'black', marginRight: 5 }}>{currentModel}</Text>
        <Ionicons name="chevron-down" size={24} color={isDarkMode ? 'white' : 'black'} />
      </TouchableOpacity>
      <TouchableOpacity onPress={createNewChat}>
        <Ionicons name="add" size={24} color={isDarkMode ? 'white' : 'black'} />
      </TouchableOpacity>

      <Modal
        animationType="fade" // or "slide" or "none"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={toggleModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPressOut={toggleModal}
        >
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#2c2c2e' : 'white' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? 'white' : 'black' }]}>
                Select Model
              </Text>
              <TouchableOpacity onPress={toggleModal} style={styles.closeButton}>
                <Ionicons 
                  name="close" 
                  size={24} 
                  color={isDarkMode ? 'white' : 'black'} 
                />
              </TouchableOpacity>
            </View>
            {visibleModels.length > 0 ? (
              <FlatList
                data={visibleModels}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => selectModel(item.name)}
                    style={[
                      styles.modelItem,
                      currentModel === item.name && styles.selectedModelItem
                    ]}
                  >
                    <Text style={{ 
                      color: isDarkMode ? 'white' : 'black',
                      fontWeight: currentModel === item.name ? 'bold' : 'normal'
                    }}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                scrollEnabled={true}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.flatListContent}
              />
            ) : (
              <Text style={[styles.noModelsText, { color: isDarkMode ? 'white' : 'black' }]}>
                No models available
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '80%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 5,
    position: 'absolute',
    right: 15,
  },
  modelItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedModelItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  flatListContent: {
    flexGrow: 1,
  },
  noModelsText: {
    padding: 15,
    textAlign: 'center',
  },
});

export default Header;
