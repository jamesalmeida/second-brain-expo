import React from 'react';
import { View, Text } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';

const CalendarBottomSheet = ({ bottomSheetRef, snapPoints, handleSheetChanges, isDarkMode }) => {
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
        backgroundStyle={{ backgroundColor: isDarkMode ? '#1c1c1e' : 'white' }}
      >
        <BottomSheetView style={{ flex: 1, padding: 16 }}>
          <Text style={{ 
            textAlign: 'center', 
            fontSize: 16, 
            color: isDarkMode ? '#ffffff' : '#000000' 
          }}>
            Calendar goes here
          </Text>
        </BottomSheetView>
      </BottomSheet>
    </Portal>
  );
};

export default CalendarBottomSheet;