import React from 'react';
import { View } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { Calendar } from 'react-native-calendars';

const CalendarBottomSheet = ({ 
  bottomSheetRef, 
  snapPoints, 
  handleSheetChanges, 
  isDarkMode,
  selectedDate,
  setSelectedDate 
}) => {
  const renderBackdrop = props => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
    />
  );

  const calendarTheme = {
    backgroundColor: isDarkMode ? '#1c1c1e' : 'white',
    calendarBackground: isDarkMode ? '#1c1c1e' : 'white',
    textSectionTitleColor: isDarkMode ? '#ffffff' : '#000000',
    textSectionTitleDisabledColor: isDarkMode ? '#444444' : '#d9e1e8',
    selectedDayBackgroundColor: '#007AFF',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#007AFF',
    dayTextColor: isDarkMode ? '#ffffff' : '#2d4150',
    textDisabledColor: isDarkMode ? '#444444' : '#d9e1e8',
    dotColor: '#007AFF',
    selectedDotColor: '#ffffff',
    arrowColor: isDarkMode ? '#ffffff' : '#000000',
    disabledArrowColor: isDarkMode ? '#444444' : '#d9e1e8',
    monthTextColor: isDarkMode ? '#ffffff' : '#000000',
    indicatorColor: isDarkMode ? '#ffffff' : '#000000',
  };

  // Format date for the calendar marking
  const formattedDate = selectedDate.toISOString().split('T')[0];
  const markedDates = {
    [formattedDate]: {
      selected: true,
      selectedColor: '#007AFF',
    }
  };

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
          <Calendar
            theme={calendarTheme}
            onDayPress={(day) => {
              const [year, month, date] = day.dateString.split('-');
              const newDate = new Date(year, month - 1, date);
              setSelectedDate(newDate);
              bottomSheetRef.current?.close();
            }}
            enableSwipeMonths={true}
            current={formattedDate}
            markedDates={markedDates}
          />
        </BottomSheetView>
      </BottomSheet>
    </Portal>
  );
};

export default CalendarBottomSheet;