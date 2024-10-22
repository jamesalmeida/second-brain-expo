import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useChat } from '../ChatContext';
import logo from '../assets/images/brain-gray.png'; // Adjust the path as necessary

const ChatArea = () => {
  const { chats, currentChatId } = useChat();
  const scrollViewRef = useRef();

  const currentChat = chats.find(chat => chat.id === currentChatId);
  const messages = currentChat ? currentChat.messages : [];

  useEffect(() => {
    scrollViewRef.current.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollViewContent}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyChatContainer}>
            <Image source={logo} style={styles.logo} />
          </View>
        ) : (
          messages.map((message, index) => (
            <View key={index} style={[styles.messageBubble, message.role === 'user' ? styles.userMessage : styles.aiMessage]}>
              <Text style={styles.messageText}>{message.content}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 10,
    paddingBottom: 60, // Add some bottom padding to prevent overlap with the input
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    color: '#000',
  },
  userMessageText: {
    color: '#fff',
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100, // Adjust size as needed
    height: 100, // Adjust size as needed
    resizeMode: 'contain',
  },
});

export default ChatArea;
