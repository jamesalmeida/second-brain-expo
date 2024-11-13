import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { Calendar, Agenda } from 'react-native-calendars';
import { CalendarService } from '../services/CalendarService';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../contexts/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-timezone';

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
  const { getChatByDate, createNewChat, currentChatId, setCurrentChatId } = useChat();
  const [timezone, setTimezone] = useState(moment.tz.guess());

  // Enhanced console logs
  useEffect(() => {
    console.log('events in CalendarBottomSheet:', events);
    console.log('isSheetOpen in CalendarBottomSheet:', isSheetOpen);
    console.log('isLoading in CalendarBottomSheet:', isLoading);
    console.log('selectedDate in CalendarBottomSheet:', selectedDate.toString());
    console.log('currentChatId in CalendarBottomSheet:', currentChatId);
    console.log('timezone in CalendarBottomSheet:', timezone);
    console.log('Type of selectedDate:', typeof selectedDate); // Should print 'object'
    console.log('Is selectedDate a Date instance?', selectedDate instanceof Date); // Should print true
  }, [events, isSheetOpen, isLoading, selectedDate, currentChatId, timezone]);

  useEffect(() => {
    // Load saved timezone
    const loadTimezone = async () => {
      const savedTimezone = await AsyncStorage.getItem('selectedTimezone');
      if (savedTimezone) {
        setTimezone(savedTimezone);
      }
    };
    loadTimezone();
  }, []);

  const handleDateSelect = async (day) => {
    console.log('CalendarBottomSheet - handleDateSelect called with day:', day);
    
    // Create date in the user's timezone
    const selectedMoment = moment.tz([day.year, day.month - 1, day.day], timezone);
    const newSelectedDate = selectedMoment.toDate();
    
    // Get or create chat for selected date
    const dateStr = selectedMoment.format('YYYY-MM-DD');
    const existingChat = getChatByDate(newSelectedDate);
    
    if (existingChat) {
      setCurrentChatId(dateStr);
    } else {
      createNewChat(newSelectedDate);
    }

    setSelectedDate(newSelectedDate);
    
    // Load events for the selected month
    const month = {
      timestamp: newSelectedDate.getTime()
    };
    await loadItemsForMonth(month);
  };

  // Format the date for the calendar
  const formattedDate = moment(selectedDate).tz(timezone).format('YYYY-MM-DD');
  const formattedMonth = moment(selectedDate).tz(timezone).format('MMMM YYYY');

  console.log('formattedDate in CalendarBottomSheet:', formattedDate);
  
  // Format today's date in the user's timezone
  const today = moment().tz(timezone).format('YYYY-MM-DD');

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

  console.log('markedDates in CalendarBottomSheet:', markedDates);

  // If today is the selected date, merge the properties
  if (today === formattedDate) {
    markedDates[today] = {
      ...markedDates[today],
      ...markedDates[formattedDate]
    };
  }

  const handleChange = useCallback((index) => {
    console.log('CalendarBottomSheet - handleChange called with index:', index);
    const isOpen = index >= 0;
    setIsSheetOpen(isOpen);
    handleSheetChanges(index);
  }, [handleSheetChanges]);

  useEffect(() => {
    if (!selectedDate || !isSheetOpen) return;
    
    const month = {
      timestamp: selectedDate.getTime()
    };
    loadItemsForMonth(month);
  }, [isSheetOpen]);

  const loadItemsForMonth = async (month) => {
    console.log('CalendarBottomSheet - loadItemsForMonth called with month:', month);

    if (!isSheetOpen) {
      console.log('CalendarBottomSheet - Sheet is not open, returning early');
      return;
    }

    setIsLoading(true);
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

      // Initialize all dates in the month with empty arrays
      for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        formattedEvents[dateStr] = [];
      }

      // Add events if they exist
      if (Array.isArray(calendarEvents)) {
        calendarEvents.forEach(event => {
          const eventDate = new Date(event.startDate);
          const dateStr = eventDate.toISOString().split('T')[0];
          
          if (eventDate >= monthStart && eventDate <= monthEnd) {
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

      console.log('CalendarBottomSheet - Events loaded:', formattedEvents);
      
      setEvents(prevEvents => {
        console.log('CalendarBottomSheet - Updating events state');
        return {
          ...prevEvents,
          ...formattedEvents
        };
      });
    } catch (error) {
      console.error('CalendarBottomSheet - Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleTodayPress = () => {
    const todayMoment = moment().tz(timezone);
    const todayDate = todayMoment.toDate();
    const todayStr = todayMoment.format('YYYY-MM-DD');
    
    // Check for existing chat first
    const existingChat = getChatByDate(todayDate);
    
    if (existingChat) {
      setCurrentChatId(todayStr);
    } else {
      createNewChat(todayDate);
    }
    
    setSelectedDate(todayDate);
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
          <View style={styles.headerContainer}>
            <Ionicons
              name="today-outline" 
              size={24} 
              color={isDarkMode ? 'white' : 'black'} 
              onPress={handleTodayPress}
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
            onDayPress={handleDateSelect}
            showClosingKnob={false}
            hideKnob={false} // So user can scroll through the months view
            showOnlySelectedDayItems={false}
            pastScrollRange={3}
            futureScrollRange={3}
            refreshControl={null}
            refreshing={isLoading}
            loadItemsForMonth={loadItemsForMonth}
            refreshing={false}
            style={{
              backgroundColor: isDarkMode ? '#1c1c1e' : 'white'
            }}
            markedDates={markedDates}
            enableSwipeMonths={true}
            renderEmptyData={renderEmptyDate}
          />
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