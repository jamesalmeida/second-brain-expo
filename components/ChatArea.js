import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Image, Keyboard } from 'react-native';
import { useChat } from '../contexts/ChatContext';
import logo from '../assets/images/brain-gray.png'; // Adjust the path as necessary

const ChatArea = ({ bottomBarRef }) => {
  const { chats, currentChatId } = useChat();
  const scrollViewRef = useRef();
  const [isAtBottom, setIsAtBottom] = useState(true);

  const currentChat = chats.find(chat => chat.id === currentChatId);
  const messages = currentChat ? currentChat.messages : [];

  useEffect(() => {
    if (isAtBottom) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, isAtBottom]);

  const handleScroll = (event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    setIsAtBottom(contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom);
  };

  const handleScrollEndDrag = (event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    if (contentOffset.y <= 0) {
      Keyboard.dismiss();
    } else if (contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom) {
      bottomBarRef.current?.focusInput();
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollViewContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyChatContainer}>
            <Image source={logo} style={styles.logo} />
          </View>
        ) : (
          messages.map((message, index) => (
            <View key={index} style={[styles.messageBubble, message.role === 'user' ? styles.userMessage : styles.aiMessage]}>
              <Text style={[styles.messageText, message.role === 'user' ? styles.userMessageText : null]}>
                {message.content}
              </Text>
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
