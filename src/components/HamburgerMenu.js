import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, FlatList, Alert, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDrawerStatus } from '@react-navigation/drawer';

const HamburgerMenu = ({ openSettings, navigation }) => {
  const { chats, currentChatId, setCurrentChatId, deleteChat } = useChat();
  const { isDarkMode } = useTheme();
  
  const backgroundColor = isDarkMode ? '#1c1c1e' : 'white';
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const borderColor = isDarkMode ? '#2c2c2e' : '#ccc';

  const isDrawerOpen = useDrawerStatus() === 'open';

  useEffect(() => {
    if (isDrawerOpen) {
      Keyboard.dismiss();
    }
  }, [isDrawerOpen]);

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

  const renderItem = ({ item }) => (
    <View style={[styles.chatItemContainer, { borderBottomColor: borderColor }]}>
      <TouchableOpacity
        style={[
          styles.chatItem,
          item.id === currentChatId && styles.activeChatItem
        ]}
        onPress={() => handleChatSelect(item.id)}
      >
        <Text style={[styles.chatTitle, { color: textColor }]}>{item.title}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteChat(item.id)}
      >
        <Ionicons name="trash-outline" size={24} color={textColor} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.content}
        contentContainerStyle={styles.listContent}
      />
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
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 20,
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
