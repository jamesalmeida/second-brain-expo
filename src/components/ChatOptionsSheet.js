import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useTheme } from '../contexts/ThemeContext';
import { Portal } from '@gorhom/portal';

const ChatOptionsSheet = memo(({ bottomSheetRef, snapPoints, handleSheetChanges }) => {
  const { isDarkMode } = useTheme();
  const backgroundColor = isDarkMode ? '#1c1c1e' : 'white';
  const textColor = isDarkMode ? '#ffffff' : '#000000';

  const renderBackdrop = props => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
    />
  );

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
        backgroundStyle={{ backgroundColor }}
      >
        <BottomSheetView style={[styles.bottomSheetContent, { backgroundColor }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => bottomSheetRef.current?.close()}
          >
            <Ionicons name="close-circle-outline" size={30} color={textColor} />
          </TouchableOpacity>
          <View style={styles.container}>
            <Text style={[styles.title, { color: textColor }]}>Chat Options</Text>
            <TouchableOpacity style={styles.option}>
              <Ionicons name="image-outline" size={24} color={textColor} />
              <Text style={[styles.optionText, { color: textColor }]}>Send Image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option}>
              <Ionicons name="location-outline" size={24} color={textColor} />
              <Text style={[styles.optionText, { color: textColor }]}>Share Location</Text>
            </TouchableOpacity>
          </View>
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
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  optionText: {
    marginLeft: 16,
    fontSize: 16,
  },
});

export default ChatOptionsSheet;