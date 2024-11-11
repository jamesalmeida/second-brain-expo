import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, FlatList, Alert, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDrawerStatus } from '@react-navigation/drawer';
import Animated, { withTiming, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const CollapsibleSection = ({ title, isExpanded, onPress, children, borderColor, textColor, icon }) => {
  const rotateValue = useSharedValue(isExpanded ? 180 : 0);
  const heightValue = useSharedValue(isExpanded ? 570 : 0);

  useEffect(() => {
    rotateValue.value = withTiming(isExpanded ? 180 : 0, {
      duration: 300,
    });
    heightValue.value = withTiming(isExpanded ? 570 : 0, {
      duration: 300,
    });
  }, [isExpanded]);

  const arrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotateValue.value}deg` }],
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      height: heightValue.value,
      overflow: 'hidden',
    };
  });

  return (
    <View style={[styles.sectionContainer, { borderBottomColor: borderColor }]}>
      <TouchableOpacity 
        style={styles.sectionHeader} 
        onPress={onPress}
      >
        {icon}
        <Text style={[styles.sectionTitle, { color: textColor, marginLeft: 10 }]}>{title}</Text>
        <Animated.View style={arrowStyle}>
          <Ionicons name="chevron-down" size={24} color={textColor} />
        </Animated.View>
      </TouchableOpacity>
      <Animated.View style={containerStyle}>
        <View style={styles.sectionContent}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

const HamburgerMenu = ({ openSettings, navigation }) => {
  const { chats, currentChatId, setCurrentChatId, deleteChat } = useChat();
  const { isDarkMode } = useTheme();
  const [expandedSection, setExpandedSection] = useState(null);
  
  const backgroundColor = isDarkMode ? '#1c1c1e' : 'white';
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const borderColor = isDarkMode ? '#2c2c2e' : '#ccc';

  const isDrawerOpen = useDrawerStatus() === 'open';

  useEffect(() => {
    if (isDrawerOpen) {
      Keyboard.dismiss();
    }
  }, [isDrawerOpen]);

  const handleSectionPress = (sectionName) => {
    setExpandedSection(expandedSection === sectionName ? null : sectionName);
  };

  const handleChatSelect = (chatId) => {
    setCurrentChatId(chatId);
    navigation.closeDrawer();
  };

  const handleDeleteChat = (chatId) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => deleteChat(chatId),
          style: "destructive"
        }
      ]
    );
  };

  const renderChatItem = ({ item }) => (
    <View style={[styles.chatItemContainer, { borderBottomColor: borderColor }]}>
      <TouchableOpacity
        style={[
          styles.chatItem,
          item.id === currentChatId && styles.activeChatItem
        ]}
        onPress={() => handleChatSelect(item.id)}
      >
        <Text style={[styles.chatTitle, { color: textColor }]}>{item.title}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteChat(item.id)}
      >
        <Ionicons name="trash-outline" size={24} color={textColor} />
      </TouchableOpacity>
    </View>
  );

  // console.log('--------- CHAT HISTORY START ---------');
  // console.log(chats);
  // console.log('--------- CHAT HISTORY END ---------');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.mainContainer}>
        <View style={styles.sectionsContainer}>
          <CollapsibleSection
            title="Chat History"
            isExpanded={expandedSection === 'chatHistory'}
            onPress={() => handleSectionPress('chatHistory')}
            borderColor={borderColor}
            textColor={textColor}
            icon={<Ionicons name="chatbubbles-outline" size={24} color={textColor} />}
          >
            <FlatList
              data={chats}
              renderItem={renderChatItem}
              keyExtractor={(item) => item.id}
              style={styles.chatList}
            />
          </CollapsibleSection>

          <View style={expandedSection === 'chatHistory' ? styles.spacer : null} />

          <CollapsibleSection
            title="Memories"
            isExpanded={expandedSection === 'memories'}
            onPress={() => handleSectionPress('memories')}
            borderColor={borderColor}
            textColor={textColor}
            icon={<Ionicons name="cube-outline" size={24} color={textColor} />}
          >
            <View style={styles.placeholderContainer}>
              <Text style={[styles.placeholderText, { color: textColor }]}>
                Coming soon...
              </Text>
            </View>
          </CollapsibleSection>
          
          <View style={expandedSection === 'memories' ? styles.spacer : null} />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.settingsButton, { borderTopColor: borderColor }]}
        onPress={openSettings}
      >
        <Ionicons name="settings-outline" size={24} color={textColor} style={styles.icon} />
        <Text style={[styles.settingsText, { color: textColor }]}>Settings</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    marginBottom: 80,
  },
  sectionsContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '85%',
  },
  spacer: {
    flex: 1,
  },
  sectionContainer: {
    borderBottomWidth: 1,
  },
  sectionContent: {
    height: 600,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  chatList: {
    flex: 1,
    width: '100%',
  },
  chatItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingLeft: 20,
  },
  chatItem: {
    flex: 1,
    padding: 15,
  },
  activeChatItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  chatTitle: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 15,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: 'inherit',
  },
  icon: {
    marginRight: 10,
  },
  settingsText: {
    fontSize: 16,
  },
  placeholderContainer: {
    padding: 20,
    alignItems: 'center',
  },
  placeholderText: {
    fontStyle: 'italic',
    opacity: 0.6,
  },
});

export default HamburgerMenu;
