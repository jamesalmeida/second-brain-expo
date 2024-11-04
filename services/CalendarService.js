import * as Calendar from 'expo-calendar';

export const CalendarService = {
  getEvents: async (timeframe = 'today') => {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      console.log('Calendar permission check in service:', status);

      if (status !== 'granted') {
        return 'I need calendar permission to check your events. Please enable it in Settings.';
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      console.log('Available calendars:', calendars.length);

      const startDate = new Date();
      const endDate = new Date();

      if (timeframe === 'tomorrow') {
        startDate.setDate(startDate.getDate() + 1);
        endDate.setDate(endDate.getDate() + 1);
      } else if (timeframe === 'week') {
        endDate.setDate(endDate.getDate() + 7);
      }

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      console.log('Fetching events for timeframe:', {
        timeframe,
        startDate,
        endDate
      });

      const events = await Calendar.getEventsAsync(
        calendars.map(calendar => calendar.id),
        startDate,
        endDate
      );
      console.log('Found events:', events.length);

      if (events.length === 0) {
        return `You have no events scheduled for ${timeframe}.`;
      }

      const formattedEvents = events.map(event => ({
        title: event.title,
        startTime: new Date(event.startDate).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        endTime: new Date(event.endDate).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        location: event.location || 'No location specified',
        date: new Date(event.startDate).toLocaleDateString()
      }));

      return formattedEvents;
    } catch (error) {
      console.error('Calendar service error:', error);
      return 'Sorry, I encountered an error while checking your calendar.';
    }
  }
};
