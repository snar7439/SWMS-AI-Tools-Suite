'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Send, Bot, User, Sparkles, MessageCircle, Loader2, Copy, ThumbsUp, ThumbsDown, Edit, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AskSWMSChatbot() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

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
      isComplete: true,
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const streamingIntervalRef = useRef(null);
  const userHasScrolled = useRef(false);
  const messagesContainerRef = useRef(null);
  const workerRef = useRef(null);

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
    // Only auto-scroll if user hasn't manually scrolled
    if (!userHasScrolled.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Track user scrolling
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      userHasScrolled.current = !isAtBottom;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup streaming interval on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  // Initialize web worker for background processing
  useEffect(() => {
    workerRef.current = new Worker('/worker.js');
    const worker = workerRef.current;

    worker.onmessage = (e) => {
      const { type, messageId, content, format } = e.data;

      if (type === 'progress') {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, content, format: format || msg.format || 'slack-markdown' }
              : msg
          )
        );
      }

      if (type === 'done') {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, isComplete: true, format: format || msg.format || 'slack-markdown' }
              : msg
          )
        );
        setStreamingMessageId(null);
        setIsLoading(false);
      }
    };

    return () => worker.terminate();
  }, []);

  // Performance-optimized typing function that works in background
  const typeMessage = (messageId, fullContent, onComplete) => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        messageId,
        content: fullContent,
        batchSize: 3,
        speed: 40
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Reset scroll tracking when sending new message
    userHasScrolled.current = false;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      isComplete: true,
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = inputValue;
    setInputValue('');
    setIsLoading(true);
    setIsThinking(true);

    try {
      // Use Promise with setTimeout that continues in background
      const thinkingPromise = new Promise(resolve => {
        setTimeout(() => {
          setIsThinking(false);
          resolve();
        }, 1000 + Math.random() * 1000);
      });
      
      await thinkingPromise;

      // Create bot message placeholder
      const botMessageId = Date.now() + 1;
      const botMessage = {
        id: botMessageId,
        type: 'bot',
        content: '',
        isComplete: false,
      };

      setMessages(prev => [...prev, botMessage]);
      setStreamingMessageId(botMessageId);

      // Call the proxy API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ai_agent_id: '6878e1f31ef4befdb53b22cf',
          user_query: userInput,
          configuration_environment: 'DEV',
        }),
      });

      let fullResponse = '';
      let format = 'text';
      if (response.ok) {
        const data = await response.json();
        fullResponse = data?.answer || data?.content || 'Sorry, I did not receive a valid response.';
        format = data?.format || 'text';
      } else {
        fullResponse = 'Sorry, I could not get a response from the backend.';
      }

      // Start typing animation - continues in background using setInterval
      typeMessage(botMessageId, fullResponse, () => {
        setMessages(prev => prev.map(msg =>
          msg.id === botMessageId ? { ...msg, format: format } : msg
        ));
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setIsThinking(false);
      
      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        isComplete: true,
      };
      setMessages(prev => [...prev, errorResponse]);
      setIsLoading(false);
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const startEditingMessage = (messageId, content) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const saveEditedMessage = async (messageId) => {
    if (!editingContent.trim()) return;

    // Reset scroll tracking when editing message
    userHasScrolled.current = false;

    // Update the user message
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: editingContent.trim() }
        : msg
    ));

    // Find the index of the edited message
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    
    // Remove all messages after the edited message (including bot responses)
    setMessages(prev => prev.slice(0, messageIndex + 1));

    // Reset editing state
    setEditingMessageId(null);
    setEditingContent('');

    // Generate new bot response for the edited message
    setIsLoading(true);
    setIsThinking(true);

    try {
      // Use Promise with setTimeout that continues in background
      const thinkingPromise = new Promise(resolve => {
        setTimeout(() => {
          setIsThinking(false);
          resolve();
        }, 1000 + Math.random() * 1000);
      });
      
      await thinkingPromise;

      // Create bot message placeholder
      const botMessageId = Date.now();
      const botMessage = {
        id: botMessageId,
        type: 'bot',
        content: '',
        isComplete: false,
      };

      setMessages(prev => [...prev, botMessage]);
      setStreamingMessageId(botMessageId);

      // Call the proxy API route for the edited message
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ai_agent_id: '6878e1f31ef4befdb53b22cf',
          user_query: editingContent.trim(),
          configuration_environment: 'DEV',
        }),
      });

      let fullResponse = '';
      let format = 'text';
      if (response.ok) {
        const data = await response.json();
        fullResponse = data?.answer || data?.content || 'Sorry, I did not receive a valid response.';
        format = data?.format || 'text';
      } else {
        fullResponse = 'Sorry, I could not get a response from the backend.';
      }

      // Start typing animation - continues in background using setInterval
      typeMessage(botMessageId, fullResponse, () => {
        setMessages(prev => prev.map(msg =>
          msg.id === botMessageId ? { ...msg, format: format } : msg
        ));
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error sending edited message:', error);
      setIsThinking(false);
      
      const errorResponse = {
        id: Date.now(),
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        isComplete: true,
      };
      setMessages(prev => [...prev, errorResponse]);
      setIsLoading(false);
    }
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
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
          {/* Messages Container - Now with scroll handling */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4" 
            onScroll={handleScroll}
            style={{ scrollBehavior: 'smooth' }}
          >
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
                  className={`max-w-[70%] rounded-2xl px-4 py-3 relative group ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-50 text-gray-900 border border-gray-400'
                  }`}
                >
                  {editingMessageId === message.id ? (
                    // Edit mode for user messages
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 text-sm"
                        rows="3"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            e.preventDefault();
                            saveEditedMessage(message.id);
                          }
                          if (e.key === 'Escape') {
                            cancelEditingMessage();
                          }
                        }}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={cancelEditingMessage}
                          className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          title="Cancel (Esc)"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEditedMessage(message.id)}
                          className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                          title="Save (Ctrl+Enter)"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal message display
                    <>
                      <div className="flex items-start gap-2">
                        <div className="text-sm leading-relaxed flex-1">
                          {message.type === 'bot' && message.format === 'slack-markdown' ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{message.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <span>
                              {message.content}
                              {message.type === 'bot' && !message.isComplete && (
                                <span className="inline-block w-0.5 h-4 bg-gray-500 animate-pulse ml-1 rounded-full"></span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hover actions for user messages */}
                      {message.type === 'user' && !isLoading && (
                        <div className="absolute -right-2 -top-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1">
                            <button
                              onClick={() => copyMessage(message.content)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Copy message"
                            >
                              <Copy className="w-3 h-3 text-gray-600" />
                            </button>
                            <button
                              onClick={() => startEditingMessage(message.id, message.content)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Edit message"
                            >
                              <Edit className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Bot message actions */}
                      {message.type === 'bot' && message.isComplete && (
                        <div className="flex items-center justify-end mt-2">
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
                        </div>
                      )}
                    </>
                  )}
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {/* Thinking State */}
            {isThinking && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/80 rounded-2xl px-4 py-3 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-600 font-medium">ASK SWMS is thinking...</span>
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
        </div>
      </div>
    </div>
  );
}