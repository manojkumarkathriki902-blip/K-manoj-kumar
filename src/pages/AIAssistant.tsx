import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Bot, Send, MapPin, ShoppingBag } from 'lucide-react';

export default function AIAssistant() {
  const { id } = useParams();
  const [messages, setMessages] = useState<any[]>([
    { role: 'ai', content: 'Hello! I am your AI Construction Assistant. Ask me about construction stages, material estimates, or find suppliers nearby.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'suppliers'>('chat');
  const [location, setLocation] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (mode === 'chat') {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: input,
            context: { projectId: id } // Pass basic context
          })
        });
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'ai', content: data.reply || data.error }]);
      } else {
        // Supplier mode
        const res = await fetch('/api/ai/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            material: input,
            location: location || 'New York' // Default if empty
          })
        });
        const data = await res.json();
        
        let content = "Here are some suppliers I found:\n\n";
        if (data.suppliers && Array.isArray(data.suppliers)) {
            data.suppliers.forEach((s: any) => {
                content += `**${s.name}**\n📍 ${s.distance || 'Nearby'}\n📞 ${s.phone || 'N/A'}\n\n`;
            });
        } else {
            content = "Sorry, I couldn't find any suppliers.";
        }
        
        setMessages(prev => [...prev, { role: 'ai', content }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen bg-slate-50 max-w-4xl mx-auto border-x border-slate-200">
      <div className="bg-white p-4 shadow-sm border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <Bot className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg">AI Assistant</h1>
        </div>
        
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button 
            onClick={() => setMode('chat')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'chat' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
          >
            Chat
          </button>
          <button 
            onClick={() => setMode('suppliers')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'suppliers' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
          >
            Find Suppliers
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800'} rounded-2xl px-5 py-3 shadow-sm whitespace-pre-wrap`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-500 rounded-2xl px-5 py-3 shadow-sm">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        {mode === 'suppliers' && (
          <div className="mb-2 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <MapPin className="w-4 h-4 text-slate-400" />
            <input 
              className="bg-transparent outline-none text-sm w-full"
              placeholder="Enter City/Location (e.g. Austin, TX)"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            className="flex-1 border border-slate-200 rounded-full px-4 py-2 focus:outline-none focus:border-indigo-500"
            placeholder={mode === 'chat' ? "Ask about construction..." : "What material do you need?"}
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button 
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
