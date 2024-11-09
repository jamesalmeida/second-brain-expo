import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { OPENAI_API_KEY } from '@env';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OpenAI } from 'openai';
import { Platform } from 'react-native';
import { CalendarService } from '../services/CalendarService';
import { ReminderService } from '../services/ReminderService';
import { LocationService } from '../services/LocationService';

// TOGGLE FOR WEB DEVELOPMENT ONLY - DISABLE IN PRODUCTION
// API KEYS ARE NOT SUPPORTED ON WEB IN THIS VERSION
const ALLOW_BROWSER = false;

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentModel, setCurrentModel] = useState('GPT-3.5');
  const [availableModels, setAvailableModels] = useState([]);
  const [modelMap, setModelMap] = useState({});
  const [apiKey, setApiKey] = useState('');
  const [useBuiltInKey, setUseBuiltInKey] = useState(false); // Make initial state false
  const [builtInKeyCode, setBuiltInKeyCode] = useState('4084'); // Temp code for testing without needing to subscribe
  const [grokApiKey, setGrokApiKey] = useState('');
  const [useGrokKey, setUseGrokKey] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCalendarAccess, setHasCalendarAccess] = useState(false);
  const [defaultModel, setDefaultModel] = useState('GPT-3.5');
  const [hiddenModels, setHiddenModels] = useState([]);

  const changeModel = async (newModel) => {
    console.log('Model changed to:', newModel);
    setCurrentModel(newModel);
    
    if (chats.length > 0) {
      const modelChangeMessage = {
        role: 'system',
        content: `Switched to ${newModel} model`
      };
      
      const updatedChats = chats.map(chat => {
        if (chat.id === currentChatId) {
          const messages = [...chat.messages];
          const lastMessage = messages[messages.length - 1];
          
          if (lastMessage && 
              lastMessage.role === 'system' && 
              lastMessage.content.startsWith('Switched to')) {
            messages[messages.length - 1] = modelChangeMessage;
          } else {
            messages.push(modelChangeMessage);
          }
          
          return { ...chat, messages };
        }
        return chat;
      });
      
      setChats(updatedChats);
      const updatedChat = updatedChats.find(chat => chat.id === currentChatId);
      if (updatedChat) {
        await saveChat(updatedChat);
      }
    }
  };

  const chatDirectory = FileSystem.documentDirectory + 'chats/';

  useEffect(() => {
    const initializeChats = async () => {
      await ensureChatDirectoryExists();
      const loadedChats = await loadChats();
      if (loadedChats.length > 0) {
        setChats(loadedChats);
        setCurrentChatId(loadedChats[loadedChats.length - 1].id);
      } else {
        // Just create the ID and model, but don't add to chats yet
        const { id } = createNewChat();
        setCurrentChatId(id);
      }
      fetchAvailableModels();
      loadApiKeySettings();
      await Promise.all([
        loadDefaultModel(),
        loadHiddenModels()
      ]);
    };
    initializeChats();
  }, []);
  
  const loadApiKeySettings = async () => {
    try {
      const storedApiKey = await AsyncStorage.getItem('openai_api_key');
      const storedGrokApiKey = await AsyncStorage.getItem('grok_api_key');
      const storedUseBuiltInKey = await AsyncStorage.getItem('use_built_in_key');
      const storedUseGrokKey = await AsyncStorage.getItem('use_grok_key');
      
      if (storedApiKey !== null) setApiKey(storedApiKey);
      if (storedGrokApiKey !== null) setGrokApiKey(storedGrokApiKey);
      if (storedUseBuiltInKey !== null) setUseBuiltInKey(JSON.parse(storedUseBuiltInKey));
      if (storedUseGrokKey !== null) setUseGrokKey(JSON.parse(storedUseGrokKey));
    } catch (error) {
      console.error('Error loading API key settings:', error);
    }
  };

  const ensureChatDirectoryExists = async () => {
    if (Platform.OS === 'web') {
      return; // No directory needed for web
    }
    const dirInfo = await FileSystem.getInfoAsync(chatDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(chatDirectory, { intermediates: true });
    }
  };

  const saveChat = async (chat) => {
    try {
      if (Platform.OS === 'web') {
        // Web storage implementation
        const chats = await AsyncStorage.getItem('chats') || '[]';
        const parsedChats = JSON.parse(chats);
        const updatedChats = parsedChats.map(c => 
          c.id === chat.id ? chat : c
        );
        if (!updatedChats.find(c => c.id === chat.id)) {
          updatedChats.push(chat);
        }
        await AsyncStorage.setItem('chats', JSON.stringify(updatedChats));
      } else {
        // Native storage implementation
        const fileName = `${chat.id}.md`;
        const filePath = chatDirectory + fileName;
        
        let markdownContent = `# ${chat.title}\n\n`;
        chat.messages.forEach(message => {
          markdownContent += `## ${message.role}\n${message.content}\n\n`;
        });
        
        await FileSystem.writeAsStringAsync(filePath, markdownContent);
      }
    } catch (e) {
      console.error('Error saving chat', e);
    }
  };

  const loadChats = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web loading implementation
        const chats = await AsyncStorage.getItem('chats');
        return chats ? JSON.parse(chats) : [];
      } else {
        // Native loading implementation (your existing code)
        const files = await FileSystem.readDirectoryAsync(chatDirectory);
        const chats = await Promise.all(
          files.filter(file => file.endsWith('.md')).map(async (file) => {
            const content = await FileSystem.readAsStringAsync(chatDirectory + file, { encoding: FileSystem.EncodingType.UTF8 });
            const lines = content.split('\n');
            const title = lines[0].replace('# ', '');
            const messages = [];
            let currentRole = '';
            let currentContent = '';

            for (let i = 2; i < lines.length; i++) {
              if (lines[i].startsWith('## ')) {
                if (currentRole) {
                  messages.push({ role: currentRole, content: currentContent.trim() });
                }
                currentRole = lines[i].replace('## ', '');
                currentContent = '';
              } else {
                currentContent += lines[i] + '\n';
              }
            }
            if (currentRole) {
              messages.push({ role: currentRole, content: currentContent.trim() });
            }

            return {
              id: file.replace('.md', ''),
              title,
              messages
            };
          })
        );
        return chats.sort((a, b) => a.id - b.id);
      }
    } catch (e) {
      console.error('Error loading chats', e);
      return [];
    }
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: new Date().toLocaleString(),
      messages: [],
      model: defaultModel
    };
    setCurrentChatId(newChat.id);
    setCurrentModel(defaultModel);
    return newChat;
  };

  const addMessage = async (role, content) => {
    const updatedChats = chats.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: [...chat.messages, { role, content }] }
        : chat
    );
    const updatedChat = updatedChats.find(chat => chat.id === currentChatId);
    await saveChat(updatedChat);
    setChats(updatedChats);
  };

  const openAIImageGenerationFunctions = [
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

  const calendarFunctions = [
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
        required: ["shouldCreateEvent", "currentDateTime", "title", "startDate", "endDate"]
      }
    }
  ];

  const reminderFunctions = [
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

  const previousResponseFunction = [
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

  const handleCalendarQuery = async (message) => {
    const calendarKeywords = ['calendar', 'events', 'schedule', 'appointment', 'meeting'];
    const todayKeywords = ['today', 'today\'s'];
    
    const hasCalendarWord = calendarKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    const hasTodayWord = todayKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    console.log('Calendar query detection:', {
      message,
      hasCalendarWord,
      hasTodayWord,
      willHandle: hasCalendarWord && hasTodayWord
    });

    if (hasCalendarWord && hasTodayWord) {
      console.log('Attempting to fetch calendar events');
      const events = await CalendarService.getEventsForToday();
      console.log('Calendar events response:', events);
      if (typeof events === 'string') {
        return events;
      }
      
      if (Array.isArray(events)) {
        let response = "Here are your events for today:\n\n";
        events.forEach(event => {
          response += ` ${event.title}\n`;
          response += `⏰ ${event.startTime} - ${event.endTime}\n`;
          response += `📍 ${event.location}\n\n`;
        });
        return response;
      }
    }
    return null;
  };

  const handleLocationQuery = async (message) => {
    const locationKeywords = ['where am i', 'my location', 'current location', 'show me the map'];
    
    const hasLocationWord = locationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (hasLocationWord) {
      const result = await LocationService.getCurrentLocation();
      if (result.success) {
        return {
          type: 'location',
          content: result.location
        };
      } else {
        return {
          type: 'text',
          content: result.message
        };
      }
    }
    return null;
  };

  const sendMessageToOpenAI = async (userMessage) => {
    setIsLoading(true);

    try {
      // Check if this chat exists in state
      const chatExists = chats.some(chat => chat.id === currentChatId);
      let updatedChatsWithUserMessage;

      if (!chatExists) {
        // This is a new chat, create it with the first message
        const newChat = {
          id: currentChatId,
          title: new Date().toLocaleString(),
          messages: [{ role: 'user', content: userMessage }],
          model: currentModel
        };
        updatedChatsWithUserMessage = [...chats, newChat];
        setChats(updatedChatsWithUserMessage);
        await saveChat(newChat);
      } else {
        // Existing chat, just add the message
        updatedChatsWithUserMessage = chats.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, messages: [...chat.messages, { role: 'user', content: userMessage }] }
            : chat
        );
        setChats(updatedChatsWithUserMessage);
      }

      console.log('User prompt:', userMessage);
    
      const currentChat = updatedChatsWithUserMessage.find(chat => chat.id === currentChatId);
      const messages = currentChat ? currentChat.messages : [];
      
      const openai = new OpenAI({
        apiKey: useBuiltInKey ? OPENAI_API_KEY : apiKey,
        baseURL: "https://api.openai.com/v1",
        ...(ALLOW_BROWSER && { dangerouslyAllowBrowser: true })
      });

      // Add the fallback logic here
      let modelToUse = modelMap[currentModel] || 'gpt-3.5-turbo';
      
      // If the current model isn't available, fall back to GPT-3.5
      if (!availableModels.some(m => m.name === currentModel)) {
        console.log('Current model unavailable, falling back to GPT-3.5');
        modelToUse = 'gpt-3.5-turbo';
        setCurrentModel('GPT-3.5');
      }

      // Check for location query first
      const locationResponse = await handleLocationQuery(userMessage);
      if (locationResponse) {
        const updatedChatsWithResponse = updatedChatsWithUserMessage.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, messages: [...chat.messages, locationResponse] }
            : chat
        );
        setChats(updatedChatsWithResponse);
        const updatedChat = updatedChatsWithResponse.find(chat => chat.id === currentChatId);
        await saveChat(updatedChat);
        setIsLoading(false);
        return;
      }

      // First, ask the model if this is a calendar or image request
      const now = new Date();
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const contextMessage = `Current date and time: ${now.toLocaleString('en-US', { 
        timeZone: userTimezone,
        dateStyle: 'full',
        timeStyle: 'long'
      })} (${userTimezone})`;

      const functionResponse = await openai.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: "system",
            content: `${contextMessage}\n\nPrevious messages for context: ${messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}`
          },
          { 
            role: "user", 
            content: userMessage 
          }
        ],
        functions: [...previousResponseFunction, ...openAIImageGenerationFunctions, ...calendarFunctions, ...reminderFunctions],
        function_call: "auto"
      });

      const functionCall = functionResponse.choices[0].message.function_call;
      
      if (functionCall) {
        const functionArgs = JSON.parse(functionCall.arguments);
        
        if (functionCall.name === "checkCalendar" && functionArgs.isCalendarQuery) {
          console.log('Calendar function called with args:', functionArgs);
          const events = await CalendarService.getEvents(functionArgs.timeframe);
          console.log('Calendar events response:', events);

          // Create a more explicit calendar context message
          let calendarContext = 'You have access to the following calendar information:\n\n';
          
          if (typeof events === 'string') {
            calendarContext += events;
          } else if (Array.isArray(events)) {
            if (events.length === 0) {
              calendarContext += `The user has no events scheduled for ${functionArgs.timeframe}.`;
            } else {
              calendarContext += `The user has ${events.length} event(s) scheduled for ${functionArgs.timeframe}:\n\n` + 
                events.map((event, index) => 
                  `Event ${index + 1}:\n` +
                  `- Title: ${event.title}\n` +
                  `- Date: ${event.date}\n` +
                  `- Time: ${event.startTime} - ${event.endTime}\n` +
                  `- Location: ${event.location}`
                ).join('\n\n');
            }
          }

          // Include all previous messages plus the calendar context
          const messagesForModel = [
            ...messages, // Include previous conversation history
            {
              role: 'system',
              content: calendarContext
            },
            {
              role: 'user',
              content: userMessage
            }
          ];
          
          console.log('Sending to model:', {
            modelUsed: modelMap[currentModel] || 'gpt-3.5-turbo',
            messages: messagesForModel,
            calendarContext,
            originalQuery: userMessage
          });

          const completion = await openai.chat.completions.create({
            model: modelMap[currentModel] || 'gpt-3.5-turbo',
            messages: messagesForModel,
          });

          const aiMessage = completion.choices[0].message.content;
          
          // Store both the calendar context and the AI response? Or just the AI response?
          const updatedChatsWithAIResponse = updatedChatsWithUserMessage.map(chat => 
            chat.id === currentChatId 
              ? { 
                  ...chat, 
                  messages: [
                    ...chat.messages,
                    // { role: 'system', content: calendarContext }, // Store calendar context
                    { role: 'assistant', content: aiMessage }
                  ]
                }
              : chat
          );
          setChats(updatedChatsWithAIResponse);

          // Save the updated chat
          const updatedChat = updatedChatsWithAIResponse.find(chat => chat.id === currentChatId);
          await saveChat(updatedChat);
          return;
        } else if (functionCall.name === "generateDallEImage") {
          const functionArgs = JSON.parse(functionCall.arguments);
          
          if (functionArgs.shouldGenerateImage) {
            setIsGeneratingImage(true);
            try {
              console.log('Starting image generation...');
              const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: functionArgs.imagePrompt,
                n: 1,
                size: "1024x1024",
              });
              console.log('Image generation response received:', response);

              const imageUrl = response.data[0].url;
              console.log('Image URL:', imageUrl);

              const aiMessage = `<img src="${imageUrl}" alt="Generated Image" data-revised-prompt="${response.data[0].revised_prompt}" />`;
              console.log('AI Message:', aiMessage);

              // Add AI response with image to the chat
              const updatedChatsWithAIResponse = updatedChatsWithUserMessage.map(chat => 
                chat.id === currentChatId 
                  ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: aiMessage }] }
                  : chat
              );
              setChats(updatedChatsWithAIResponse);
              
              // Save the updated chat
              const updatedChat = updatedChatsWithAIResponse.find(chat => chat.id === currentChatId);
              await saveChat(updatedChat);
              
            } catch (error) {
              console.error('Image generation error:', error);
            } finally {
              setIsGeneratingImage(false);
            }
          } else {
            const apiModel = modelMap[currentModel] || 'gpt-3.5-turbo';
            const isGrok = currentModel.toLowerCase().includes('grok');
            
            const activeApiKey = useBuiltInKey ? OPENAI_API_KEY : (isGrok ? grokApiKey : apiKey);
            
            if (!activeApiKey) {
              throw new Error('No API key available. Please set an API key in the settings.');
            }

            let completion;
            
            if (isGrok) {
              const grokOpenAI = new OpenAI({
                apiKey: grokApiKey,
                baseURL: "https://api.x.ai/v1",
                ...(ALLOW_BROWSER && { dangerouslyAllowBrowser: true })
              });

              completion = await grokOpenAI.chat.completions.create({
                model: "grok-beta",
                messages: messages
              });
            } else {
              const openai = new OpenAI({
                apiKey: activeApiKey,
                baseURL: "https://api.openai.com/v1",
                ...(ALLOW_BROWSER && { dangerouslyAllowBrowser: true })
              });

              completion = await openai.chat.completions.create({
                model: apiModel,
                messages: messages,
              });
            }

            console.log('API Response:', completion);

            if (!completion || !completion.choices || !completion.choices[0]) {
              throw new Error('Invalid response from API');
            }

            const aiMessage = completion.choices[0].message.content;
            console.log('AI Message:', aiMessage);

            // Add AI response to the chat
            const updatedChatsWithAIResponse = updatedChatsWithUserMessage.map(chat => 
              chat.id === currentChatId 
                ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: aiMessage }] }
                : chat
            );
            setChats(updatedChatsWithAIResponse);

            // Save the updated chat
            const updatedChat = updatedChatsWithAIResponse.find(chat => chat.id === currentChatId);
            await saveChat(updatedChat);
          }
        } else if (functionCall.name === "checkReminders" && functionArgs.isReminderQuery) {
          console.log('Reminder function called with args:', functionArgs);
          const reminders = await ReminderService.getReminders(functionArgs.timeframe, functionArgs.listType);
          console.log('Raw reminder response:', reminders);
          console.log('Reminder response type:', typeof reminders);
          if (Array.isArray(reminders)) {
            console.log('Number of reminders:', reminders.length);
            console.log('First reminder sample:', reminders[0]);
          }

          let reminderContext = 'You have access to the following reminder information:\n\n';
          
          if (typeof reminders === 'string') {
            reminderContext += reminders;
          } else if (Array.isArray(reminders)) {
            if (reminders.length === 0) {
              reminderContext += `The user has no reminders set for ${functionArgs.timeframe}.`;
            } else {
              reminderContext += `The user has ${reminders.length} reminder(s) for ${functionArgs.timeframe}:\n\n` + 
                reminders.map((reminder, index) => 
                  `Reminder ${index + 1}:\n` +
                  `- Title: ${reminder.title}\n` +
                  `- Due: ${reminder.dueDate}\n` +
                  `- Notes: ${reminder.notes}\n` +
                  `- Status: ${reminder.completed ? 'Completed' : 'Pending'}`
                ).join('\n\n');
            }
          }

          const messagesForModel = [
            ...messages,
            {
              role: 'system',
              content: reminderContext
            },
            {
              role: 'user',
              content: userMessage
            }
          ];

          const completion = await openai.chat.completions.create({
            model: modelMap[currentModel] || 'gpt-3.5-turbo',
            messages: messagesForModel,
          });

          const aiMessage = completion.choices[0].message.content;
          console.log('AI Message with reminder context:', aiMessage);

          const updatedChatsWithAIResponse = updatedChatsWithUserMessage.map(chat => 
            chat.id === currentChatId 
              ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: aiMessage }] }
              : chat
          );
          setChats(updatedChatsWithAIResponse);
        } else if (functionCall.name === "createCalendarEvent" && functionArgs.shouldCreateEvent) {
          console.log('Creating calendar event with args:', {
            ...functionArgs,
            currentDateTime: now.toISOString(),
            userTimezone,
            parsedStartDate: new Date(functionArgs.startDate).toLocaleString(),
            parsedEndDate: new Date(functionArgs.endDate).toLocaleString()
          });
          
          // Ensure dates are in the correct timezone
          const startDate = new Date(functionArgs.startDate);
          const endDate = new Date(functionArgs.endDate);
          
          // Validate that the dates make sense
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          if (startDate < now) {
            console.warn('Start date is in the past, adjusting to tomorrow:', {
              original: startDate,
              adjusted: tomorrow
            });
            startDate.setDate(tomorrow.getDate());
            startDate.setMonth(tomorrow.getMonth());
            startDate.setFullYear(tomorrow.getFullYear());
            
            // Adjust end date to maintain duration
            const duration = endDate - startDate;
            endDate.setTime(startDate.getTime() + duration);
          }
          
          const eventDetails = {
            ...functionArgs,
            startDate,
            endDate
          };
          
          const result = await CalendarService.createEvent(eventDetails);
          
          let responseMessage;
          if (result.success) {
            responseMessage = `✅ Event created successfully!\n\n📅 ${functionArgs.title}\n⏰ ${new Date(functionArgs.startDate).toLocaleString()} - ${new Date(functionArgs.endDate).toLocaleString()}\n${functionArgs.location ? `📍 ${functionArgs.location}` : ''}`;
          } else {
            responseMessage = `❌ ${result.message}`;
          }

          const updatedChatsWithResponse = updatedChatsWithUserMessage.map(chat => 
            chat.id === currentChatId 
              ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: responseMessage }] }
              : chat
          );
          setChats(updatedChatsWithResponse);
          
          const updatedChat = updatedChatsWithResponse.find(chat => chat.id === currentChatId);
          await saveChat(updatedChat);
          return;
        } else if (functionCall.name === "checkPreviousReference" && functionArgs.isPreviousReference) {
          const recentMessages = messages.slice(-3); // Get last 3 messages
          const previousAIResponse = recentMessages.reverse().find(m => m.role === 'assistant');
          
          if (!previousAIResponse) {
            const noContextResponse = "I don't see a previous response to refer to. Could you please be more specific?";
            const updatedChatsWithAIResponse = updatedChatsWithUserMessage.map(chat => 
              chat.id === currentChatId 
                ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: noContextResponse }] }
                : chat
            );
            setChats(updatedChatsWithAIResponse);
            return;
          }

          // If it's an image reference, modify the request accordingly
          if (functionArgs.referenceType === 'image' && previousAIResponse.content.includes('<img')) {
            const imagePromptMatch = previousAIResponse.content.match(/data-revised-prompt="([^"]+)"/);
            if (imagePromptMatch) {
              const previousPrompt = imagePromptMatch[1];
              // Create a new message array with the context
              const messagesWithContext = [
                ...messages,
                {
                  role: 'system',
                  content: `Previous image prompt: "${previousPrompt}". User is referring to this image.`
                }
              ];
              
              // Send a new request with the context
              const completion = await openai.chat.completions.create({
                model: modelToUse,
                messages: messagesWithContext,
                functions: [...openAIImageGenerationFunctions],
                function_call: "auto"
              });
              
              // Continue with normal processing of the completion
              return handleFunctionResponse(completion);
            }
          }

          // For text references
          if (functionArgs.referenceType === 'text' || functionArgs.referenceType === 'both') {
            const messagesWithContext = [
              ...messages,
              {
                role: 'system',
                content: `Previous assistant response: "${previousAIResponse.content}". User is referring to this response.`
              }
            ];
            
            const completion = await openai.chat.completions.create({
              model: modelToUse,
              messages: messagesWithContext
            });

            const aiMessage = completion.choices[0].message.content;
            const updatedChatsWithAIResponse = updatedChatsWithUserMessage.map(chat => 
              chat.id === currentChatId 
                ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: aiMessage }] }
                : chat
            );
            setChats(updatedChatsWithAIResponse);
            return;
          }
        }
      } else {
        const apiModel = modelMap[currentModel] || 'gpt-3.5-turbo';
        const isGrok = currentModel.toLowerCase().includes('grok');
        
        const activeApiKey = useBuiltInKey ? OPENAI_API_KEY : (isGrok ? grokApiKey : apiKey);
        
        if (!activeApiKey) {
          throw new Error('No API key available. Please set an API key in the settings.');
        }

        console.log('Chat request details:', {
          currentModel,
          apiModel,
          isGrok,
          modelMap,
          baseURL: isGrok ? "https://api.x.ai/v1" : "https://api.openai.com/v1"
        });

        console.log('API Configuration:', {
          isUsingBuiltInKey: useBuiltInKey,
          isGrokKeyPresent: !!grokApiKey,
          isApiKeyPresent: !!apiKey,
          selectedModel: isGrok ? "grok-beta" : apiModel
        });

        const openai = new OpenAI({
          apiKey: activeApiKey,
          baseURL: isGrok ? "https://api.x.ai/v1" : "https://api.openai.com/v1",
          ...(ALLOW_BROWSER && { dangerouslyAllowBrowser: true })
        });

        console.log('Sending chat completion request:', {
          model: isGrok ? "grok-beta" : apiModel,
          messageCount: messages.length,
          firstMessageContent: messages[0]?.content
        });

        const completion = await openai.chat.completions.create({
          model: isGrok ? "grok-beta" : apiModel,
          messages: messages,
        });

        console.log('API Response:', completion);

        if (!completion || !completion.choices || !completion.choices[0]) {
          throw new Error('Invalid response from API');
        }

        const aiMessage = completion.choices[0].message.content;
        console.log('AI Message:', aiMessage);

        // Add AI response to the chat
        const updatedChatsWithAIResponse = updatedChatsWithUserMessage.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: aiMessage }] }
            : chat
        );
        setChats(updatedChatsWithAIResponse);

        // Save the updated chat
        const updatedChat = updatedChatsWithAIResponse.find(chat => chat.id === currentChatId);
        await saveChat(updatedChat);
      }
    } catch (error) {
      console.error('Error sending message to OpenAI:', error);
      console.error('Error response:', error.response);
      console.error('Error configuration:', {
        currentModel,
        isGrok: currentModel.toLowerCase().includes('grok'),
        baseURL: currentModel.toLowerCase().includes('grok') ? "https://api.x.ai/v1" : "https://api.openai.com/v1",
        modelUsed: currentModel.toLowerCase().includes('grok') ? "grok-beta" : modelMap[currentModel]
      });
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Invalid API key. Please check your API key in the settings or enable the built-in key.';
      } else if (error.message.includes('No API key available')) {
        errorMessage = error.message;
      }

      // Add error message to the chat
      const updatedChatsWithError = updatedChatsWithUserMessage.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: errorMessage }] }
          : chat
      );
      setChats(updatedChatsWithError);
      await saveChat(updatedChatsWithError.find(chat => chat.id === currentChatId));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableModels = async () => {
    try {
      console.log('Fetching available models with configuration:', {
        useBuiltInKey,
        hasGrokKey: !!grokApiKey,
        hasApiKey: !!apiKey
      });

      // Base models that should always be included
      const baseModels = [
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5'
        }
      ];

      // Add Grok if API key is present
      if (grokApiKey) {
        baseModels.push({
          id: 'grok-beta',
          name: 'Grok'
        });
      }

      // If no API keys are available, just use base models
      if (!apiKey && !useBuiltInKey) {
        console.log('No API keys available, using base models only');
        setAvailableModels(baseModels);
        const newModelMap = Object.fromEntries(baseModels.map(model => [model.name, model.id]));
        setModelMap(newModelMap);
        return;
      }

      const activeApiKey = useBuiltInKey ? OPENAI_API_KEY : apiKey;

      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${activeApiKey}`,
        },
      });

      const models = response.data.data
        .filter(model => model.id.startsWith('gpt-'))
        .map(model => ({
          id: model.id,
          name: model.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        }));

      // Combine base models with fetched models
      const uniqueModels = [...baseModels, ...models.filter(model => 
        !baseModels.some(dm => dm.id === model.id)
      )];
      
      setAvailableModels(uniqueModels);
      
      // Create modelMap dynamically
      const newModelMap = Object.fromEntries(uniqueModels.map(model => [model.name, model.id]));
      setModelMap(newModelMap);
    } catch (error) {
      console.error('Error fetching available models:', error);
      // Set default models if fetch fails
      const defaultModels = grokApiKey ? [
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5'
        },
        {
          id: 'grok-beta',
          name: 'Grok'
        }
      ] : [
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5'
        }
      ];
      setAvailableModels(defaultModels);
      const newModelMap = Object.fromEntries(defaultModels.map(model => [model.name, model.id]));
      setModelMap(newModelMap);
    }
  };

  const deleteChat = async (chatId) => {
    if (Platform.OS === 'web') {
      // Web deletion implementation
      const chats = await AsyncStorage.getItem('chats') || '[]';
      const parsedChats = JSON.parse(chats);
      const updatedChats = parsedChats.filter(chat => chat.id !== chatId);
      await AsyncStorage.setItem('chats', JSON.stringify(updatedChats));
    } else {
      // Native deletion implementation
      const fileName = `${chatId}.md`;
      const filePath = chatDirectory + fileName;
      await FileSystem.deleteAsync(filePath);
    }
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    
    if (chatId === currentChatId) {
      // Just clear the current chat ID
      setCurrentChatId(null);
    }
  };

  useEffect(() => {
    fetchAvailableModels();
  }, [apiKey, useBuiltInKey, grokApiKey]);

  const loadDefaultModel = async () => {
    try {
      const savedDefaultModel = await AsyncStorage.getItem('default_model');
      if (savedDefaultModel) {
        setDefaultModel(savedDefaultModel);
        setCurrentModel(savedDefaultModel);
      }
    } catch (error) {
      console.error('Error loading default model:', error);
      setDefaultModel('GPT-3.5');
      setCurrentModel('GPT-3.5');
    }
  };

  const saveDefaultModel = async (model) => {
    try {
      // If the new default model is currently hidden, unhide it
      if (hiddenModels.includes(model)) {
        const newHiddenModels = hiddenModels.filter(m => m !== model);
        await AsyncStorage.setItem('hidden_models', JSON.stringify(newHiddenModels));
        setHiddenModels(newHiddenModels);
      }

      await AsyncStorage.setItem('default_model', model);
      setDefaultModel(model);
      setCurrentModel(model);
    } catch (error) {
      console.error('Error saving default model:', error);
    }
  };

  const loadHiddenModels = async () => {
    try {
      const savedHiddenModels = await AsyncStorage.getItem('hidden_models');
      if (savedHiddenModels) {
        setHiddenModels(JSON.parse(savedHiddenModels));
      }
    } catch (error) {
      console.error('Error loading hidden models:', error);
    }
  };

  const toggleModelVisibility = async (modelName) => {
    try {
      if (modelName === defaultModel) {
        return; // Can't hide default model
      }
      
      const newHiddenModels = hiddenModels.includes(modelName)
        ? hiddenModels.filter(m => m !== modelName)
        : [...hiddenModels, modelName];
      
      await AsyncStorage.setItem('hidden_models', JSON.stringify(newHiddenModels));
      setHiddenModels(newHiddenModels);
    } catch (error) {
      console.error('Error toggling model visibility:', error);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      chats, 
      currentChatId, 
      currentModel,
      setCurrentModel: changeModel,
      createNewChat, 
      addMessage, 
      sendMessageToOpenAI, 
      setCurrentChatId,
      availableModels,
      modelMap,
      deleteChat,
      apiKey,
      setApiKey,
      useBuiltInKey,
      setUseBuiltInKey,
      builtInKeyCode,
      grokApiKey,
      setGrokApiKey,
      useGrokKey,
      setUseGrokKey,
      isGeneratingImage,
      isLoading,
      defaultModel,
      saveDefaultModel,
      hiddenModels,
      toggleModelVisibility,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);

const handleGrokRequest = async (messages, grokApiKey) => {
  const openai = new OpenAI({
    apiKey: grokApiKey,
    baseURL: "https://api.x.ai/v1"
  });

  const completion = await openai.chat.completions.create({
    model: "grok-beta",
    messages: messages
  });

  return completion;
};
