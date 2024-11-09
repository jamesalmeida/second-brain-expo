import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
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
  const inputRef = useRef(null);

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

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? 'black' : 'white' }]}>
      <View style={[styles.inputContainer, { borderColor: isDarkMode ? '#444' : '#ccc' }]}>
        <TouchableOpacity onPress={() => {/* TODO: Implement attachment functionality */}} style={styles.iconButton}>
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
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 10,
    // borderTopWidth: 1,
    // borderTopColor: '#ccc',
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
