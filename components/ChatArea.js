import React from 'react';
import { View, Image } from 'react-native';

const ChatArea = () => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={require('../assets/images/brain-gray.png')}
        style={{ width: 150, height: 150, opacity: 0.5 }}
        resizeMode="contain"
      />
    </View>
  );
};

export default ChatArea;
