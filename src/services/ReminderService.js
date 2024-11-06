import * as Calendar from 'expo-calendar';

export const ReminderService = {
  getReminders: async (timeframe = 'all', listType = '') => {
    try {
      const { status } = await Calendar.getRemindersPermissionsAsync();
      console.log('Reminder permission check in service:', status);
      console.log('Fetching reminders with params:', { timeframe, listType });

      if (status !== 'granted') {
        return 'I need reminders permission to check your reminders. Please enable it in Settings.';
      }

      const reminderCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
      console.log('Found reminder calendars:', reminderCalendars.length);

      if (reminderCalendars.length === 0) {
        console.log('No reminder calendars found');
        return 'No reminder calendars found on your device.';
      }

      // Always set a date range, but make it very wide for 'all'
      const startDate = new Date();
      const endDate = new Date();

      if (timeframe === 'all') {
        // Set start date to 1 year ago
        startDate.setFullYear(startDate.getFullYear() - 1);
        // Set end date to 1 year from now
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (timeframe === 'tomorrow') {
        startDate.setDate(startDate.getDate() + 1);
        endDate.setDate(endDate.getDate() + 1);
      } else if (timeframe === 'week') {
        endDate.setDate(endDate.getDate() + 7);
      } else if (timeframe === 'today') {
        // For today, keep startDate as is and set endDate to end of today
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Default case (if timeframe is not recognized)
        // Set endDate to end of current day
        endDate.setHours(23, 59, 59, 999);
      }

      console.log('Time range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timeframe
      });

      const remindersPromises = reminderCalendars.map(async calendar => {
        console.log('Processing Reminders List:', {
          id: calendar.id,
          title: calendar.title
        });

        try {
          const calendarReminders = await Calendar.getRemindersAsync(
            [calendar.id],
            Calendar.EntityTypes.REMINDER,
            new Date(startDate),
            new Date(endDate)
          );
          console.log(`Found ${calendarReminders.length} reminders in ${calendar.title}`);
          return calendarReminders;
        } catch (error) {
          console.error(`Error fetching reminders from ${calendar.title}:`, error);
          return [];
        }
      });

      const remindersArrays = await Promise.all(remindersPromises);
      let reminders = remindersArrays.flat();
      
      console.log('Total reminders found:', reminders.length);

      // Filter by list type if specified
      if (listType) {
        console.log('Filtering by list type:', listType);
        const lowercaseListType = listType.toLowerCase();
        reminders = reminders.filter(reminder => {
          const matchesTitle = reminder.title?.toLowerCase().includes(lowercaseListType);
          const matchesNotes = reminder.notes?.toLowerCase().includes(lowercaseListType);
          const matchesCalendar = reminder.calendar?.title.toLowerCase().includes(lowercaseListType);
          return matchesTitle || matchesNotes || matchesCalendar;
        });
        console.log('Filtered reminders count:', reminders.length);
      }

      if (reminders.length === 0) {
        return listType 
          ? `You have no reminders in the ${listType} list.`
          : `You have no reminders ${timeframe !== 'all' ? `for ${timeframe}` : ''}.`;
      }

      return reminders;

    } catch (error) {
      console.error('Reminder service error:', error);
      console.error('Error details:', error.message);
      return 'Sorry, I encountered an error while checking your reminders.';
    }
  }
};
