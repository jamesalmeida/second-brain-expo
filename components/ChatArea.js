import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Image, Keyboard, TouchableOpacity, Animated } from 'react-native';
import { useChat } from '../contexts/ChatContext';
import brainLogo from '../assets/images/brain-gray.png'; // Adjust the path as necessary

const ChatArea = ({ bottomBarRef, openSettings }) => {
  const { chats, currentChatId } = useChat();
  const scrollViewRef = useRef();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const logoScale = useRef(new Animated.Value(1)).current;

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

  const handleLogoPress = () => {
    Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      openSettings();
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollViewContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyChatContainer}>
            <TouchableOpacity onPress={handleLogoPress} activeOpacity={0.8}>
              <Animated.Image 
                source={brainLogo} 
                style={[
                  styles.logo,
                  { transform: [{ scale: logoScale }] }
                ]} 
              />
            </TouchableOpacity>
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
    </View>
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
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 0,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9E9EB',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#000',
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
});

export default ChatArea;
