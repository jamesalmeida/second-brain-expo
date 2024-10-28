import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';

const BottomBar = forwardRef((props, ref) => {
  const { isDarkMode } = useTheme();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { sendMessageToOpenAI } = useChat();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(40)).current; // Initial height for single line
  const inputRef = useRef(null);
  const [inputHeight, setInputHeight] = useState(40); // Track input height

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      inputRef.current?.focus();
    }
  }));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: isInputFocused || message.trim().length > 0 ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue: (isInputFocused || message.trim().length > 0) ? Math.min(Math.max(inputHeight, 20), 260) : 20, // Adjusted condition
        duration: 200,
        useNativeDriver: false,
      })
    ]).start();

    if (isInputFocused || message.trim().length > 0) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
    }
  }, [isInputFocused, message, inputHeight]);

  const handleSend = () => {
    if (message.trim()) {
      sendMessageToOpenAI(message);
      setMessage('');
      setIsInputFocused(false); // Optionally blur after sending
    }
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual voice recording functionality
  };

  const handleContentSizeChange = (event) => {
    const { height } = event.nativeEvent.contentSize;
    setInputHeight(height);
  };

  const handleFocusInput = () => {
    setIsInputFocused(true);
    // Focus will be handled in the useEffect
  };

  const handleBlurInput = () => {
    if (message.trim().length === 0) {
      setIsInputFocused(false);
    }
    // Else, keep it focused by not changing isInputFocused
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? 'black' : 'white' }]}>
      <Animated.View 
        style={[
          styles.inputContainer, 
          { 
            borderColor: isDarkMode ? '#444' : '#ccc',
            minHeight: heightAnim 
          },
          (isInputFocused || message.trim().length > 0) && styles.inputContainerFocused
        ]}
      >
        {(isInputFocused || message.trim().length > 0) && ( // Updated condition
          <Animated.View style={{ height: heightAnim }}>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                { color: isDarkMode ? '#fff' : '#000' }
              ]}
              placeholder="Message"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              value={message}
              onChangeText={setMessage}
              onContentSizeChange={handleContentSizeChange}
              onSubmitEditing={handleSend}
              onFocus={() => setIsInputFocused(true)}
              onBlur={handleBlurInput} // Updated handler
              blurOnSubmit={false}
              secureTextEntry={false}
              multiline={true}
              textAlignVertical="top"
              returnKeyType="default"
              // Removed autoFocus to prevent initial height issue
            />
          </Animated.View>
        )}
        <View style={[
          styles.buttonsContainer,
          (isInputFocused || message.trim().length > 0) && styles.buttonsContainerFocused
        ]}>
          <TouchableOpacity onPress={() => {/* TODO: Implement attachment functionality */}} style={styles.iconButton}>
            <Ionicons name="add-circle-outline" size={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          {!(isInputFocused || message.trim().length > 0) && ( // Updated condition
            <TouchableOpacity 
              style={styles.placeholderContainer} 
              onPress={handleFocusInput}
            >
              <Text style={{ color: isDarkMode ? '#888' : '#999' }}>
                Message
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.rightButtons}>
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity onPress={handleSend} style={styles.iconButton}>
                <Ionicons name="send" size={24} color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity onPress={handleVoiceInput} style={styles.iconButton}>
              {isRecording ? (
                <View style={styles.recordingButton}>
                  <Ionicons name="stop" size={16} color="#fff" />
                </View>
              ) : (
                <Ionicons name="mic-outline" size={24} color={isDarkMode ? '#fff' : '#000'} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 25,
    marginHorizontal: 10,
    paddingHorizontal: 10,
  },
  inputContainerFocused: {
    flexDirection: 'column',
    paddingTop: 5,
    paddingBottom: 0,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 5,
    width: '100%',
    paddingHorizontal: 5,
    outlineStyle: 'none',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
  },
  buttonsContainerFocused: {
    width: '100%',
    marginTop: 5,
    paddingTop: 5,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 5,
  },
  recordingButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
});

export default BottomBar;
