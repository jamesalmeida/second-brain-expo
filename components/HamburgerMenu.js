import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../ChatContext';

const HamburgerMenu = ({ openSettings, isDarkMode, navigation }) => {
  const { chats, currentChatId, setCurrentChatId } = useChat();
  const backgroundColor = isDarkMode ? '#1c1c1e' : 'white';
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const borderColor = isDarkMode ? '#2c2c2e' : '#ccc';

  const handleChatSelect = (chatId) => {
    setCurrentChatId(chatId);
    navigation.closeDrawer();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView style={styles.content}>
        {chats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={[
              styles.chatItem,
              { borderBottomColor: borderColor },
              chat.id === currentChatId && styles.activeChatItem
            ]}
            onPress={() => handleChatSelect(chat.id)}
          >
            <Text style={[styles.chatTitle, { color: textColor }]}>{chat.title}</Text>
          </TouchableOpacity>
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
  chatItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  activeChatItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  chatTitle: {
    fontSize: 16,
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
