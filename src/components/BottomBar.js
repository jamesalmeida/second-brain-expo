import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Animated, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';
import ChatOptionsSheet from './ChatOptionsSheet';

const BottomBar = forwardRef((props, ref) => {
  const { isDarkMode } = useTheme();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { sendMessageToOpenAI } = useChat();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);
  const chatOptionsSheetRef = useRef(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const snapPoints = ['60%'];

  const handleSheetChanges = (index) => {
    console.log('handleSheetChanges called with index:', index);
    console.log('Current sheet state:', isSheetOpen);
    setIsSheetOpen(index !== -1);
    if (index === -1) {
      console.log('Attempting to focus input');
      inputRef.current?.focus();
    } else {
      console.log('Attempting to blur input');
      inputRef.current?.blur();
    }
  };

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      inputRef.current?.focus();
    }
  }));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isInputFocused || message.trim().length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isInputFocused, message]);

  const handleSend = () => {
    if (message.trim()) {
      console.log('🚀 Message Flow: Step 1 - User submitted message:', message);
      sendMessageToOpenAI(message);
      setMessage('');
    }
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual voice recording functionality
  };

  const handleOptionsPress = () => {
    console.log('💬 Chat Options button pressed');
    Keyboard.dismiss();
    setTimeout(() => {
      if (chatOptionsSheetRef.current) {
        console.log('Attempting to open sheet...');
        chatOptionsSheetRef.current.snapToIndex(0);
      }
    }, 100);
  };

  return (
    <View>
      <View style={[styles.container, { backgroundColor: isDarkMode ? 'black' : 'white' }]}>
        <View style={[styles.inputContainer, { borderColor: isDarkMode ? '#444' : '#ccc' }]}>
          <TouchableOpacity 
            onPress={handleOptionsPress}
            style={styles.iconButton}
          >
            <Ionicons name="hardware-chip-outline" size={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: isDarkMode ? '#fff' : '#000' }]}
            placeholder="Message"
            placeholderTextColor={isDarkMode ? '#888' : '#999'}
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSend}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            blurOnSubmit={false}
            multiline={true}
            textAlignVertical="center"
            keyboardType="default"
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            textContentType="none"
            importantForAutofill="no"
            passwordRules=""
            secureTextEntry={false}
            caretHidden={false}
            spellCheck={false}
          />
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
      <ChatOptionsSheet
        bottomSheetRef={chatOptionsSheetRef}
        snapPoints={snapPoints}
        handleSheetChanges={handleSheetChanges}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 25,
    // marginHorizontal: 10,
    paddingHorizontal: 10,
    minHeight: 50,
    maxHeight: 120, // Limits maximum height
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    maxHeight: 120, // Matches container maxHeight
    // Below are for web only
    alignContent: 'center', 
    outlineStyle: 'none', 
    borderWidth: 0, 
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
});

export default BottomBar;
