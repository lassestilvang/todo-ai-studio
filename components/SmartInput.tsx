import React, { useState } from 'react';
import { Sparkles, ArrowUp, Loader2, Command } from 'lucide-react';
import { parseTaskWithGemini } from '../services/geminiService';
import { Task, Priority } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartInputProps {
  onAddTask: (task: Partial<Task>) => void;
}

export const SmartInput: React.FC<SmartInputProps> = ({ onAddTask }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const aiResult = await parseTaskWithGemini(input);
      
      if (aiResult) {
        onAddTask({
          title: aiResult.title,
          description: aiResult.description,
          dueDate: aiResult.dueDate,
          priority: (aiResult.priority as Priority) || Priority.None,
          estimate: aiResult.estimate,
        });
      } else {
        onAddTask({
          title: input,
          priority: Priority.None,
          createdAt: Date.now()
        });
      }
      
      setInput('');
    } catch (error) {
      console.error("Failed to add task", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full group z-30">
       {/* Glowing Effect Background */}
       <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 ${isFocused ? 'opacity-60 blur-md' : ''}`}></div>
       
       <form onSubmit={handleSubmit} className="relative flex items-center bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl transition-all">
        <div className="pl-3 pr-2 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <motion.div
                animate={input.length > 0 ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
            >
                <Sparkles className={`w-5 h-5 ${input.length > 0 ? 'text-primary fill-primary/20' : 'text-muted-foreground'}`} />
            </motion.div>
          )}
        </div>
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask AI to plan your day..."
          className="flex-1 bg-transparent py-3 text-foreground placeholder:text-muted-foreground/70 focus:outline-none text-base"
        />
        
        <div className="flex items-center gap-2 pr-1">
            <AnimatePresence>
                {input.trim() && (
                    <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    type="submit"
                    disabled={isLoading}
                    className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 transition-all"
                    >
                    <ArrowUp className="w-4 h-4 stroke-[3px]" />
                    </motion.button>
                )}
            </AnimatePresence>
            {!input.trim() && (
                 <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 text-muted-foreground text-xs border border-white/5">
                    K
                 </div>
            )}
        </div>
      </form>
      
      {/* Hint */}
       <AnimatePresence>
        {isFocused && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 4 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-4 right-4 mt-1"
            >
                <div className="text-xs text-muted-foreground/80 flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full w-fit border border-white/5 shadow-lg">
                   <Command className="w-3 h-3" />
                   <span>Try: "Review Q3 roadmap with Sarah tomorrow at 10am high priority"</span>
                </div>
            </motion.div>
        )}
       </AnimatePresence>
    </div>
  );
};