import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';

const HamburgerMenu = ({ openSettings, navigation }) => {
  const { chats, currentChatId, setCurrentChatId, deleteChat } = useChat();
  const { isDarkMode } = useTheme();
  
  const backgroundColor = isDarkMode ? '#1c1c1e' : 'white';
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const borderColor = isDarkMode ? '#2c2c2e' : '#ccc';

  const handleChatSelect = (chatId) => {
    setCurrentChatId(chatId);
    navigation.closeDrawer();
  };

  const handleDeleteChat = (chatId) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => deleteChat(chatId),
          style: "destructive"
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView style={styles.content}>
        {chats.map((chat) => (
          <View key={chat.id} style={[styles.chatItemContainer, { borderBottomColor: borderColor }]}>
            <TouchableOpacity
              style={[
                styles.chatItem,
                chat.id === currentChatId && styles.activeChatItem
              ]}
              onPress={() => handleChatSelect(chat.id)}
            >
              <Text style={[styles.chatTitle, { color: textColor }]}>{chat.title}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteChat(chat.id)}
            >
              <Ionicons name="trash-outline" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={[styles.settingsButton, { borderTopColor: borderColor }]}
        onPress={openSettings}
      >
        <Ionicons name="settings-outline" size={24} color={textColor} style={styles.icon} />
        <Text style={[styles.settingsText, { color: textColor }]}>Settings</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  chatItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  chatItem: {
    flex: 1,
    padding: 15,
  },
  activeChatItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  chatTitle: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 15,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
  },
  icon: {
    marginRight: 10,
  },
  settingsText: {
    fontSize: 16,
  },
});

export default HamburgerMenu;
