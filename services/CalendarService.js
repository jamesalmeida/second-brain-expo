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
  },

  createEvent: async (eventDetails) => {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      console.log('Calendar permission check for event creation:', status);

      if (status !== 'granted') {
        return 'I need calendar permission to create events. Please enable it in Settings.';
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      console.log('Available calendars:', calendars.map(cal => ({
        id: cal.id,
        title: cal.title,
        source: cal.source,
        isPrimary: cal.isPrimary,
        type: cal.type
      })));

      if (calendars.length === 0) {
        return 'No calendars found on your device.';
      }

      // Try to find the primary calendar first
      const primaryCalendar = calendars.find(cal => cal.isPrimary);
      const defaultCalendar = primaryCalendar || calendars[0];
      console.log('Selected calendar for event:', {
        id: defaultCalendar.id,
        title: defaultCalendar.title,
        isPrimary: defaultCalendar.isPrimary
      });

      const event = {
        title: eventDetails.title,
        startDate: new Date(eventDetails.startDate),
        endDate: new Date(eventDetails.endDate),
        location: eventDetails.location || '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        calendarId: defaultCalendar.id
      };

      console.log('Attempting to create event with details:', {
        ...event,
        startDateFormatted: event.startDate.toLocaleString(),
        endDateFormatted: event.endDate.toLocaleString()
      });

      const eventId = await Calendar.createEventAsync(defaultCalendar.id, event);
      console.log('Created event successfully:', { 
        eventId,
        calendarId: defaultCalendar.id,
        calendarTitle: defaultCalendar.title
      });

      // Verify the event was created by trying to fetch it
      try {
        const createdEvent = await Calendar.getEventAsync(eventId);
        console.log('Verified created event:', {
          id: createdEvent.id,
          title: createdEvent.title,
          startDate: new Date(createdEvent.startDate).toLocaleString(),
          endDate: new Date(createdEvent.endDate).toLocaleString()
        });
      } catch (verifyError) {
        console.error('Failed to verify created event:', verifyError);
      }

      return {
        success: true,
        message: 'Event created successfully',
        eventId,
        calendarDetails: {
          id: defaultCalendar.id,
          title: defaultCalendar.title
        }
      };
    } catch (error) {
      console.error('Error creating calendar event:', {
        error: error.message,
        stack: error.stack,
        eventDetails
      });
      return {
        success: false,
        message: 'Failed to create event: ' + error.message
      };
    }
  }
};
