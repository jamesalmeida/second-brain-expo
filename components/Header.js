import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Dimensions, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';

const Header = ({ navigation }) => {
  const { createNewChat, availableModels, currentModel, setCurrentModel } = useChat();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const toggleModal = () => {
    if (isModalVisible) {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsModalVisible(false));
    } else {
      setIsModalVisible(true);
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

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
        animationType="none"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={toggleModal}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: fadeAnim,
            }
          ]}
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
            <ScrollView>
              {availableModels.map((item) => (
                <TouchableOpacity
                  key={item.id}
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
              ))}
            </ScrollView>
          </View>
        </Animated.View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modelItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedModelItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
});

export default Header;
