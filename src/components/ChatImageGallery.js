import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const SPACING = 2;
const ITEM_WIDTH = (width - (SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

const ChatImageGallery = ({ 
  images, 
  isDarkMode, 
  onClose,
  onImagePress 
}) => {
  const renderImage = ({ item }) => {
    const urlMatch = item.content.match(/src="([^"]+)"/);
    const imageUrl = urlMatch ? urlMatch[1] : null;
    
    console.log('Image URL:', imageUrl);
    
    const promptMatch = item.content.match(/data-revised-prompt="([^"]+)"/);
    const prompt = promptMatch ? promptMatch[1] : 'No prompt available';

    if (!imageUrl) return null;

    return (
      <TouchableOpacity 
        style={styles.imageContainer}
        onPress={() => onImagePress?.(imageUrl, prompt)}
      >
        <ExpoImage
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <View style={[styles.promptOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }]}>
          <Text 
            style={[styles.promptText, { color: isDarkMode ? '#fff' : '#000' }]}
            numberOfLines={2}
          >
            {prompt}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDarkMode ? '#1c1c1e' : 'white' }
    ]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={isDarkMode ? '#fff' : '#000'} 
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
          Generated Images
        </Text>
      </View>
      
      <FlatList
        data={images}
        renderItem={renderImage}
        keyExtractor={(item, index) => index.toString()}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.gridContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#666',
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  gridContainer: {
    padding: SPACING,
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    margin: SPACING,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  promptOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  promptText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ChatImageGallery; 