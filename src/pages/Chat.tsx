import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Send, User } from 'lucide-react';

export default function Chat() {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial load
    fetchMessages();

    // WebSocket connect
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws.current = new WebSocket(`${protocol}//${window.location.host}`);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message' && data.message.project_id === parseInt(id!)) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [id]);

  const fetchMessages = async () => {
    const res = await fetch(`/api/projects/${id}/messages`);
    const data = await res.json();
    setMessages(data);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ws.current) return;

    const msg = {
      type: 'chat_message',
      project_id: parseInt(id!),
      sender_id: user?.id,
      sender_name: user?.name,
      content: input
    };

    ws.current.send(JSON.stringify(msg));
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen bg-slate-50">
      <div className="bg-white p-4 shadow-sm border-b border-slate-200">
        <h1 className="font-bold text-lg">Team Chat</h1>
        <p className="text-xs text-slate-500">Project #{id}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isMe ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800'} rounded-2xl px-4 py-2 shadow-sm`}>
                {!isMe && <p className="text-xs font-bold mb-1 opacity-70">{msg.sender_name}</p>}
                <p className="text-sm">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
        <input
          className="flex-1 border border-slate-200 rounded-full px-4 py-2 focus:outline-none focus:border-indigo-500"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button 
          type="submit"
          className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
