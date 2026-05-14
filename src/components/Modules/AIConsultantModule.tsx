import React, { useRef, useEffect, useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Bot, Send, Zap, Trash2, Cpu, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';

export default function AIConsultantModule() {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Systems initialized. I am your Gemini-powered Geophysical Intelligence Agent. Upload any raw data (.segy, .las, .mseed) or ask me to perform automated denoising analysis on your current batch." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: `You are an elite Geophysics AI Assistant specialized in processing raw data formats like SEGY, LAS, and Microseismic. 
          You provide advice on denoising, automatic horizon picking, well-log normalization, and spatial interpolation. 
          Keep your tone professional, technical, and precise. Use markdown for formulas and code snippets.`,
        }
      });

      const aiText = response.text || "I'm having trouble connecting to the inference engine. Please check your data pipe.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: AI Inference Link Severed. Please check your API credentials." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col bg-[#1A1A1A] border border-[#333333] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#333333] bg-[#222222] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF5722] rounded flex items-center justify-center">
            <Bot size={18} className="text-black" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-tight">Gemini Intelligence Agent</h2>
            <p className="text-[10px] text-[#888888] font-mono uppercase">LLM-GEOPHYSICS-V3 // ACTIVE</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-[#555555] font-mono">
          <div className="flex items-center gap-1">
            <Cpu size={12} />
            <span>GEMINI-3-FLASH</span>
          </div>
          <div className="w-px h-3 bg-[#333333]"></div>
          <span>TOKEN_USAGE: OPTIMIZED</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#333333]"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={cn(
                "flex flex-col max-w-[85%]",
                msg.role === 'user' ? "ml-auto items-end" : "items-start"
              )}
            >
              <div className={cn(
                "p-4 rounded-lg text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-[#FF5722] text-black font-medium" 
                  : "bg-black/40 border border-[#333333] text-[#AAAAAA] markdown-body"
              )}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
              <span className="text-[9px] text-[#444444] font-mono mt-1 uppercase">
                {msg.role === 'assistant' ? 'Intelligence Agent' : 'Geophysicist'} // {new Date().toLocaleTimeString()}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex items-center gap-2 text-[#FF5722] text-[10px] font-mono">
            <Zap size={12} className="animate-pulse" />
            INFERRING DATA...
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#333333] bg-[#222222]">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about denoising algorithms or interpretation support..."
            className="flex-1 bg-black/40 border border-[#444444] rounded px-4 py-2 text-sm focus:outline-none focus:border-[#FF5722] transition-colors"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-[#FF5722] text-black px-4 py-2 rounded font-bold transition-all hover:bg-[#ff7043] disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-[10px] text-[#888888] hover:text-[#FF5722] transition-colors uppercase font-bold">
            <Sparkles size={12} />
            Suggest Denoising
          </button>
          <button className="flex items-center gap-1.5 text-[10px] text-[#888888] hover:text-[#FF5722] transition-colors uppercase font-bold">
            <Activity size={12} />
            Scan Anomalies
          </button>
        </div>
      </div>
    </div>
  );
}

const Activity = ({ size, className }: any) => <Zap size={size} className={className} />;
