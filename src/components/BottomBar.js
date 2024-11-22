import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';
import ChatOptionsSheet from './ChatOptionsSheet';
import Animated, { 
  useAnimatedStyle, 
  withTiming,
  useSharedValue 
} from 'react-native-reanimated';

const BottomBar = forwardRef((props, ref) => {
  const { isDarkMode } = useTheme();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { sendMessageToOpenAI } = useChat();
  const inputRef = useRef(null);
  const chatOptionsSheetRef = useRef(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const fadeValue = useSharedValue(0);

  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  const handleSheetChanges = (index) => {
    console.log('handleSheetChanges called with index:', index);
    console.log('Current sheet state:', isSheetOpen);
    
    if ((index !== -1) !== isSheetOpen) {
      setIsSheetOpen(index !== -1);
      
      setTimeout(() => {
        if (index === -1) {
          console.log('Attempting to focus input');
          inputRef.current?.focus();
        } else {
          console.log('Attempting to blur input');
          inputRef.current?.blur();
        }
      }, 100);
    }
  };

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      inputRef.current?.focus();
    }
  }));

  useEffect(() => {
    fadeValue.value = withTiming(
      isInputFocused || message.trim().length > 0 ? 1 : 0,
      { duration: 200 }
    );
  }, [isInputFocused, message]);

  const fadeStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeValue.value
    };
  });

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
    Keyboard.dismiss();
    setTimeout(() => {
      if (chatOptionsSheetRef.current) {
        chatOptionsSheetRef.current.snapToIndex(2);
      }
    }, 100);
  };

  return (
    <View>
      <View style={styles.container}>
        <View style={[styles.inputContainer, { borderColor: isDarkMode ? '#444' : '#ccc' }]}>
          <TouchableOpacity 
            onPress={handleOptionsPress}
            style={styles.iconButton}
          >
            <Ionicons name="add-circle-outline" size={24} color={isDarkMode ? '#fff' : '#000'} />
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
          <TouchableOpacity onPress={handleSend}>
            <Animated.View style={[styles.iconButton, fadeStyle]}>
              <Ionicons name="send" size={24} color={isDarkMode ? '#fff' : '#000'} />
            </Animated.View>
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
