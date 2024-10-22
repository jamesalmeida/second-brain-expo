import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BottomBar = ({ isDarkMode }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleAttachment = () => {
    // TODO: Implement attachment functionality
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice input functionality
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, { borderColor: isDarkMode ? '#444' : '#ccc' }]}>
        <TouchableOpacity onPress={handleAttachment} style={styles.iconButton}>
          <Ionicons name="add-circle-outline" size={24} color={isDarkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { color: isDarkMode ? '#fff' : '#000' }]}
          placeholder="Message"
          placeholderTextColor={isDarkMode ? '#888' : '#999'}
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity onPress={handleVoiceInput} style={styles.iconButton}>
          <Ionicons
            name={isRecording ? 'stop-circle' : 'mic'}
            size={24}
            color={isRecording ? '#ff0000' : (isDarkMode ? '#fff' : '#000')}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
  },
  iconButton: {
    padding: 5,
  },
});

export default BottomBar;
