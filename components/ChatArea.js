import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Image, Keyboard, TouchableOpacity, Animated, ActivityIndicator, ActionSheetIOS, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useChat } from '../contexts/ChatContext';
import brainLogo from '../assets/images/brain-gray.png'; // Adjust the path as necessary
import { useTheme } from '../contexts/ThemeContext';
import Markdown from 'react-native-markdown-display';
import { Image as ExpoImage } from 'expo-image';

const ChatArea = ({ bottomBarRef, openSettings }) => {
  const { chats, currentChatId, isGeneratingImage } = useChat();
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
          style={{ width: 300, height: 300, borderRadius: 10 }}
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
              style={{ width: 300, height: 300, borderRadius: 10 }}
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

  const handleLongPress = async (message) => {
    const isImage = message.content.startsWith('<img');
    
    if (Platform.OS === 'ios') {
      let options = ['Cancel'];
      let actions = [];
      
      if (isImage) {
        options.unshift('Save Image', 'Copy Image');
        actions = ['save', 'copy'];
      } else {
        options.unshift('Copy Text');
        actions = ['copy'];
      }
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        async (buttonIndex) => {
          const action = actions[buttonIndex];
          if (action === 'copy' && !isImage) {
            await Clipboard.setStringAsync(message.content);
          } else if (action === 'save' && isImage) {
            await saveImage(message.content);
          } else if (action === 'copy' && isImage) {
            await copyImage(message.content);
          }
        }
      );
    } else {
      // Android handling
      if (isImage) {
        Alert.alert(
          'Image Options',
          'Choose an action',
          [
            {
              text: 'Save Image',
              onPress: () => saveImage(message.content)
            },
            {
              text: 'Copy Image',
              onPress: () => copyImage(message.content)
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert(
          'Message Options',
          'Choose an action',
          [
            {
              text: 'Copy Text',
              onPress: async () => await Clipboard.setStringAsync(message.content)
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      }
    }
  };

  const saveImage = async (content) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save images');
        return;
      }

      const srcMatch = content.match(/src="([^"]+)"/);
      if (srcMatch && srcMatch[1]) {
        const uri = srcMatch[1];
        const fileUri = FileSystem.documentDirectory + 'temp_image.jpg';
        
        await FileSystem.downloadAsync(uri, fileUri);
        await MediaLibrary.saveToLibraryAsync(fileUri);
        await FileSystem.deleteAsync(fileUri);
        
        Alert.alert('Success', 'Image saved to gallery');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save image');
      console.error(error);
    }
  };

  const copyImage = async (content) => {
    try {
      const srcMatch = content.match(/src="([^"]+)"/);
      if (srcMatch && srcMatch[1]) {
        await Share.share({
          url: srcMatch[1]
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to copy image');
      console.error(error);
    }
  };

  const getAnimatedScale = () => new Animated.Value(1);

  const handlePressIn = (scale) => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = (scale) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 12,
    }).start();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollViewContent: {
      flexGrow: 1,
      padding: 10,
      paddingBottom: 60,
    },
    chatBubbles: {
      maxWidth: '75%',
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 8,
      overflow: 'hidden',
    },
    userChatBubbles: {
      alignSelf: 'flex-end',
      backgroundColor: '#007AFF',
      borderBottomRightRadius: 0,
      marginBottom: 10,
    },
    aiChatBubbles: {
      alignSelf: 'flex-start',
      backgroundColor: isDarkMode ? '#363638' : '#E9E9EB',
      borderBottomLeftRadius: 0,
      marginBottom: 10,
    },
    systemChatBubbles: {
      alignSelf: 'center',
      maxWidth: '75%',
      borderRadius: 12,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginBottom: 10,
      backgroundColor: isDarkMode ? 'transparent' : '#F7F7F7',
      overflow: 'hidden',
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
      width: '100%',
      height: 300,
      borderRadius: 18,
    },
    userChatText: {
      textAlign: 'left',
      color: '#fff',
      marginTop: 0,
      marginBottom: 0,
    },
    aiChatText: {
      textAlign: 'left',
      color: isDarkMode ? '#fff' : '#000',
      marginTop: 0,
      marginBottom: 0,
    },
    systemChatText: {
      textAlign: 'center',
      color: isDarkMode ? '#8E8E93' : '#8E8E93',
      fontSize: 12,
      fontStyle: 'italic',
      marginTop: 0,
      marginBottom: 0,
    },
    loadingContainer: {
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 10,
      color: '#8E8E93',
      fontSize: 14,
    },
    imageCaption: {
      fontSize: 10,
      color: '#8E8E93',
      textAlign: 'left',
      marginLeft: 10,
      marginTop: 4,
      marginBottom: 10,
    },
    imageContainer: {
      width: '75%',
      marginBottom: 10,
    },
  });

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
          <>
            {messages.map((message, index) => {
              const scale = getAnimatedScale();
              
              // If it's an image message, render just the image
              if (message.content.startsWith('<img')) {
                const srcMatch = message.content.match(/src="([^"]+)"/);
                if (srcMatch && srcMatch[1]) {
                  return (
                    <TouchableOpacity
                      key={index}
                      onLongPress={() => handleLongPress(message)}
                      onPressIn={() => handlePressIn(scale)}
                      onPressOut={() => handlePressOut(scale)}
                      delayLongPress={200}
                      activeOpacity={1}
                    >
                      <Animated.View 
                        style={[
                          styles.imageContainer,
                          { 
                            alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                            transform: [{ scale }]
                          }
                        ]}
                      >
                        <ExpoImage
                          source={{ uri: srcMatch[1] }}
                          style={styles.messageImage}
                          contentFit="cover"
                          transition={200}
                        />
                        <Text style={styles.imageCaption}>Generated by DALL-E 3</Text>
                      </Animated.View>
                    </TouchableOpacity>
                  );
                }
              }
              
              // For non-image messages, render in a bubble
              return (
                <TouchableOpacity
                  key={index}
                  onLongPress={() => handleLongPress(message)}
                  onPressIn={() => handlePressIn(scale)}
                  onPressOut={() => handlePressOut(scale)}
                  delayLongPress={200}
                  activeOpacity={1}
                >
                  <Animated.View 
                    style={[
                      message.role === 'system'
                        ? styles.systemChatBubbles
                        : [
                            styles.chatBubbles,
                            message.role === 'user'
                              ? styles.userChatBubbles
                              : styles.aiChatBubbles
                          ],
                      { transform: [{ scale }] }
                    ]}
                  >
                    <Markdown 
                      style={{
                        body: {
                          color: message.role === 'user' 
                            ? '#fff' 
                            : message.role === 'system'
                            ? isDarkMode ? '#8E8E93' : '#8E8E93'
                            : isDarkMode ? '#fff' : '#000',
                          ...(message.role === 'system' && {
                            marginTop: 0,
                            marginBottom: 0,
                          })
                        },
                        paragraph: {
                          ...(message.role === 'user' && styles.userChatText),
                          ...(message.role === 'system' && styles.systemChatText),
                          ...(message.role === 'assistant' && styles.aiChatText)
                        }
                      }}
                      rules={markdownRules}
                    >
                      {message.content}
                    </Markdown>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
            {isGeneratingImage && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Generating image...</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default ChatArea;
