import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';

const Header = ({ navigation }) => {
  const { createNewChat, availableModels, currentModel, setCurrentModel } = useChat();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { isDarkMode } = useTheme();

  const toggleModal = () => setIsModalVisible(!isModalVisible);

  const selectModel = (model) => {
    console.log('Selected model:', model);
    setCurrentModel(model);
    toggleModal();
  };

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
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={toggleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#2c2c2e' : 'white' }]}>
            <ScrollView>
              {availableModels.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => selectModel(item.name)}
                  style={styles.modelItem}
                >
                  <Text style={{ color: isDarkMode ? 'white' : 'black' }}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
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
    // borderBottomWidth: 1,
    // borderBottomColor: '#ccc',
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  modelItem: {
    padding: 10,
  },
});

export default Header;
