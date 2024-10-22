import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { OPENAI_API_KEY } from '@env';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    }
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
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
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

      const aiMessage = response.data.choices[0].message.content;
      addMessage('assistant', aiMessage);
    } catch (error) {
      console.error('Error sending message to OpenAI:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    }
  };

  return (
    <ChatContext.Provider value={{ chats, currentChatId, createNewChat, addMessage, sendMessageToOpenAI, setCurrentChatId }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
