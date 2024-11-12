import * as Calendar from 'expo-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CalendarService = {
  getEvents: async (timeframe) => {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      if (status !== 'granted') {
        return 'Calendar permission not granted';
      }

      // Get visibility settings
      const savedVisibility = await AsyncStorage.getItem('calendar_visibility');
      const visibilitySettings = savedVisibility ? JSON.parse(savedVisibility) : {};

      // Get all calendars
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const visibleCalendarIds = calendars
        .filter(calendar => visibilitySettings[calendar.id] !== false)
        .map(calendar => calendar.id);

      // Calculate start and end dates based on timeframe
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      if (timeframe === 'today') {
        endDate.setHours(23, 59, 59, 999);
      } else if (timeframe === 'tomorrow') {
        startDate.setDate(startDate.getDate() + 1);
        endDate.setDate(endDate.getDate() + 1);
        endDate.setHours(23, 59, 59, 999);
      } else if (timeframe === 'week') {
        endDate.setDate(endDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
      } else if (timeframe === 'extended') {
        startDate.setMonth(startDate.getMonth() - 12);
        endDate.setMonth(endDate.getMonth() + 12);
        endDate.setHours(23, 59, 59, 999);
      }

      // Get events only from visible calendars
      const events = await Promise.all(
        visibleCalendarIds.map(calendarId =>
          Calendar.getEventsAsync(
            [calendarId],
            startDate,
            endDate
          )
        )
      );

      // Flatten and format events
      return events
        .flat()
        .map(event => ({
          title: event.title,
          startTime: new Date(event.startDate).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          endTime: new Date(event.endDate).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          date: new Date(event.startDate).toLocaleDateString(),
          startDate: event.startDate,
          location: event.location || 'No location specified'
        }))
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return 'Error fetching calendar events';
    }
  },

  createEvent: async (eventDetails) => {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      if (status !== 'granted') {
        return { 
          success: false, 
          message: 'Calendar permission not granted' 
        };
      }

      // Get visibility settings
      const savedVisibility = await AsyncStorage.getItem('calendar_visibility');
      const visibilitySettings = savedVisibility ? JSON.parse(savedVisibility) : {};

      // Get calendars and filter for visible ones
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const visibleCalendars = calendars.filter(cal => visibilitySettings[cal.id] !== false);

      if (visibleCalendars.length === 0) {
        return { 
          success: false, 
          message: 'No visible calendars found. Please enable at least one calendar in settings.' 
        };
      }

      // Try to find the primary calendar among visible calendars
      const primaryCalendar = visibleCalendars.find(cal => cal.isPrimary);
      const defaultCalendar = primaryCalendar || visibleCalendars[0];

      const event = {
        title: eventDetails.title,
        startDate: new Date(eventDetails.startDate),
        endDate: new Date(eventDetails.endDate),
        location: eventDetails.location || '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        calendarId: defaultCalendar.id
      };

      const eventId = await Calendar.createEventAsync(defaultCalendar.id, event);
      return { 
        success: true, 
        message: 'Event created successfully',
        eventId 
      };

    } catch (error) {
      console.error('Error creating calendar event:', error);
      return { 
        success: false, 
        message: 'Failed to create event' 
      };
    }
  },

  getCalendars: async () => {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      if (status !== 'granted') {
        return { error: 'Calendar permission not granted' };
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      return calendars.map(calendar => ({
        id: calendar.id,
        title: calendar.title,
        source: calendar.source.name,
        isPrimary: calendar.isPrimary,
        color: calendar.color,
        allowsModifications: calendar.allowsModifications,
        type: calendar.type,
        isVisible: true // Default to visible
      }));
    } catch (error) {
      console.error('Error fetching calendars:', error);
      return { error: 'Failed to fetch calendars' };
    }
  },

  getSelectedCalendars: async () => {
    try {
      // Get all available calendars
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      // Get saved calendar selections from AsyncStorage
      const savedSelectionsStr = await AsyncStorage.getItem('selectedCalendars');
      const savedSelections = savedSelectionsStr ? JSON.parse(savedSelectionsStr) : {};
      
      // Map calendars with their selection status
      return calendars.map(calendar => ({
        id: calendar.id,
        title: calendar.title,
        color: calendar.color,
        source: calendar.source,
        selected: savedSelections[calendar.id] !== false // default to true if not saved
      }));
    } catch (error) {
      console.error('Error getting selected calendars:', error);
      return [];
    }
  },

  saveSelectedCalendars: async (selections) => {
    try {
      await AsyncStorage.setItem('selectedCalendars', JSON.stringify(selections));
    } catch (error) {
      console.error('Error saving calendar selections:', error);
    }
  }
};
