import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../contexts/ChatContext';
import moment from 'moment-timezone';

const InfoRow = ({ label, value, icon, isDarkMode }) => (
  <View style={styles.infoRow}>
    {icon && <Ionicons name={icon} size={20} color={isDarkMode ? '#666' : '#999'} style={styles.icon} />}
    <Text style={[styles.label, { color: isDarkMode ? '#999' : '#666' }]}>{label}</Text>
    <Text style={[styles.value, { color: isDarkMode ? '#fff' : '#000' }]}>{value}</Text>
  </View>
);

const ChatInfoSheet = ({ 
  bottomSheetRef, 
  snapPoints, 
  handleSheetChanges, 
  isDarkMode,
  selectedDate 
}) => {
  const { chats, currentChatId, currentModel } = useChat();
  const currentChat = chats.find(chat => chat.id === currentChatId);

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  const calculateChatStats = () => {
    if (!currentChat?.messages) return null;

    const messages = currentChat.messages;
    const userMessages = messages.filter(m => m.role === 'user');
    const aiMessages = messages.filter(m => m.role === 'assistant');
    const totalWords = messages.reduce((acc, m) => 
      acc + (m.content.match(/\b\w+\b/g) || []).length, 0
    );
    const imageCount = aiMessages.filter(m => m.content.includes('<img')).length;
    const firstMessageTime = messages[0]?.timestamp;
    const lastMessageTime = messages[messages.length - 1]?.timestamp;

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      aiMessages: aiMessages.length,
      totalWords,
      imageCount,
      firstMessageTime,
      lastMessageTime
    };
  };

  const stats = calculateChatStats();
  if (!stats) return null;

  return (
    <Portal>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: isDarkMode ? '#ffffff' : '#000000' }}
        backgroundStyle={{ backgroundColor: isDarkMode ? '#1c1c1e' : 'white' }}
      >
        <BottomSheetView style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
              Chat Information
            </Text>
            <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
              <Ionicons 
                name="close-circle-outline" 
                size={24} 
                color={isDarkMode ? '#fff' : '#000'} 
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                Overview
              </Text>
              <InfoRow 
                label="Date" 
                value={moment(selectedDate).format('MMMM D, YYYY')}
                icon="calendar-outline"
                isDarkMode={isDarkMode}
              />
              <InfoRow 
                label="Total Messages" 
                value={stats.totalMessages}
                icon="chatbubbles-outline"
                isDarkMode={isDarkMode}
              />
              <InfoRow 
                label="Your Messages" 
                value={stats.userMessages}
                icon="person-outline"
                isDarkMode={isDarkMode}
              />
              <InfoRow 
                label="AI Responses" 
                value={stats.aiMessages}
                icon="hardware-chip-outline"
                isDarkMode={isDarkMode}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                Content
              </Text>
              <InfoRow 
                label="Total Words" 
                value={stats.totalWords}
                icon="text-outline"
                isDarkMode={isDarkMode}
              />
              <InfoRow 
                label="Images Generated" 
                value={stats.imageCount}
                icon="image-outline"
                isDarkMode={isDarkMode}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                Technical Details
              </Text>
              <InfoRow 
                label="Chat ID" 
                value={currentChatId}
                icon="key-outline"
                isDarkMode={isDarkMode}
              />
              <InfoRow 
                label="AI Model" 
                value={currentModel}
                icon="git-branch-outline"
                isDarkMode={isDarkMode}
              />
            </View>
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
    width: 24,
  },
  label: {
    flex: 1,
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ChatInfoSheet; 