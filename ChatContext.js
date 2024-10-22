import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { OPENAI_API_KEY } from '@env';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentModel, setCurrentModel] = useState('GPT-3.5');
  const [availableModels, setAvailableModels] = useState([]);
  const [modelMap, setModelMap] = useState({});

  const changeModel = (newModel) => {
    console.log('Model inside ChatContext changed to:', newModel); // Log the new model
    setCurrentModel(newModel);
  };

  useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    }
    fetchAvailableModels();
  }, []);

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: new Date().toLocaleString(),
      messages: []
    };
    setChats(prevChats => [...prevChats, newChat]);
    setCurrentChatId(newChat.id);
  };

  const addMessage = (role, content) => {
    setChats(prevChats => prevChats.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: [...chat.messages, { role, content }] }
        : chat
    ));
  };

  const sendMessageToOpenAI = async (userMessage) => {
    addMessage('user', userMessage);

    try {
      // Use the currentModel directly from state
      const apiModel = modelMap[currentModel] || 'gpt-3.5-turbo';
      console.log('modelMap in ChatContext:', modelMap);
      console.log('Using model inside ChatContext:', apiModel);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: apiModel,
          messages: [
            { role: 'system', content: 'You are a helpful assistant but you are also a bit sarcastic. Avoid pleasantries and be direct unless the situation calls for it.' },
            ...chats.find(chat => chat.id === currentChatId).messages,
            { role: 'user', content: userMessage },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );

      console.log('OpenAI Response:', response.data);
      console.log('Used model:', apiModel);

      const aiMessage = response.data.choices[0].message.content;
      addMessage('assistant', aiMessage);
    } catch (error) {
      console.error('Error sending message to OpenAI:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    }
  };

  const fetchAvailableModels = async () => {
    try {
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      });
      const models = response.data.data
        .filter(model => model.id.startsWith('gpt-'))
        .map(model => ({
          id: model.id,
          name: model.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        }));
      setAvailableModels(models);
      
      // Create modelMap dynamically
      const newModelMap = Object.fromEntries(models.map(model => [model.name, model.id]));
      setModelMap(newModelMap);

      console.log('Available models:', models);
      console.log('Model map:', newModelMap); // Check the model map here
    } catch (error) {
      console.error('Error fetching available models:', error);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      chats, 
      currentChatId, 
      currentModel, // Provide currentModel from context
      setCurrentModel: changeModel, // Provide the changeModel function
      createNewChat, 
      addMessage, 
      sendMessageToOpenAI, 
      setCurrentChatId,
      availableModels,
      modelMap
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
