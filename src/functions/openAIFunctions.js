// When adding new fuctions here remember to also add some handling of the new function 
// in the sendMessageToOpenAI function in ChatContext.js

export const openAIImageGenerationFunctions = [
    {
      name: "generateDallEImage",
      description: "Generate an image using DALL-E based on the user's description",
      parameters: {
        type: "object",
        properties: {
          shouldGenerateImage: {
            type: "boolean",
            description: "Whether the user is requesting image generation"
          },
          imagePrompt: {
            type: "string",
            description: "The prompt to use for DALL-E image generation"
          }
        },
        required: ["shouldGenerateImage", "imagePrompt"]
      }
    }
  ];
  
export const calendarFunctions = [
    {
        name: "checkCalendar",
        description: "Check calendar events when user asks about their schedule",
        parameters: {
        type: "object",
        properties: {
            isCalendarQuery: {
            type: "boolean",
            description: "Whether the user is asking about their calendar or schedule"
            },
            timeframe: {
            type: "string",
            enum: ["today", "tomorrow", "week"],
            description: "The timeframe the user is asking about"
            }
        },
        required: ["isCalendarQuery", "timeframe"]
        }
    },
    {
        name: "createCalendarEvent",
        description: "Create a calendar event when user wants to add something to their calendar",
        parameters: {
        type: "object",
        properties: {
            shouldCreateEvent: {
            type: "boolean",
            description: "Whether the user wants to create a calendar event"
            },
            currentDateTime: {
            type: "string",
            description: "The current date and time in ISO format - DO NOT MODIFY THIS"
            },
            title: {
            type: "string",
            description: "The title or name of the event"
            },
            isAllDay: {
                type: "boolean",
                description: "Whether this is an all-day event without specific start/end times"
            },
            startDate: {
            type: "string",
            description: "The start date and time of the event in ISO format. Must be based on currentDateTime for relative times like 'tomorrow' or 'next week'"
            },
            endDate: {
            type: "string",
            description: "The end date and time of the event in ISO format. Should be after startDate by the specified duration"
            },
            location: {
            type: "string",
            description: "The location of the event (optional)"
            }
        },
        required: ["shouldCreateEvent", "currentDateTime", "title", "startDate", "endDate", "isAllDay"]
        }
    },
    {
        name: "listCalendars",
        description: "List all available calendars when user asks about their calendar options",
        parameters: {
            type: "object",
            properties: {
                shouldListCalendars: {
                    type: "boolean",
                    description: "Whether the user is asking to see their available calendars"
                }
            },
            required: ["shouldListCalendars"]
        }
    },
    {
        name: "setDefaultCalendar",
        description: "Set a specific calendar as the default for new events",
        parameters: {
            type: "object",
            properties: {
                shouldSetDefault: {
                    type: "boolean",
                    description: "Whether the user wants to set a default calendar"
                },
                calendarName: {
                    type: "string",
                    description: "The name or partial name of the calendar to set as default"
                }
            },
            required: ["shouldSetDefault", "calendarName"]
        }
    }
];

export const reminderFunctions = [
    {
        name: "checkReminders",
        description: "Check reminders when user asks about their to-dos, lists, or reminders",
        parameters: {
        type: "object",
        properties: {
            isReminderQuery: {
            type: "boolean",
            description: "Whether the user is asking about their reminders, to-dos, or lists"
            },
            timeframe: {
            type: "string",
            enum: ["today", "tomorrow", "week", "all"],
            description: "The timeframe the user is asking about, use 'all' if no specific timeframe"
            },
            listType: {
            type: "string",
            description: "The specific list or group of reminders (e.g., 'groceries', 'todo', etc.). Leave empty if not specified"
            }
        },
        required: ["isReminderQuery", "timeframe"]
        }
    }
];

export const previousResponseFunction = [
    {
        name: "checkPreviousResponse",
        description: "Check if the user is referring to a previous AI response and use it as context",
        parameters: {
        type: "object",
        properties: {
            isPreviousReference: {
            type: "boolean",
            description: "Whether the user is referring to a previous response"
            },
            referenceType: {
            type: "string",
            enum: ["image", "text", "both"],
            description: "The type of reference being made to the previous response"
            },
            contextNeeded: {
            type: "boolean",
            description: "Whether additional context from the previous response is needed"
            }
        },
        required: ["isPreviousReference", "referenceType"]
        }
    }
];

export const memoryFunctions = [
    {
        name: "saveMemory",
        description: "Save a memory based on the user input",
        parameters: {
            type: "object",
            properties: {
                memoryContent: {
                    type: "string",
                    description: "The content to save as memory"
                }
            },
            required: ["memoryContent"]
        }
    },
    {
        name: "checkMemories",
        description: "Check saved memories for relevant context",
        parameters: {
            type: "object",
            properties: {
                shouldCheckMemories: {
                    type: "boolean",
                    description: "Whether the response requires checking saved memories"
                },
                searchTerms: {
                    type: "array",
                    items: {
                        type: "string"
                    },
                    description: "Key terms to search for in memories"
                }
            },
            required: ["shouldCheckMemories", "searchTerms"]
        }
    }
];