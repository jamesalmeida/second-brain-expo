import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { Calendar, Agenda } from 'react-native-calendars';
import { CalendarService } from '../services/CalendarService';

const CalendarBottomSheet = ({ 
  bottomSheetRef, 
  snapPoints, 
  handleSheetChanges, 
  isDarkMode,
  selectedDate,
  setSelectedDate 
}) => {
  const [events, setEvents] = useState({});
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = useCallback((index) => {
    setIsSheetOpen(index === 0);
    handleSheetChanges(index);
  }, [handleSheetChanges]);

  useEffect(() => {
    const loadEvents = async () => {
      if (!isSheetOpen) return;
      
      setIsLoading(true);
      try {
        const calendarEvents = await CalendarService.getEvents('week');
        const formattedEvents = {};
        
        // Get the start and end of the week
        const startDate = new Date(selectedDate);
        startDate.setDate(startDate.getDate() - 3); // 3 days before
        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 3); // 3 days after

        // Initialize all dates in the range with empty arrays
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          formattedEvents[dateStr] = [];
        }

        // Add events if they exist
        if (Array.isArray(calendarEvents)) {
          calendarEvents.forEach(event => {
            const dateStr = new Date(event.startDate).toISOString().split('T')[0];
            if (!formattedEvents[dateStr]) {
              formattedEvents[dateStr] = [];
            }
            formattedEvents[dateStr].push({
              ...event,
              height: 80,
              day: dateStr
            });
          });
        }

        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
        // Initialize with empty events object on error
        setEvents({});
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEvents();
  }, [selectedDate, isSheetOpen]);

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
    agendaDayTextColor: isDarkMode ? '#ffffff' : '#2d4150',
    agendaDayNumColor: isDarkMode ? '#ffffff' : '#2d4150',
    agendaTodayColor: '#007AFF',
    agendaKnobColor: isDarkMode ? '#ffffff' : '#2d4150'
  };

  const formattedDate = selectedDate.toISOString().split('T')[0];
  const markedDates = {
    [formattedDate]: {
      selected: true,
      selectedColor: '#007AFF',
    }
  };


  const renderItem = (item) => {
    return (
      <View style={[styles.item, { backgroundColor: isDarkMode ? '#2c2c2e' : '#f2f2f7' }]}>
        <Text style={[styles.itemText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          {item.title}
        </Text>
        <Text style={[styles.itemTime, { color: isDarkMode ? '#ffffff80' : '#00000080' }]}>
          {item.startTime} - {item.endTime}
        </Text>
        {item.location && (
          <Text style={[styles.itemLocation, { color: isDarkMode ? '#ffffff80' : '#00000080' }]}>
            📍 {item.location}
          </Text>
        )}
      </View>
    );
  };

  const renderEmptyDate = () => {
    return (
      <View style={[styles.emptyDate, { backgroundColor: isDarkMode ? '#2c2c2e' : '#f2f2f7' }]}>
        <Text style={{ color: isDarkMode ? '#ffffff80' : '#00000080' }}>
          No events scheduled
        </Text>
      </View>
    );
  };

  return (
    <Portal>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleChange}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: isDarkMode ? '#ffffff' : '#000000' }}
        backgroundStyle={{ backgroundColor: isDarkMode ? '#1c1c1e' : 'white' }}
      >
        <BottomSheetView style={styles.container}>
          {isSheetOpen && (
            <Agenda
              theme={calendarTheme}
              items={events}
              selected={formattedDate}
              renderItem={renderItem}
              renderEmptyDate={renderEmptyDate}
              onDayPress={(day) => {
                const [year, month, date] = day.dateString.split('-');
                const newDate = new Date(year, month - 1, date);
                setSelectedDate(newDate);
              }}
              showClosingKnob={true}
              hideKnob={false}
              showOnlySelectedDayItems={false}
              pastScrollRange={1}
              futureScrollRange={1}
              refreshControl={null}
              refreshing={false}
              loadItemsForMonth={() => {}}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    marginTop: 17,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemTime: {
    fontSize: 14,
    marginTop: 4,
  },
  itemLocation: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyDate: {
    height: 60,
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    marginTop: 17,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default CalendarBottomSheet;