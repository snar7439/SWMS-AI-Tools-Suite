'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MessageCircle, Loader2, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AskSWMSChatbot() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const authData = sessionStorage.getItem('swms-auth');
    if (!authData) {
      router.push('/login');
      return;
    }

    try {
      const authInfo = JSON.parse(authData);
      if (!authInfo.authenticated) {
        router.push('/login');
        return;
      }
      setCurrentUser(authInfo.username);
    } catch (error) {
      console.error('Error parsing auth data:', error);
      router.push('/login');
      return;
    }
    
    setLoading(false);
  }, [router]);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm ASK SWMS, your intelligent assistant for SWMS related queries and operations. How can I help you today?",
      timestamp: null,
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize timestamp on client side to avoid hydration mismatch
  useEffect(() => {
    if (!isInitialized) {
      setMessages(prev => prev.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || new Date().toLocaleTimeString()
      })));
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    sessionStorage.removeItem('swms-auth');
    router.push('/login');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Dummy fetch request - replace with your actual backend endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputValue }),
      });

      // Simulate API delay for demo
      await new Promise(resolve => setTimeout(resolve, 1500));

      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: `Thank you for your message. I'm processing your request and will provide a detailed response shortly. This is a demo response from ASK SWMS.`,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const quickActions = [
    "What is SWMS?",
    "Help me with documentation",
    "Show me examples",
    "Contact support"
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading ASK SWMS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Dashboard button */}
            <button 
              onClick={() => router.push('/dashboard')}                 
              className="flex items-center space-x-1 text-blue-600 hover:text-purple-600 transition-colors cursor-pointer"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              <span className="font-medium">Back to Tools</span>
            </button>

            {/* Center - Logo and name */}
            <div className="flex items-center gap-4 group">
              <div className="relative">
                {/* Main logo container with enhanced styling */}
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <Bot className="w-7 h-7 text-white drop-shadow-sm" />
                  </div>
                </div>
                
                {/* Animated status indicator */}
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-3 border-white shadow-lg">
                  <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                </div>
                
                {/* Subtle glow effect */}
                <div className="absolute inset-0 w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-400 rounded-2xl opacity-20 blur-xl animate-pulse"></div>
              </div>
              
              <div className="flex flex-col">
                {/* Enhanced logo text */}
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent tracking-tight">
                    ASK
                  </h1>
                  <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent tracking-tight">
                    SWMS
                  </h1>
                </div>
                
                {/* Enhanced subtitle */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
                      AI-Powered Assistant
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>


            {/* Right side - User info and logout */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-blue-700 font-medium">{currentUser || 'User'}</span>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-purple-100 hover:text-blue-700 transition-all duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col mx-auto w-full px-4 py-4 min-h-0">
        {/* Messages Area */}
        <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-t-2xl shadow-xl border border-white/20 border-b-0 flex flex-col overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'bot' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-50 text-gray-900 border border-gray-400'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    {message.timestamp && (
                      <span className={`text-xs ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp}
                      </span>
                    )}
                    {!message.timestamp && <div></div>}
                    {message.type === 'bot' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyMessage(message.content)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3 text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <ThumbsUp className="w-3 h-3 text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <ThumbsDown className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/80 rounded-2xl px-4 py-3 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">ASK SWMS is typing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="px-6 py-4 border-t border-gray-200/50 flex-shrink-0">
              <p className="text-sm text-gray-600 mb-3">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(action)}
                    className="px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-blue-700 rounded-full text-sm border border-blue-200 hover:border-blue-300 transition-all duration-200"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Input Area */}
        <div className="bg-white/60 backdrop-blur-sm rounded-b-2xl shadow-xl border border-white/20 border-t-0 p-6 flex-shrink-0">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type your message here..."
                className="w-full px-4 py-3 border border-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[50px] max-h-[150px] bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500"
                rows="1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          {/* <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p> */}
        </div>
      </div>
    </div>
  );
}