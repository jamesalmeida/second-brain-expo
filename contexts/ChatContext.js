import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { OPENAI_API_KEY } from '@env';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const changeModel = (newModel) => {
    console.log('Model changed to:', newModel); // Log the new model
    setCurrentModel(newModel);
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
        createNewChat();
      }
      fetchAvailableModels();
      loadApiKeySettings();
    };
    initializeChats();
  }, []);
  
  const loadApiKeySettings = async () => {
    try {
      const storedApiKey = await AsyncStorage.getItem('openai_api_key');
      const storedUseBuiltInKey = await AsyncStorage.getItem('use_built_in_key');
      if (storedApiKey !== null) {
        setApiKey(storedApiKey);
      }
      if (storedUseBuiltInKey !== null) {
        setUseBuiltInKey(JSON.parse(storedUseBuiltInKey));
      }
    } catch (error) {
      console.error('Error loading API key settings:', error);
    }
  };

  const ensureChatDirectoryExists = async () => {
    const dirInfo = await FileSystem.getInfoAsync(chatDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(chatDirectory, { intermediates: true });
    }
  };

  const saveChat = async (chat) => {
    try {
      const fileName = `${chat.id}.md`;
      const filePath = chatDirectory + fileName;
      
      let markdownContent = `# ${chat.title}\n\n`;
      chat.messages.forEach(message => {
        markdownContent += `## ${message.role}\n${message.content}\n\n`;
      });
      
      await FileSystem.writeAsStringAsync(filePath, markdownContent, { encoding: FileSystem.EncodingType.UTF8 });
      console.log('Chat saved successfully');
    } catch (e) {
      console.error('Error saving chat', e);
    }
  };

  const loadChats = async () => {
    try {
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
    } catch (e) {
      console.error('Error loading chats', e);
      return [];
    }
  };

  const createNewChat = async () => {
    const newChat = {
      id: Date.now().toString(),
      title: new Date().toLocaleString(),
      messages: []
    };
    await saveChat(newChat);
    setChats(prevChats => [...prevChats, newChat]);
    setCurrentChatId(newChat.id);
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

  const sendMessageToOpenAI = async (userMessage) => {
    // Add user message to the chat
    const updatedChatsWithUserMessage = chats.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: [...chat.messages, { role: 'user', content: userMessage }] }
        : chat
    );
    setChats(updatedChatsWithUserMessage);
  
    try {
      const apiModel = modelMap[currentModel] || 'gpt-3.5-turbo';

  
      const currentChat = updatedChatsWithUserMessage.find(chat => chat.id === currentChatId);
      const messages = [
        { role: 'system', content: 'You are a helpful assistant but you are also a bit sarcastic. Avoid pleasantries and be direct unless the situation calls for it.' },
        ...currentChat.messages,
      ];
  
      const activeApiKey = useBuiltInKey ? OPENAI_API_KEY : apiKey;
  
      if (!activeApiKey) {
        throw new Error('No API key available. Please set an API key in the settings or enable the built-in key.');
      }
  
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: apiModel,
          messages: messages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeApiKey}`,
          },
        }
      );

      console.log('Used model:', apiModel);
      console.log('OpenAI Response:', response.data);

      const aiMessage = response.data.choices[0].message.content;
      console.log('AI Response:', aiMessage);
      
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
    } catch (error) {
      console.error('Error sending message to OpenAI:', error);
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      if (error.response && error.response.status === 401) {
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
    }
  };

  const fetchAvailableModels = async () => {
    try {
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      });

      // Add default GPT-3.5 model
      const defaultModel = {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5'
      };

      const models = response.data.data
        .filter(model => model.id.startsWith('gpt-'))
        .map(model => ({
          id: model.id,
          name: model.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        }));

      // Ensure GPT-3.5 is in the list and at the top
      const uniqueModels = [defaultModel, ...models.filter(model => model.id !== 'gpt-3.5-turbo')];
      setAvailableModels(uniqueModels);
      
      // Create modelMap dynamically
      const newModelMap = Object.fromEntries(uniqueModels.map(model => [model.name, model.id]));
      setModelMap(newModelMap);

      // console.log('Available models:', uniqueModels);
      // console.log('Model map:', newModelMap);
    } catch (error) {
      console.error('Error fetching available models:', error);
    }
  };

  const deleteChat = async (chatId) => {
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    
    const fileName = `${chatId}.md`;
    const filePath = chatDirectory + fileName;
    await FileSystem.deleteAsync(filePath);

    if (chatId === currentChatId) {
      setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
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
      builtInKeyCode
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
