import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Send, AlertTriangle, Check, Clock,
  Search, Paperclip, Lock, Star, Award, User,
  Pin, CheckCheck, CheckCircle2, ShieldAlert
} from 'lucide-react';

const ChatTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [systemWarning, setSystemWarning] = useState('');

  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Fetch conversation list
  const fetchChats = async (search = searchQuery) => {
    try {
      const token = localStorage.getItem('token');
      const searchParam = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/get_conversations.php${searchParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.conversations)) {
        setChats(data.conversations);
        // If activeChat is open, update its stage/status if changed
        if (activeChat) {
          const updated = data.conversations.find(c => c.conversation_id === activeChat.conversation_id || c.job_ID === activeChat.job_ID);
          if (updated && updated.application_status !== activeChat.application_status) {
            setActiveChat(prev => ({ ...prev, application_status: updated.application_status }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (jobId, silent = false) => {
    if (!jobId) return;
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/get_messages.php?conversation_id=${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
        setError('');
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchChats();
  }, []);

  // Polling loop every 5 seconds
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(() => {
      fetchChats(searchQuery);
      if (activeChat) {
        fetchMessages(activeChat.conversation_id || activeChat.job_ID, true);
      }
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeChat, searchQuery]);

  // When activeChat changes
  useEffect(() => {
    if (activeChat) {
      const jobId = activeChat.conversation_id || activeChat.job_ID;
      fetchMessages(jobId);
    }
  }, [activeChat]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchChats(query);
  };

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    if (newMessage.length > 1000) {
      setError('Message cannot exceed 1000 characters.');
      return;
    }

    setSending(true);
    setSystemWarning('');
    setError('');

    const jobId = activeChat.conversation_id || activeChat.job_ID;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/send_message.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: jobId,
          receiver_id: activeChat.partner_user_ID,
          content: newMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages(jobId, true);
        fetchChats();
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Connection error. Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // Stage Lock Evaluation
  const appStatus = (activeChat?.application_status || '').toLowerCase();
  const isLocked = ['completed', 'review_submitted', 'terminated'].includes(appStatus);
  const isReviewSubmitted = appStatus === 'review_submitted';

  // Group chats into Ongoing (Active) vs Finished (Completed/Archived)
  const ongoingChats = chats.filter(chat => {
    const st = (chat.application_status || '').toLowerCase();
    return !['completed', 'review_submitted', 'terminated'].includes(st);
  });

  const finishedChats = chats.filter(chat => {
    const st = (chat.application_status || '').toLowerCase();
    return ['completed', 'review_submitted', 'terminated'].includes(st);
  });

  const renderChatItem = (chat) => {
    const isSelected = activeChat?.conversation_id === chat.conversation_id || activeChat?.job_ID === chat.job_ID;
    const statusStr = (chat.application_status || 'shortlisted').toLowerCase();
    const unreadCount = parseInt(chat.unread_count || 0);
    const isFinished = ['completed', 'review_submitted', 'terminated'].includes(statusStr);

    return (
      <button
        key={chat.conversation_id || chat.job_ID}
        onClick={() => { setActiveChat(chat); setError(''); setSystemWarning(''); }}
        className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 relative ${
          isSelected
            ? 'bg-[#1A312C] text-white border border-[#1A312C] shadow-sm'
            : 'bg-white hover:bg-slate-50 border border-transparent hover:border-slate-100 text-slate-800'
        }`}
      >
        <div className="relative shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
            isSelected ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {chat.partner_name ? chat.partner_name.charAt(0).toUpperCase() : <User size={18} />}
          </div>
          {!isFinished && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className={`text-xs font-bold truncate max-w-[120px] ${isSelected ? 'text-white' : 'text-slate-900'}`}>
              {chat.partner_name}
            </h4>
            {chat.last_message_time && (
              <span className={`text-[10px] font-medium shrink-0 ml-1 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                {new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <p className={`text-[11px] truncate mt-0.5 font-medium ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
            {chat.last_message || 'No messages yet'}
          </p>

          <div className="mt-1 flex items-center gap-1.5">
            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
              isSelected
                ? 'bg-white/10 text-emerald-300 border border-white/10'
                : isFinished ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
              {statusStr.replace('_', ' ')}
            </span>
          </div>
        </div>

        {unreadCount > 0 && !isSelected && (
          <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black flex items-center justify-center shrink-0 self-center shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn h-[700px] flex flex-col font-sans">

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch flex-1 overflow-hidden">

        {/* Left Panel: Search & Conversation List */}
        <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-4 flex flex-col gap-4 overflow-hidden shadow-xs">

          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search conversations..."
              className="w-full bg-slate-50 border border-slate-200/70 focus:bg-white focus:border-emerald-600 rounded-2xl pl-9 pr-3 py-2 text-xs outline-none font-medium transition-all"
            />
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">

            {/* Section 1: Pinned / Ongoing Chats */}
            <div>
              <div className="flex items-center gap-1.5 px-2 mb-2 text-slate-400">
                <Pin size={12} className="rotate-45" />
                <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Pinned / Ongoing Chats</h3>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full ml-auto border border-emerald-100">
                  {ongoingChats.length}
                </span>
              </div>

              {ongoingChats.length > 0 ? (
                <div className="space-y-1">
                  {ongoingChats.map(renderChatItem)}
                </div>
              ) : (
                <div className="p-3 text-center text-slate-400 text-[11px] bg-slate-50 rounded-xl">
                  No active ongoing chats.
                </div>
              )}
            </div>

            {/* Section 2: Finished / Past Chats */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 px-2 mb-2 text-slate-400">
                <MessageSquare size={12} />
                <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Finished / Archived Chats</h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full ml-auto">
                  {finishedChats.length}
                </span>
              </div>

              {finishedChats.length > 0 ? (
                <div className="space-y-1 opacity-90">
                  {finishedChats.map(renderChatItem)}
                </div>
              ) : (
                <div className="p-3 text-center text-slate-400 text-[11px] bg-slate-50 rounded-xl">
                  No finished chats yet.
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Panel: Active Chat History & Input */}
        <div className="md:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-5 flex flex-col justify-between overflow-hidden shadow-xs">
          {activeChat ? (
            <>
              {/* Header Bar */}
              <div className="pb-3 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                    {activeChat.partner_name ? activeChat.partner_name.charAt(0).toUpperCase() : <User size={18} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{activeChat.partner_name}</h3>
                    <p className="text-xs text-slate-500 font-medium">Job: {activeChat.job_title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isLocked ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
                      <Lock size={12} /> Finished / Archived
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                      Active Channel
                    </span>
                  )}
                </div>
              </div>

              {/* Warnings */}
              {systemWarning && (
                <div className="mx-2 mt-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl flex items-center gap-2 font-medium shrink-0">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span>{systemWarning}</span>
                </div>
              )}

              {error && (
                <div className="mx-2 mt-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2 font-medium shrink-0">
                  <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Messages Viewport */}
              <div className="flex-1 overflow-y-auto my-3 p-4 bg-slate-50/40 rounded-2xl space-y-4">
                {/* Date Divider Badge */}
                <div className="flex justify-center my-2">
                  <span className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-white border border-slate-200/80 rounded-full shadow-2xs">
                    TODAY
                  </span>
                </div>

                {loading ? (
                  <div className="text-center text-xs text-slate-400 py-12 flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                    <span>Loading conversation history...</span>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg, i) => {
                    const isMe = msg.sender_ID === user.user_ID;
                    const msgTime = new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={msg.msg_ID || i} className={`flex gap-3 items-end max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'}`}>
                        {/* Partner Avatar for incoming */}
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mb-1">
                            {activeChat.partner_name ? activeChat.partner_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}

                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {/* Message Header (Timestamp / Me / Checkmarks) */}
                          <div className={`text-[10px] text-slate-400 font-medium mb-1 flex items-center gap-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {isMe ? (
                              <>
                                <CheckCheck size={12} className="text-emerald-600" />
                                <span>{msgTime}</span>
                                <span className="font-bold text-slate-700">Me</span>
                              </>
                            ) : (
                              <span>{msgTime}</span>
                            )}
                          </div>

                          {/* Message Bubble */}
                          <div className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-[#1A312C] text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                          }`}>
                            {msg.content}
                          </div>

                          {msg.flagged == 1 && (
                            <span className="text-[9px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                              <ShieldAlert size={10} /> Flagged for review
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-xs text-slate-400 py-16">
                    No messages yet. Type below to start your conversation!
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Stage Locking & Bottom Controls */}
              {isLocked ? (
                <div className="p-3.5 bg-slate-100/90 border border-slate-200 rounded-2xl text-center space-y-2 shrink-0">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
                    <Lock size={14} className="text-slate-500" />
                    <span>
                      {isReviewSubmitted
                        ? "This job is completed. Messaging is locked and read-only."
                        : "This job is completed/archived. Messaging is locked and read-only."}
                    </span>
                  </div>
                  {isReviewSubmitted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                      <Award size={14} /> Review Submitted
                    </span>
                  ) : (
                    <button
                      onClick={() => navigate('/my-reviews')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all inline-flex items-center gap-1.5"
                    >
                      <Star size={14} /> Leave Review
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 shrink-0 pt-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200/80 focus-within:bg-white focus-within:border-emerald-600 rounded-2xl p-1.5 flex items-center gap-2 transition-all">
                    <button
                      type="button"
                      title="Attach File"
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all"
                    >
                      <Paperclip size={16} />
                    </button>

                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={sending}
                      maxLength={1000}
                      className="flex-1 bg-transparent text-xs outline-none font-medium px-2 py-1 text-slate-800"
                    />

                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="px-4 py-2 bg-[#1A312C] hover:bg-[#244b41] text-white rounded-xl transition-all flex items-center justify-center shrink-0 disabled:opacity-50 font-bold text-xs gap-1.5 shadow-xs"
                    >
                      <Send size={14} />
                      <span>Send</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                <MessageSquare size={32} />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-700">Select a Conversation</p>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Choose an ongoing or finished conversation from the left sidebar to view messages.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatTab;
