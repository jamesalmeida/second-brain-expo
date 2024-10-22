import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../ChatContext';

const Header = ({ navigation, currentModel, isDarkMode }) => {
  const { createNewChat } = useChat();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 }}>
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Ionicons name="menu" size={24} color={isDarkMode ? 'white' : 'black'} />
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: isDarkMode ? 'white' : 'black' }}>{currentModel}</Text>
        <TouchableOpacity onPress={() => {/* TODO: Implement model selection */}}>
          <Ionicons name="chevron-down" size={24} color={isDarkMode ? 'white' : 'black'} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={createNewChat}>
        <Ionicons name="add" size={24} color={isDarkMode ? 'white' : 'black'} />
      </TouchableOpacity>
    </View>
  );
};

export default Header;
