
import React, { useState, useRef } from 'react';
import { X, Moon, Sun, Bell, Download, Upload, Trash2, Globe, Clock, Layout, Shield, Check, Monitor, Volume2, Info, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onClearData: () => void;
}

type Tab = 'general' | 'appearance' | 'notifications' | 'data' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  onExportData,
  onImportData,
  onClearData
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
    }
  };

  const menuItems = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'appearance', label: 'Appearance', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data & Sync', icon: Shield },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-4xl h-[80vh] max-h-[700px] bg-card border border-white/10 rounded-3xl shadow-2xl flex overflow-hidden"
      >
        {/* Sidebar */}
        <div className="w-64 bg-secondary/30 border-r border-border flex flex-col">
          <div className="h-[88px] px-6 flex flex-col justify-center border-b border-border/50">
            <h2 className="text-lg font-bold tracking-tight">Settings</h2>
            <p className="text-xs text-muted-foreground mt-1">Manage your preferences</p>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-card/50">
          {/* Header */}
          <div className="h-[88px] px-6 border-b border-border/50 flex items-center justify-between bg-card/80 backdrop-blur-sm sticky top-0 z-10">
            <h3 className="text-xl font-semibold">{menuItems.find(i => i.id === activeTab)?.label}</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:px-8 custom-scrollbar">
            
            {activeTab === 'general' && (
              <div className="space-y-8 max-w-2xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <div>
                       <label className="text-sm font-medium text-foreground block">Language</label>
                       <p className="text-xs text-muted-foreground">Select your preferred language</p>
                     </div>
                     <select className="bg-secondary border border-transparent rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary/50">
                       <option>English (US)</option>
                       <option>Spanish</option>
                       <option>French</option>
                       <option>German</option>
                       <option>Japanese</option>
                     </select>
                  </div>
                  
                  <div className="w-full h-px bg-border/50" />
                  
                  <div className="flex items-center justify-between">
                     <div>
                       <label className="text-sm font-medium text-foreground block">Start of Week</label>
                       <p className="text-xs text-muted-foreground">Which day starts your weekly views</p>
                     </div>
                     <select className="bg-secondary border border-transparent rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary/50">
                       <option>Sunday</option>
                       <option>Monday</option>
                     </select>
                  </div>

                  <div className="w-full h-px bg-border/50" />

                  <div className="flex items-center justify-between">
                     <div>
                       <label className="text-sm font-medium text-foreground block">Time Format</label>
                       <p className="text-xs text-muted-foreground">Display time in 12h or 24h format</p>
                     </div>
                     <div className="flex items-center bg-secondary p-1 rounded-lg">
                        <button className="px-3 py-1 rounded bg-background shadow text-xs font-medium">12h</button>
                        <button className="px-3 py-1 rounded text-muted-foreground hover:text-foreground text-xs font-medium">24h</button>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-8 max-w-2xl">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                             {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                          </div>
                          <div>
                             <label className="text-sm font-medium text-foreground block">Theme Mode</label>
                             <p className="text-xs text-muted-foreground">Switch between dark and light mode</p>
                          </div>
                       </div>
                       <button 
                          onClick={onToggleTheme}
                          className="bg-secondary hover:bg-secondary/80 border border-border px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                       </button>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8 max-w-2xl">
                 <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                    <Bell className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                       <h4 className="text-sm font-medium text-foreground">Browser Notifications</h4>
                       <p className="text-xs text-muted-foreground mt-1">ZenTask uses browser notifications to alert you of due tasks. Ensure you have allowed permissions.</p>
                       <button 
                          onClick={() => Notification.requestPermission()}
                          className="mt-3 text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                       >
                          Request Permission
                       </button>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-foreground block">Task Reminders</label>
                            <p className="text-xs text-muted-foreground">Receive alerts for tasks with due times</p>
                        </div>
                        <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer">
                             <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                    </div>
                    <div className="w-full h-px bg-border/50" />
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-foreground block">Sound Effects</label>
                            <p className="text-xs text-muted-foreground">Play sounds when tasks are completed</p>
                        </div>
                        <div className="w-11 h-6 bg-secondary rounded-full relative cursor-pointer border border-border">
                             <div className="absolute left-1 top-1 w-4 h-4 bg-muted-foreground/50 rounded-full" />
                        </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-8 max-w-2xl">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-border rounded-xl p-4 hover:bg-secondary/20 transition-colors">
                       <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3">
                          <Download className="w-5 h-5" />
                       </div>
                       <h4 className="text-sm font-medium">Export Data</h4>
                       <p className="text-xs text-muted-foreground mt-1 mb-4">Download all your tasks, lists, and preferences as a JSON file.</p>
                       <button 
                         onClick={onExportData}
                         className="w-full py-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-xs font-medium transition-colors"
                       >
                         Export JSON
                       </button>
                    </div>

                    <div className="border border-border rounded-xl p-4 hover:bg-secondary/20 transition-colors">
                       <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 mb-3">
                          <Upload className="w-5 h-5" />
                       </div>
                       <h4 className="text-sm font-medium">Import Data</h4>
                       <p className="text-xs text-muted-foreground mt-1 mb-4">Restore your data from a previously exported JSON file.</p>
                       <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          accept=".json" 
                          className="hidden" 
                       />
                       <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-xs font-medium transition-colors"
                       >
                         Import JSON
                       </button>
                    </div>
                 </div>

                 <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-red-600 dark:text-red-400">Danger Zone</h4>
                            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                                Permanently delete all your tasks, lists, labels, and settings. This action cannot be undone.
                            </p>
                            <button 
                                onClick={() => {
                                    if(window.confirm('Are you absolutely sure you want to delete all data? This cannot be undone.')) {
                                        onClearData();
                                    }
                                }}
                                className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-3 h-3" />
                                Clear All Data
                            </button>
                        </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'about' && (
               <div className="text-center py-8 space-y-6 max-w-lg mx-auto">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30">
                      <Check className="w-10 h-10 text-white" />
                  </div>
                  
                  <div>
                      <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">ZenTask</h3>
                      <p className="text-sm text-muted-foreground mt-2">The intelligent daily task planner designed for focus and clarity.</p>
                  </div>

                  <div className="bg-secondary/30 rounded-xl p-4 space-y-3 border border-border/50">
                      <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Version</span>
                          <span className="font-mono">1.1.0</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Build</span>
                          <span className="font-mono">2024.05.20</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Engine</span>
                          <span className="font-mono">React 19 + Tailwind</span>
                      </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                      <p>&copy; 2024 ZenTask Inc. All rights reserved.</p>
                  </div>
               </div>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
};
