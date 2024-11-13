import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useTheme } from '../contexts/ThemeContext';
import { Portal } from '@gorhom/portal';
import { useChat } from '../contexts/ChatContext';

const ChatOptionsSheet = memo(({ bottomSheetRef, snapPoints, handleSheetChanges }) => {
  const { isDarkMode } = useTheme();
  const { 
    availableModels, 
    currentModel, 
    setCurrentModel,
    hiddenModels 
  } = useChat();
  const [currentView, setCurrentView] = useState('main');
  const slideAnim = useState(new Animated.Value(0))[0];
  const [isAnimatingSheet, setIsAnimatingSheet] = useState(false);
  
  const backgroundColor = isDarkMode ? '#1c1c1e' : 'white';
  const textColor = isDarkMode ? '#ffffff' : '#000000';

  const handleSheetChange = (index) => {
    if (isAnimatingSheet) {
      return;
    }

    setIsAnimatingSheet(true);
    
    if (index === -1) {
      setTimeout(() => {
        slideAnim.setValue(0);
        setCurrentView('main');
      }, 100);
    }
    
    handleSheetChanges(index);
    
    setTimeout(() => {
      setIsAnimatingSheet(false);
    }, 300);
  };

  const renderBackdrop = props => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
    />
  );

  const visibleModels = availableModels.filter(model => !hiddenModels.includes(model.name));

  const selectModel = (modelName) => {
    setCurrentModel(modelName);
    bottomSheetRef.current?.close();
  };

  const slideToModels = () => {
    Animated.timing(slideAnim, {
      toValue: -1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentView('models');
    });
  };

  const slideBackToMain = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentView('main');
    });
  };

  const renderModelItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.option,
        currentModel === item.name && styles.selectedOption
      ]}
      onPress={() => selectModel(item.name)}
    >
      <Ionicons 
        name={currentModel === item.name ? "radio-button-on" : "radio-button-off"} 
        size={24} 
        color={textColor} 
      />
      <Text style={[styles.optionText, { color: textColor }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <Portal>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: isDarkMode ? '#ffffff' : '#000000' }}
        backgroundStyle={{ backgroundColor }}
      >
        <BottomSheetView style={[styles.bottomSheetContent, { backgroundColor }]}>
          <Animated.View
            style={[
              styles.menuContainer,
              {
                transform: [{
                  translateX: slideAnim.interpolate({
                    inputRange: [-1, 0],
                    outputRange: [-400, 0]
                  })
                }]
              }
            ]}
          >
            <TouchableOpacity style={styles.option} onPress={slideToModels}>
              <Ionicons name="color-wand-outline" size={24} color={textColor} />
              <Text style={[styles.optionText, { color: textColor }]}>Choose AI Model</Text>
              <Ionicons name="chevron-forward" size={24} color={textColor} style={styles.chevron} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={slideToModels}>
              <Ionicons name="document-attach-outline" size={24} color={textColor} />
              <Text style={[styles.optionText, { color: textColor }]}>Attach File</Text>
              <Ionicons name="chevron-forward" size={24} color={textColor} style={styles.chevron} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={slideToModels}>
              <Ionicons name="image-outline" size={24} color={textColor} />
              <Text style={[styles.optionText, { color: textColor }]}>Attach Photo</Text>
              <Ionicons name="chevron-forward" size={24} color={textColor} style={styles.chevron} />
            </TouchableOpacity>
            {/* Add your other chat options here */}
          </Animated.View>

          <Animated.View
            style={[
              styles.menuContainer,
              styles.overlayMenu,
              {
                transform: [{
                  translateX: slideAnim.interpolate({
                    inputRange: [-1, 0],
                    outputRange: [0, 400]
                  })
                }]
              }
            ]}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={slideBackToMain} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={textColor} />
                <Text style={[styles.backText, { color: textColor }]}>Back</Text>
              </TouchableOpacity>
              <Text style={[styles.title, { color: textColor }]}>Choose AI Model</Text>
            </View>
            <FlatList
              data={visibleModels}
              renderItem={renderModelItem}
              keyExtractor={(item) => item.id}
              style={styles.modelList}
            />
          </Animated.View>
        </BottomSheetView>
      </BottomSheet>
    </Portal>
  );
});

const styles = StyleSheet.create({
  bottomSheetContent: {
    flex: 1,
    padding: 16,
  },
  menuContainer: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
  },
  overlayMenu: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedOption: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  optionText: {
    marginLeft: 16,
    fontSize: 16,
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
  modelList: {
    flex: 1,
  }
});

export default ChatOptionsSheet;