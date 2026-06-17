import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Send, AlertTriangle, Shield, Check, Clock } from 'lucide-react';

const ChatTab = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [systemWarning, setSystemWarning] = useState('');
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/communication/messages.php?get_active_chats=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.chats)) {
        setChats(data.chats);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  };

  const fetchMessages = async (jobId, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/communication/messages.php?job_ID=${jobId}`, {
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

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.job_ID);

      // Start polling every 3 seconds
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => {
        fetchMessages(activeChat.job_ID, true);
      }, 3000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    setSending(true);
    setSystemWarning('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/communication/messages.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_ID: activeChat.job_ID,
          receiver_ID: activeChat.partner_user_ID,
          content: newMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages(activeChat.job_ID, true);
        if (data.message && data.message.flagged == 1) {
          setSystemWarning(data.message.flagged_reason || 'Warning: Potential off-platform communication detected.');
        }
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Connection error. Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn h-[650px] flex flex-col">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Direct Messaging</h1>
        <p className="text-text-secondary mt-1">Communicate securely with your matched students or clients.</p>
      </div>

      {/* Terms and Conditions Banner */}
      <div className="bg-slate-900 border border-slate-800 text-slate-100 p-4 rounded-2xl flex items-start gap-3 shadow-md">
        <Shield size={20} className="text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold">Important Rules & Terms</p>
          <p className="text-slate-400">External communication (WhatsApp, phone, etc.) is strictly prohibited. All conversations are audited to prevent fraud. Violations will lead to immediate suspension.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch flex-1 overflow-hidden">
        {/* Chat partner sidebar */}
        <div className="md:col-span-4 bg-white border border-slate-100 rounded-3xl p-4 flex flex-col gap-4 overflow-y-auto">
          <h3 className="font-bold text-sm text-slate-800 px-1">Matched Chats</h3>
          {chats.length > 0 ? (
            <div className="space-y-2">
              {chats.map(chat => (
                <button
                  key={chat.job_ID}
                  onClick={() => { setActiveChat(chat); setError(''); setSystemWarning(''); }}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                    activeChat?.job_ID === chat.job_ID
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-wider ${activeChat?.job_ID === chat.job_ID ? 'text-emerald-400' : 'text-primary'}`}>
                    {chat.job_title}
                  </span>
                  <div>
                    <p className="text-xs font-bold">{chat.partner_name}</p>
                    <p className="text-[10px] opacity-75 capitalize">{chat.partner_role.replace('_', ' ')}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-4">
              <MessageSquare size={32} className="mb-2 opacity-50" />
              <p className="text-xs font-bold">No Match Yet</p>
              <p className="text-[10px] mt-1">Chats appear once a job application is shortlisted or accepted.</p>
            </div>
          )}
        </div>

        {/* Messaging Box */}
        <div className="md:col-span-8 bg-white border border-slate-100 rounded-3xl p-5 flex flex-col justify-between overflow-hidden">
          {activeChat ? (
            <>
              {/* Header */}
              <div className="pb-3 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{activeChat.partner_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Job: {activeChat.job_title}</p>
                </div>
              </div>

              {/* Warnings */}
              {systemWarning && (
                <div className="mx-2 mt-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2 font-medium shrink-0 animate-fadeIn">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span>{systemWarning}</span>
                </div>
              )}

              {error && (
                <div className="mx-2 mt-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium shrink-0 animate-fadeIn">
                  <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto my-4 p-4 bg-slate-50/50 rounded-2xl space-y-4">
                {loading ? (
                  <div className="text-center text-xs text-slate-400 py-8">Loading messages...</div>
                ) : messages.length > 0 ? (
                  messages.map((msg, i) => {
                    const isMe = msg.sender_ID === user.user_ID;
                    return (
                      <div key={i} className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <div className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-slate-900 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                        {msg.flagged == 1 && (
                          <span className="text-[9px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                            <AlertTriangle size={10} /> Flagged: Off-platform warning
                          </span>
                        )}
                        <span className="text-[8px] text-slate-400 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-xs text-slate-400 py-12">No messages. Type below to start the conversation!</div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your secure message..."
                  disabled={sending}
                  className="flex-1 bg-slate-50 border border-slate-100 focus:bg-white focus:border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare size={48} className="mb-3 opacity-25" />
              <p className="font-bold text-sm">Select a Conversation</p>
              <p className="text-xs max-w-xs mt-1">Choose a matched partner from the list to start communicating.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatTab;
