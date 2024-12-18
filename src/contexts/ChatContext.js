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
import moment from 'moment-timezone';
import { 
  openAIImageGenerationFunctions,
  calendarFunctions,
  reminderFunctions,
  previousResponseFunction,
  memoryFunctions 
} from '../functions/openAIFunctions';

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
  const [timezone, setTimezone] = useState(moment.tz.guess());
  const [savedChatIds, setSavedChatIds] = useState(new Set());

  const MEMORIES_FILE = FileSystem.documentDirectory + 'memories.json';

  useEffect(() => {
    const loadTimezone = async () => {
      const savedTimezone = await AsyncStorage.getItem('selectedTimezone');
      if (savedTimezone) {
        setTimezone(savedTimezone);
      }
    };
    loadTimezone();
  }, []);

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
      
      // Get today's date string in YYYY-MM-DD format
      const today = moment().tz(timezone).format('YYYY-MM-DD');
      
      if (loadedChats.length > 0) {
        setChats(loadedChats);
        // Check if there's a chat for today
        const todayChat = loadedChats.find(chat => chat.id === today);
        if (todayChat) {
          setCurrentChatId(today);
        } else {
          // Create new chat for today but don't add to chats yet
          const { id } = createNewChat();
          setCurrentChatId(id);
        }
      } else {
        // Just create the ID for today and set it
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
    console.log('💾 Save Flow: Starting save operation', {
      platform: Platform.OS,
      chatId: chat.id,
      messageCount: chat.messages.length,
      lastMessage: chat.messages[chat.messages.length - 1]?.content.slice(0, 50) + '...'
    });
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
      // Add the chat ID to savedChatIds
      setSavedChatIds(prev => new Set(prev).add(chat.id));
    } catch (e) {
      console.error('Error saving chat', e);
    }
  };

  const loadChats = async () => {
    try {
      let loadedChats;
      if (Platform.OS === 'web') {
        // Web loading implementation
        const chats = await AsyncStorage.getItem('chats');
        loadedChats = chats ? JSON.parse(chats) : [];
      } else {
        // Native loading implementation
        const files = await FileSystem.readDirectoryAsync(chatDirectory);
        loadedChats = await Promise.all(
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
      }
      // Initialize savedChatIds with loaded chat IDs
      setSavedChatIds(new Set(loadedChats.map(chat => chat.id)));
      // Sort chats by date in descending order
      return loadedChats.sort((a, b) => b.id.localeCompare(a.id));
    } catch (e) {
      console.error('Error loading chats', e);
      return [];
    }
  };

  const createNewChat = (date = new Date()) => {
    const momentDate = moment(date).tz(timezone);
    const dateStr = momentDate.format('YYYY-MM-DD');
    const existingChat = chats.find(chat => chat.id === dateStr);
    
    if (existingChat) {
      setCurrentChatId(dateStr);
      return existingChat;
    }

    const newChat = {
      id: dateStr,
      title: momentDate.format('LL'),
      messages: [],
      model: defaultModel,
      date: momentDate.toISOString()
    };
    
    // Add the new chat to the chats array
    setChats(prevChats => {
      const updatedChats = [...prevChats, newChat];
      return updatedChats.sort((a, b) => b.id.localeCompare(a.id));
    });
    
    setCurrentChatId(dateStr);
    return newChat;
  };

  const getChatByDate = (date) => {
    const dateStr = moment(date).tz(timezone).format('YYYY-MM-DD');
    return chats.find(chat => chat.id === dateStr);
  };

  const addMessage = async (role, content) => {
    const dateStr = currentChatId;
    const existingChat = chats.find(chat => chat.id === dateStr);
    
    let updatedChats;
    if (!existingChat) {
      // This is the first message for this date
      const newChat = {
        id: dateStr,
        title: new Date(dateStr).toLocaleDateString(),
        messages: [{ role, content }],
        model: defaultModel,
        date: new Date(dateStr).toISOString()
      };
      updatedChats = [...chats, newChat];
    } else {
      updatedChats = chats.map(chat => 
        chat.id === dateStr 
          ? { ...chat, messages: [...chat.messages, { role, content }] }
          : chat
      );
    }
    
    // Sort chats by date in descending order
    const sortedChats = updatedChats.sort((a, b) => b.id.localeCompare(a.id));
    setChats(sortedChats);
    const updatedChat = sortedChats.find(chat => chat.id === dateStr);
    await saveChat(updatedChat);
  };

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

  const saveMemory = async (memoryContent) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(MEMORIES_FILE);
      let memories = [];
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(MEMORIES_FILE);
        memories = JSON.parse(content);
      }
      const newMemory = {
        content: memoryContent,
        timestamp: new Date().toISOString()
      };
      memories.push(newMemory);
      await FileSystem.writeAsStringAsync(MEMORIES_FILE, JSON.stringify(memories));
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  };

  const sendMessageToOpenAI = async (userMessage) => {
    console.log('🚀 Message Flow: Starting message processing', {
      userMessage,
      currentChatId,
      chatCount: chats.length,
      currentModel
    });
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

      console.log('🚀 Message Flow: Chat updated with user message', {
        chatExists,
        messageCount: updatedChatsWithUserMessage.find(c => c.id === currentChatId)?.messages.length
      });

      console.log('--------- USER MESSAGE START ---------');
      console.log(userMessage);
      console.log('--------- USER MESSAGE END ---------');
    
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

      console.log('🚀 Message Flow: Checking for special functions', {
        contextMessage,
        modelToUse,
        availableFunctions: [
          ...previousResponseFunction.map(f => f.name),
          ...openAIImageGenerationFunctions.map(f => f.name),
          ...calendarFunctions.map(f => f.name),
          ...reminderFunctions.map(f => f.name),
          ...memoryFunctions.map(f => f.name)
        ]
      });

      const functionResponse = await openai.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: "system",
            content: `${contextMessage}\n\nPrevious messages for context:\n${messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}\n\nYou can:\n1. Save new memories using the 'saveMemory' function\n2. Check existing memories using the 'checkMemories' function\n\nBefore responding, consider if the user's message might benefit from checking saved memories for context.`
          },
          { 
            role: "user", 
            content: userMessage 
          }
        ],
        functions: [...previousResponseFunction, ...openAIImageGenerationFunctions, ...calendarFunctions, ...reminderFunctions, ...memoryFunctions],
        function_call: "auto"
      });

      const functionCall = functionResponse.choices[0].message.function_call;
      
      if (functionCall) {
        let functionArgs;
        try {
          functionArgs = JSON.parse(functionCall.arguments);
          console.log('🚀 Message Flow: Function detected', {
            functionName: functionCall.name,
            args: functionArgs,
            isCalendarQuery: functionCall.name === "checkCalendar" && functionArgs?.isCalendarQuery,
            isImageGeneration: functionCall.name === "generateDallEImage" && functionArgs?.shouldGenerateImage,
            isReminderQuery: functionCall.name === "checkReminders" && functionArgs?.isReminderQuery,
            isSaveMemory: functionCall.name === "saveMemory"
          });
        } catch (parseError) {
          console.log('❌ Message Flow: Error parsing function arguments', {
            functionName: functionCall.name,
            rawArgs: functionCall.arguments,
            error: parseError.message
          });
          throw parseError;
        }

        if (functionCall.name === "saveMemory") {
          const { memoryContent } = functionArgs;
          await saveMemory(memoryContent);
          const memorySavedMessage = { role: 'system', content: '💾 Memory Saved' };
          const updatedChatsWithMemoryMessage = updatedChatsWithUserMessage.map(chat => 
            chat.id === currentChatId 
              ? { 
                  ...chat, 
                  messages: [...chat.messages, memorySavedMessage] 
                }
              : chat
          );
          setChats(updatedChatsWithMemoryMessage);
          const updatedChat = updatedChatsWithMemoryMessage.find(chat => chat.id === currentChatId);
          await saveChat(updatedChat);
          return;
        }

        // Add more detailed logging for calendar queries
        if (functionCall.name === "checkCalendar") {
          console.log('📅 Calendar Flow:', {
            args: functionArgs,
            timeframe: functionArgs?.timeframe,
            isQuery: functionArgs?.isCalendarQuery
          });
        }

        // Add more detailed logging for image generation
        if (functionCall.name === "generateDallEImage") {
          console.log('🎨 Image Generation Flow:', {
            args: functionArgs,
            shouldGenerate: functionArgs?.shouldGenerateImage,
            prompt: functionArgs?.imagePrompt
          });
        }

        // Add more detailed logging for reminder queries
        if (functionCall.name === "checkReminders") {
          console.log('📝 Reminder Flow:', {
            args: functionArgs,
            timeframe: functionArgs?.timeframe,
            isQuery: functionArgs?.isReminderQuery,
            listType: functionArgs?.listType
          });
        }

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

            console.log('--------- API RESPONSE FROM DALL-E 3 START ---------');
            console.log(completion);
            console.log('--------- API RESPONSE FROM DALL-E 3 END ---------');

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
          
          if (!functionArgs.isAllDay && startDate < now) {
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
            if (functionArgs.isAllDay) {
                responseMessage = `✅ Event created successfully!\n\n📅 ${functionArgs.title}\n📆 All day event on ${new Date(functionArgs.startDate).toLocaleDateString()}\n${functionArgs.location ? `📍 ${functionArgs.location}` : ''}`;
            } else {
                responseMessage = `✅ Event created successfully!\n\n📅 ${functionArgs.title}\n⏰ ${new Date(functionArgs.startDate).toLocaleString()} - ${new Date(functionArgs.endDate).toLocaleString()}\n${functionArgs.location ? `📍 ${functionArgs.location}` : ''}`;
            }
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
        } else if (functionCall.name === "listCalendars" && functionArgs.shouldListCalendars) {
            console.log('Listing calendars');
            const calendars = await CalendarService.getCalendars();
            
            let responseMessage;
            if (calendars.error) {
                responseMessage = calendars.error;
            } else {
                responseMessage = "Here are your available calendars:\n\n";
                calendars.forEach(calendar => {
                    const status = calendar.isVisible ? '✅' : '❌';
                    responseMessage += `${status} ${calendar.title}\n`;
                    if (calendar.isPrimary) {
                        responseMessage += "   📌 Primary Calendar\n";
                    }
                    responseMessage += `   📱 Source: ${calendar.source}\n\n`;
                });
                responseMessage += "\nYou can enable/disable calendars in Settings → Calendar Settings → Select Calendars";
            }

            const updatedChatsWithResponse = updatedChatsWithUserMessage.map(chat => 
                chat.id === currentChatId 
                    ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: responseMessage }] }
                    : chat
            );
            setChats(updatedChatsWithResponse);
            
            const updatedChat = updatedChatsWithResponse.find(chat => chat.id === currentChatId);
            await saveChat(updatedChat);
        } else if (functionCall.name === "setDefaultCalendar" && functionArgs.shouldSetDefault) {
          console.log('Setting default calendar:', functionArgs.calendarName);
          const result = await CalendarService.setDefaultCalendar(functionArgs.calendarName);
          
          const responseMessage = result.success
            ? `✅ ${result.message}`
            : `❌ ${result.message}`;

          const updatedChatsWithResponse = updatedChatsWithUserMessage.map(chat => 
            chat.id === currentChatId 
              ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: responseMessage }] }
              : chat
          );
          setChats(updatedChatsWithResponse);
          
          const updatedChat = updatedChatsWithResponse.find(chat => chat.id === currentChatId);
          await saveChat(updatedChat);
          setIsLoading(false);
          return;
        } else if (functionCall.name === "saveMemory") {
          const { memoryContent } = functionArgs;
          await saveMemory(memoryContent);
          const memorySavedMessage = { role: 'system', content: '💾 Memory Saved' };
          const updatedChatsWithMemoryMessage = updatedChatsWithUserMessage.map(chat => 
            chat.id === currentChatId 
              ? { 
                  ...chat, 
                  messages: [...chat.messages, memorySavedMessage] 
                }
              : chat
          );
          setChats(updatedChatsWithMemoryMessage);
          const updatedChat = updatedChatsWithMemoryMessage.find(chat => chat.id === currentChatId);
          await saveChat(updatedChat);
          return;
        } else if (functionCall.name === "checkMemories") {
          const { shouldCheckMemories, searchTerms } = functionArgs;
          
          if (shouldCheckMemories) {
            // Add system message for memory access
            const memoryAccessMessage = { role: 'system', content: '🧠 Accessing Memories' };
            const updatedChatsWithAccessMessage = updatedChatsWithUserMessage.map(chat => 
              chat.id === currentChatId 
                ? { ...chat, messages: [...chat.messages, memoryAccessMessage] }
                : chat
            );
            setChats(updatedChatsWithAccessMessage);
            
            const relevantMemories = await searchMemories(searchTerms);
            
            let memoryContext = '';
            if (relevantMemories.length > 0) {
              memoryContext = 'Related memories:\n' + 
                relevantMemories.map(memory => 
                  `[${new Date(memory.timestamp).toLocaleString()}] ${memory.content}`
                ).join('\n');
            }
            
            // Create a new completion with memory context
            const completionWithMemories = await openai.chat.completions.create({
              model: modelToUse,
              messages: [
                {
                  role: "system",
                  content: `${contextMessage}\n\n${memoryContext}`
                },
                ...messages.slice(-3), // Keep last 3 messages for context
                { 
                  role: "user", 
                  content: userMessage 
                }
              ]
            });

            const aiMessage = completionWithMemories.choices[0].message.content;
            
            // Update chat with AI response, keeping the memory access message
            const updatedChatsWithAIResponse = updatedChatsWithAccessMessage.map(chat => 
              chat.id === currentChatId 
                ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: aiMessage }] }
                : chat
            );
            setChats(updatedChatsWithAIResponse);
            
            // Save the updated chat
            const updatedChat = updatedChatsWithAIResponse.find(chat => chat.id === currentChatId);
            await saveChat(updatedChat);
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

        // console.log('Chat request details:', {
        //   currentModel,
        //   apiModel,
        //   isGrok,
        //   modelMap,
        //   baseURL: isGrok ? "https://api.x.ai/v1" : "https://api.openai.com/v1"
        // });

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

        console.log('--------- API CHAT COMPLETION RESPONSE START ---------');
        console.log(completion);
        console.log('--------- API CHAT COMPLETION RESPONSE END ---------');

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
      console.log('❌ Message Flow: Error occurred', {
        errorType: error.name,
        errorMessage: error.message,
        statusCode: error.response?.status,
        errorDetails: error.response?.data,
        currentModel,
        isGrok: currentModel.toLowerCase().includes('grok'),
        functionCall: functionCall ? {
          name: functionCall.name,
          hasArguments: !!functionCall.arguments
        } : 'No function call',
        state: {
          hasChats: chats.length > 0,
          currentChatId,
          modelToUse
        }
      });

      console.error('Error details:', {
        stack: error.stack,
        response: error.response,
        configuration: {
          currentModel,
          isGrok: currentModel.toLowerCase().includes('grok'),
          baseURL: currentModel.toLowerCase().includes('grok') ? "https://api.x.ai/v1" : "https://api.openai.com/v1",
          modelUsed: currentModel.toLowerCase().includes('grok') ? "grok-beta" : modelMap[currentModel]
        }
      });

      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Invalid API key. Please check your API key in the settings or enable the built-in key.';
      } else if (error.message.includes('No API key available')) {
        errorMessage = error.message;
      } else if (error.message.includes('Cannot read property')) {
        errorMessage = 'There was an error processing your request. Please try again.';
        console.log('💡 Debug Info: Property access error', {
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 3)
        });
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

  const isChatSaved = (chatId) => {
    return savedChatIds.has(chatId);
  };

  const deleteMemory = async (timestamp) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(MEMORIES_FILE);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(MEMORIES_FILE);
        const memories = JSON.parse(content);
        const updatedMemories = memories.filter(memory => memory.timestamp !== timestamp);
        await FileSystem.writeAsStringAsync(MEMORIES_FILE, JSON.stringify(updatedMemories));
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  const searchMemories = async (searchTerms) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(MEMORIES_FILE);
      if (!fileInfo.exists) {
        return [];
      }
      
      const content = await FileSystem.readAsStringAsync(MEMORIES_FILE);
      const memories = JSON.parse(content);
      
      // Convert search terms to lowercase for case-insensitive matching
      const lowercaseTerms = searchTerms.map(term => term.toLowerCase());
      
      // Filter memories that contain any of the search terms
      const relevantMemories = memories.filter(memory => 
        lowercaseTerms.some(term => 
          memory.content.toLowerCase().includes(term)
        )
      );
      
      // Sort by timestamp, most recent first
      return relevantMemories.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
    } catch (error) {
      console.error('Error searching memories:', error);
      return [];
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
      getChatByDate,
      isChatSaved,
      deleteMemory,
      searchMemories,
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
