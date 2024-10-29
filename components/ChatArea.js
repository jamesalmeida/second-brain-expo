import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Image, Keyboard, TouchableOpacity, Animated } from 'react-native';
import { useChat } from '../contexts/ChatContext';
import brainLogo from '../assets/images/brain-gray.png'; // Adjust the path as necessary
import { useTheme } from '../contexts/ThemeContext';
import Markdown from 'react-native-markdown-display';
import { Image as ExpoImage } from 'expo-image';

const ChatArea = ({ bottomBarRef, openSettings }) => {
  const { chats, currentChatId } = useChat();
  const scrollViewRef = useRef();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const logoScale = useRef(new Animated.Value(1)).current;
  const { isDarkMode } = useTheme();

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

  const markdownRules = {
    image: (node) => {
      return (
        <ExpoImage
          key={node.key}
          source={{ uri: node.target }}
          style={{ width: 300, height: 300, borderRadius: 10, marginVertical: 10 }}
          contentFit="cover"
          transition={200}
        />
      );
    },
    paragraph: (node, children, parent, styles) => {
      // Check if the content contains an img tag
      if (typeof node.content === 'string' && node.content.includes('<img')) {
        // Extract src from img tag
        const srcMatch = node.content.match(/src="([^"]+)"/);
        if (srcMatch && srcMatch[1]) {
          return (
            <ExpoImage
              key={node.key}
              source={{ uri: srcMatch[1] }}
              style={{ width: 300, height: 300, borderRadius: 10, marginVertical: 10 }}
              contentFit="cover"
              transition={200}
            />
          );
        }
      }
      // Default paragraph rendering
      return <Text key={node.key} style={styles.paragraph}>{children}</Text>;
    }
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
                style={[styles.logo, { transform: [{ scale: logoScale }] }]} 
              />
            </TouchableOpacity>
          </View>
        ) : (
          messages.map((message, index) => {
            // If it's an image message, render just the image
            if (message.content.startsWith('<img')) {
              const srcMatch = message.content.match(/src="([^"]+)"/);
              if (srcMatch && srcMatch[1]) {
                return (
                  <ExpoImage
                    key={index}
                    source={{ uri: srcMatch[1] }}
                    style={[styles.messageImage, { alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start' }]}
                    contentFit="cover"
                    transition={200}
                  />
                );
              }
            }
            
            // For non-image messages, render in a bubble
            return (
              <View 
                key={index} 
                style={[
                  styles.messageBubble, 
                  message.role === 'user' 
                    ? styles.userMessage : message.role === 'system'
                    ? styles.systemMessage : styles.aiMessage
                ]}
              >
                <Markdown 
                  style={{
                    body: {
                      color: message.role === 'user' 
                        ? '#fff' 
                        : message.role === 'system'
                        ? isDarkMode ? '#8E8E93' : '#666666'
                        : '#000'
                    },
                    paragraph: message.role === 'user' 
                      ? styles.userParagraph
                      : message.role === 'system'
                      ? styles.systemParagraph
                      : styles.aiParagraph
                  }}
                  rules={markdownRules}
                >
                  {message.content}
                </Markdown>
              </View>
            );
          })
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
    borderRadius: 18,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 0,
    overflow: 'hidden',
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
  systemMessage: {
    alignSelf: 'center',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginVertical: 8,
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
  messageImage: {
    width: '75%',
    height: 300,
    borderRadius: 18,
    marginBottom: 10,
  },
  userParagraph: {
    textAlign: 'right',
    color: '#fff',
  },
  systemParagraph: {
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 10,
    color: '#8E8E93',
    borderBottomWidth: 1,
    borderBottomColor: '#8E8E93',
  },
  aiParagraph: {
    textAlign: 'left',
    color: '#000',
  },
});

export default ChatArea;
