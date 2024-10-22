import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
import { OPENAI_API_KEY } from '@env';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const addMessage = (role, content) => {
    setMessages((prevMessages) => [...prevMessages, { role, content }]);
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
            ...messages,
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
    <ChatContext.Provider value={{ messages, addMessage, sendMessageToOpenAI }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
