import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../ChatContext';

const Header = ({ navigation, isDarkMode }) => {
  const { createNewChat, availableModels, currentModel, setCurrentModel } = useChat();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleModal = () => setIsModalVisible(!isModalVisible);

  const selectModel = (model) => {
    console.log('Selected model:', model); // Log the selected model
    setCurrentModel(model); // This should call the changeModel function
    toggleModal();
  };

  const windowHeight = Dimensions.get('window').height;

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 }}>
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Ionicons name="menu" size={24} color={isDarkMode ? 'white' : 'black'} />
      </TouchableOpacity>
      <TouchableOpacity onPress={toggleModal} style={{ flexDirection: 'row', alignItems: 'center' }}>
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ 
            backgroundColor: isDarkMode ? '#1c1c1e' : 'white', 
            padding: 20, 
            borderRadius: 10, 
            width: '80%',
            maxHeight: windowHeight * 0.7
          }}>
            <ScrollView>
              {availableModels.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => selectModel(item.name)} // Ensure this calls selectModel with the correct model name
                  style={{ padding: 10 }}
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

export default Header;
