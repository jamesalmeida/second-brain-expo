import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { Calendar, Agenda } from 'react-native-calendars';
import { CalendarService } from '../services/CalendarService';
import { Ionicons } from '@expo/vector-icons';

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
    console.log('Calendar sheet index changed:', index);
    setIsSheetOpen(index === 0);
    handleSheetChanges(index);
  }, [handleSheetChanges]);

  useEffect(() => {
    const loadEvents = async () => {
      if (!isSheetOpen) return;
      
      setIsLoading(true);
      try {
        // Get the start and end of the week
        const startDate = new Date(selectedDate);
        startDate.setDate(startDate.getDate() - 3); // 3 days before
        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 3); // 3 days after

        const calendarEvents = await CalendarService.getEvents('extended');
        const formattedEvents = {};
        
        // Initialize dates in the week range
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          formattedEvents[dateStr] = [];
        }

        // Add events if they exist
        if (Array.isArray(calendarEvents)) {
          calendarEvents.forEach(event => {
            const dateStr = new Date(event.startDate).toISOString().split('T')[0];
            if (new Date(dateStr) >= startDate && new Date(dateStr) <= endDate) {
              if (!formattedEvents[dateStr]) {
                formattedEvents[dateStr] = [];
              }
              formattedEvents[dateStr].push({
                ...event,
                height: 80,
                day: dateStr
              });
            }
          });
        }

        setEvents(prevEvents => ({
          ...prevEvents,
          ...formattedEvents
        }));
      } catch (error) {
        console.error('Error loading events:', error);
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
    todayTextColor: '#007AFF', // today's number in the calendar week view
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
    agendaTodayColor: isDarkMode ? '#007AFF' : '#c91224', // Today's number in the agenda list
    textDayFontWeight: '400', // Numbers in the calendar week view
    textDayHeaderFontWeight: '400', // DOW in the calendar week view
    // todayTextFontWeight: '800', // ???
    'stylesheet.agenda.main': {
      // Add custom styling for today's text
      todayText: {
        fontWeight: '800', // Make today's date bold
        color: isDarkMode ? '#007AFF' : '#c91224',
      }
    },
    reservationsBackgroundColor: isDarkMode ? '#1c1c1e' : 'white',
    selectedDotColor: '#007AFF',
    dotColor: '#007AFF',
    todayBackgroundColor: isDarkMode ? '#2c2c2e' : '#e3e3e3'
    // agenda: {
    //   backgroundColor: isDarkMode ? '#1c1c1e' : 'white',
    //   reservationsBackgroundColor: isDarkMode ? '#1c1c1e' : 'white',
    //   selectedDayBackgroundColor: '#007AFF',
    //   dayTextColor: isDarkMode ? '#ffffff' : '#2d4150',
    //   todayTextColor: '#007AFF',
    //   dotColor: '#007AFF',
    //   selectedDotColor: '#ffffff',
    //   monthTextColor: isDarkMode ? '#ffffff' : '#000000'
    // }
  };

  const formattedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).toISOString().split('T')[0];
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0];
  const markedDates = {
    [formattedDate]: {
      selected: true,
      selectedColor: '#007AFF',
    },
    [today]: {
      marked: true,
      dotColor: '#007AFF'
    }
  };

  // If today is the selected date, merge the properties
  if (today === formattedDate) {
    markedDates[today] = {
      ...markedDates[today],
      ...markedDates[formattedDate]
    };
  }

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

  const formattedMonth = selectedDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const loadItemsForMonth = async (month) => {
    if (!isSheetOpen) return;
    
    try {
      const monthStart = new Date(month.timestamp);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const calendarEvents = await CalendarService.getEvents('extended');
      const formattedEvents = {};

      // Initialize the entire month with empty arrays
      for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
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

      setEvents(prevEvents => ({
        ...prevEvents,
        ...formattedEvents
      }));
    } catch (error) {
      console.error('Error loading events for month:', error);
    }
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
            <>
              <View style={styles.headerContainer}>
                <Ionicons
                  name="today-outline" 
                  size={24} 
                  color={isDarkMode ? 'white' : 'black'} 
                  onPress={() => setSelectedDate(new Date())}
                />
                <Text style={[
                  styles.monthHeader, 
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  {formattedMonth}
                </Text>
                <Ionicons
                  name="close-circle-outline" 
                  size={24} 
                  color={isDarkMode ? 'white' : 'black'}
                  onPress={() => bottomSheetRef.current?.close()} 
                />
              </View>
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
                pastScrollRange={12}
                futureScrollRange={12}
                refreshControl={null}
                refreshing={false}
                loadItemsForMonth={loadItemsForMonth}
                style={{
                  backgroundColor: isDarkMode ? '#1c1c1e' : 'white'
                }}
                markedDates={markedDates}
              />
            </>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthHeader: {
    fontSize: 20,
    fontWeight: '600',
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