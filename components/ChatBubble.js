import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue,
  withSpring 
} from 'react-native-reanimated';

const ChatBubble = ({ message, styles, isDarkMode, handleLongPress, markdownRules }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <TouchableOpacity
      onLongPress={() => handleLongPress(message)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      delayLongPress={200}
    >
      <Animated.View style={animatedStyle}>
        <View 
          style={[
            message.role === 'system'
              ? styles.systemChatBubbles
              : [
                  styles.chatBubbles,
                  message.role === 'user'
                    ? styles.userChatBubbles
                    : styles.aiChatBubbles
                ]
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
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default ChatBubble;
