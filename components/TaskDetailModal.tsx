
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Flag, Clock, Plus, Trash2, Save, ListTodo, Activity, Tag, Palette, Check, Bell, Repeat, Paperclip, Link as LinkIcon, FileText, ExternalLink, Timer, Siren } from 'lucide-react';
import { Task, Priority, SubTask, Label, Reminder, Recurrence, RecurrenceUnit, Attachment, TaskList } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskDetailModalProps {
  task: Task;
  labels: Label[];
  lists: TaskList[];
  onAddLabel: (name: string, color: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete: (id: string) => void;
}

// Preset colors for task styling
const TASK_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task: initialTask, 
  labels,
  lists,
  onAddLabel,
  isOpen, 
  onClose, 
  onSave,
  onDelete
}) => {
  const [task, setTask] = useState<Task>(initialTask);
  const [newSubtask, setNewSubtask] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showReminderInput, setShowReminderInput] = useState(false);
  const [customReminderTime, setCustomReminderTime] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  
  const labelPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  // Close label picker on click outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (labelPickerRef.current && !labelPickerRef.current.contains(event.target as Node)) {
              setShowLabelPicker(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleUpdate = (updates: Partial<Task>) => {
    const updated = { ...task, ...updates, logs: [...task.logs, { id: crypto.randomUUID(), timestamp: Date.now(), message: 'Updated task details' }] };
    setTask(updated);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const sub: SubTask = { id: crypto.randomUUID(), title: newSubtask, completed: false };
    handleUpdate({ subtasks: [...task.subtasks, sub] });
    setNewSubtask('');
  };

  const toggleSubtask = (subId: string) => {
    const newSubs = task.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
    handleUpdate({ subtasks: newSubs });
  };

  const updateSubtask = (subId: string, updates: Partial<SubTask>) => {
      const newSubs = task.subtasks.map(s => s.id === subId ? { ...s, ...updates } : s);
      handleUpdate({ subtasks: newSubs });
  };

  const toggleLabel = (labelId: string) => {
      const currentLabels = task.labelIds || [];
      if (currentLabels.includes(labelId)) {
          handleUpdate({ labelIds: currentLabels.filter(id => id !== labelId) });
      } else {
          handleUpdate({ labelIds: [...currentLabels, labelId] });
      }
  };

  const addReminder = (dateStr: string) => {
      if (!dateStr) return;
      const newReminder: Reminder = {
          id: crypto.randomUUID(),
          time: new Date(dateStr).toISOString(),
          fired: false
      };
      const currentReminders = task.reminders || [];
      handleUpdate({ reminders: [...currentReminders, newReminder] });
      setCustomReminderTime('');
      setShowReminderInput(false);
  };

  const addRelativeReminder = (minutesBefore: number) => {
      if (!task.dueDate) {
          alert("Please set a due date first.");
          return;
      }
      const due = new Date(task.dueDate);
      const reminderDate = new Date(due.getTime() - minutesBefore * 60 * 1000);
      addReminder(reminderDate.toISOString());
  };

  const deleteReminder = (id: string) => {
      const currentReminders = task.reminders || [];
      handleUpdate({ reminders: currentReminders.filter(r => r.id !== id) });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (file.size > 500 * 1024) { // 500KB limit
          alert("File too large for local storage demo (max 500KB)");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
          const newAttachment: Attachment = {
              id: crypto.randomUUID(),
              name: file.name,
              type: 'file',
              url: reader.result as string,
              mimeType: file.type,
              size: file.size
          };
          handleUpdate({ attachments: [...(task.attachments || []), newAttachment] });
      };
      reader.readAsDataURL(file);
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddLink = (e: React.FormEvent) => {
      e.preventDefault();
      if (!linkUrl.trim()) return;
      
      let formattedUrl = linkUrl;
      if (!/^https?:\/\//i.test(formattedUrl)) {
          formattedUrl = 'https://' + formattedUrl;
      }

      const newAttachment: Attachment = {
          id: crypto.randomUUID(),
          name: formattedUrl,
          type: 'link',
          url: formattedUrl
      };
      handleUpdate({ attachments: [...(task.attachments || []), newAttachment] });
      setLinkUrl('');
      setShowLinkInput(false);
  };

  const deleteAttachment = (id: string) => {
      handleUpdate({ attachments: (task.attachments || []).filter(a => a.id !== id) });
  };

  const saveAndClose = () => {
    onSave(task);
    onClose();
  };

  const activeColor = task.color || 'var(--primary)';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-card/90 backdrop-blur-xl w-full max-w-2xl rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[85vh] relative overflow-hidden"
      >
        {/* Decorative header gradient */}
        <div 
            className="absolute top-0 left-0 right-0 h-1.5" 
            style={{ background: `linear-gradient(90deg, ${activeColor}, ${activeColor}80)` }}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
             <label className="flex items-center gap-2 cursor-pointer group">
                <div 
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-primary border-primary' : 'border-muted-foreground/30 group-hover:border-primary'}`}
                    style={task.completed ? { backgroundColor: activeColor, borderColor: activeColor } : { borderColor: task.completed ? activeColor : undefined }}
                >
                     {task.completed && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><X className="w-3 h-3 text-white" /></motion.div>} 
                </div>
                <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleUpdate({ completed: !task.completed })}
                    className="hidden"
                />
                <span className={`text-sm font-medium transition-colors ${task.completed ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {task.completed ? 'Completed' : 'Mark Complete'}
                </span>
             </label>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => onDelete(task.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors" title="Delete Task">
              <Trash2 className="w-4.5 h-4.5" />
            </button>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Title & Description */}
          <div className="space-y-4">
            <input
              type="text"
              value={task.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              className="w-full bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
              placeholder="Task name"
            />
            <textarea
              value={task.description || ''}
              onChange={(e) => handleUpdate({ description: e.target.value })}
              rows={3}
              className="w-full bg-secondary/30 border border-transparent focus:border-primary/20 rounded-xl p-3 text-sm text-muted-foreground focus:text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none transition-colors"
              placeholder="Add a more detailed description..."
            />
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
             <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> List
              </label>
              <div className="relative">
                 <select
                    value={task.listId}
                    onChange={(e) => handleUpdate({ listId: e.target.value })}
                    className="w-full appearance-none bg-secondary/50 border border-transparent hover:bg-secondary rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all cursor-pointer"
                 >
                    <option value="inbox">📥 Inbox</option>
                    {lists.map(list => (
                        <option key={list.id} value={list.id}>{list.icon} {list.name}</option>
                    ))}
                 </select>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </label>
              <input
                type="date"
                value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                onChange={(e) => handleUpdate({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="w-full bg-secondary/50 border border-transparent hover:bg-secondary rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Priority
              </label>
              <div className="relative">
                <select
                    value={task.priority}
                    onChange={(e) => handleUpdate({ priority: e.target.value as Priority })}
                    className="w-full appearance-none bg-secondary/50 border border-transparent hover:bg-secondary rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all cursor-pointer"
                >
                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className={`w-2 h-2 rounded-full ${
                        task.priority === Priority.High ? 'bg-red-500' : 
                        task.priority === Priority.Medium ? 'bg-orange-500' :
                        task.priority === Priority.Low ? 'bg-blue-500' : 'bg-muted-foreground'
                    }`} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5" /> Repeat
              </label>
              <div className="relative">
                 <select
                    value={task.recurrence}
                    onChange={(e) => handleUpdate({ recurrence: e.target.value as Recurrence })}
                    className="w-full appearance-none bg-secondary/50 border border-transparent hover:bg-secondary rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all cursor-pointer"
                 >
                    {Object.values(Recurrence).map(r => <option key={r} value={r}>{r}</option>)}
                 </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Estimate
              </label>
              <input
                type="time"
                value={task.estimate || ''}
                onChange={(e) => handleUpdate({ estimate: e.target.value })}
                className="w-full bg-secondary/50 border border-transparent hover:bg-secondary rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Siren className="w-3.5 h-3.5" /> Deadline
              </label>
              <input
                type="date"
                value={task.deadline ? task.deadline.split('T')[0] : ''}
                onChange={(e) => handleUpdate({ deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="w-full bg-secondary/50 border border-transparent hover:bg-secondary rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" /> Actual Time
              </label>
              <input
                type="text"
                value={task.actualTime || ''}
                onChange={(e) => handleUpdate({ actualTime: e.target.value })}
                placeholder="e.g. 2h 15m"
                className="w-full bg-secondary/50 border border-transparent hover:bg-secondary rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Custom Recurrence Settings */}
          <AnimatePresence>
            {task.recurrence === Recurrence.Custom && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-secondary/30 p-3 rounded-xl border border-dashed border-border space-y-2"
                >
                    <label className="text-xs font-semibold text-muted-foreground">Custom Repeat Interval</label>
                    <div className="flex items-center gap-2">
                        <span>Every</span>
                        <input 
                            type="number" 
                            min="1"
                            value={task.recurrenceCustom?.amount || 1}
                            onChange={(e) => handleUpdate({ recurrenceCustom: { ...(task.recurrenceCustom || { unit: 'days' as RecurrenceUnit }), amount: parseInt(e.target.value) || 1 } })}
                            className="w-16 bg-background border border-border rounded-lg px-2 py-1 text-center focus:outline-none"
                        />
                        <select
                            value={task.recurrenceCustom?.unit || 'days'}
                            onChange={(e) => handleUpdate({ recurrenceCustom: { ...(task.recurrenceCustom || { amount: 1 }), unit: e.target.value as RecurrenceUnit } })}
                            className="bg-background border border-border rounded-lg px-2 py-1 focus:outline-none"
                        >
                            <option value="days">Days</option>
                            <option value="weeks">Weeks</option>
                            <option value="months">Months</option>
                            <option value="years">Years</option>
                        </select>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          {/* Label Selector */}
          <div className="space-y-1.5 relative" ref={labelPickerRef}>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Labels
                </label>
                <button
                    onClick={() => setShowLabelPicker(!showLabelPicker)}
                    className="w-full flex items-center gap-2 bg-secondary/50 border border-transparent hover:bg-secondary rounded-lg px-3 py-2 text-sm text-foreground transition-all text-left overflow-hidden"
                >
                   {task.labelIds && task.labelIds.length > 0 ? (
                       <div className="flex flex-wrap gap-1">
                           {task.labelIds.slice(0, 2).map(id => {
                               const label = labels.find(l => l.id === id);
                               return label ? (
                                   <span key={id} className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} title={label.name} />
                               ) : null;
                           })}
                           {task.labelIds.length > 2 && <span className="text-[10px] text-muted-foreground">+{task.labelIds.length - 2}</span>}
                           <span className="ml-1 truncate">{labels.find(l => l.id === task.labelIds![0])?.name || 'Labels'}</span>
                       </div>
                   ) : (
                       <span className="text-muted-foreground">Select labels...</span>
                   )}
                </button>
                
                <AnimatePresence>
                    {showLabelPicker && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 right-0 z-50 mt-2 bg-popover border border-border rounded-xl shadow-xl p-2 overflow-hidden"
                        >
                             <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                                 {labels.map(label => (
                                     <button
                                        key={label.id}
                                        onClick={() => toggleLabel(label.id)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors text-sm"
                                     >
                                         <div className={`w-4 h-4 rounded flex items-center justify-center border ${task.labelIds?.includes(label.id) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                             {task.labelIds?.includes(label.id) && <Check className="w-3 h-3 text-white" />}
                                         </div>
                                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
                                         <span className="truncate">{label.name}</span>
                                     </button>
                                 ))}
                                 {labels.length === 0 && (
                                     <div className="text-xs text-muted-foreground p-2 text-center">No labels created yet</div>
                                 )}
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>
          </div>
          
          {/* Reminders Section */}
          <div className="space-y-2">
              <div className="flex items-center justify-between">
                   <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5" /> Reminders
                   </label>
                   <button 
                        onClick={() => setShowReminderInput(!showReminderInput)}
                        className="text-xs text-primary hover:underline"
                   >
                       + Add Reminder
                   </button>
              </div>
              
              <AnimatePresence>
                  {showReminderInput && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-secondary/30 rounded-lg p-3 space-y-3 border border-border/50"
                      >
                          <div className="flex items-center gap-2">
                              <input 
                                type="datetime-local"
                                value={customReminderTime}
                                onChange={(e) => setCustomReminderTime(e.target.value)}
                                className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none"
                              />
                              <button 
                                onClick={() => addReminder(customReminderTime)}
                                disabled={!customReminderTime}
                                className="bg-primary text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                              >
                                  Set
                              </button>
                          </div>
                          {task.dueDate && (
                              <div className="flex gap-2 flex-wrap">
                                  <button onClick={() => addRelativeReminder(0)} className="text-[10px] bg-background border border-border px-2 py-1 rounded hover:bg-secondary">On due time</button>
                                  <button onClick={() => addRelativeReminder(10)} className="text-[10px] bg-background border border-border px-2 py-1 rounded hover:bg-secondary">10m before</button>
                                  <button onClick={() => addRelativeReminder(60)} className="text-[10px] bg-background border border-border px-2 py-1 rounded hover:bg-secondary">1h before</button>
                                  <button onClick={() => addRelativeReminder(1440)} className="text-[10px] bg-background border border-border px-2 py-1 rounded hover:bg-secondary">1d before</button>
                              </div>
                          )}
                      </motion.div>
                  )}
              </AnimatePresence>

              {task.reminders && task.reminders.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                      {task.reminders.sort((a,b) => new Date(a.time).getTime() - new Date(b.time).getTime()).map(reminder => (
                          <div key={reminder.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${reminder.fired ? 'bg-secondary/50 text-muted-foreground border-transparent' : 'bg-primary/5 border-primary/20 text-foreground'}`}>
                              <Clock className="w-3 h-3 opacity-70" />
                              <span>{new Date(reminder.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              <button onClick={() => deleteReminder(reminder.id)} className="hover:text-destructive transition-colors ml-1">
                                  <X className="w-3 h-3" />
                              </button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-xs text-muted-foreground italic">No reminders set</p>
              )}
          </div>
          
          {/* Attachments Section */}
          <div className="space-y-2">
              <div className="flex items-center justify-between">
                   <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5" /> Attachments
                   </label>
                   <div className="flex items-center gap-2">
                       <button 
                            onClick={() => setShowLinkInput(!showLinkInput)}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                       >
                           <LinkIcon className="w-3 h-3" /> Link
                       </button>
                       <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                       >
                           <Plus className="w-3 h-3" /> Upload
                       </button>
                   </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />

              <AnimatePresence>
                 {showLinkInput && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddLink}
                        className="bg-secondary/30 rounded-lg p-2 flex items-center gap-2 border border-border/50 mb-2"
                      >
                          <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                          <input 
                            autoFocus
                            type="text"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="Paste URL here..."
                            className="flex-1 bg-transparent text-xs focus:outline-none"
                          />
                          <button type="submit" className="text-xs bg-primary text-white px-2 py-1 rounded">Add</button>
                      </motion.form>
                 )}
              </AnimatePresence>

              <div className="space-y-2">
                  {task.attachments && task.attachments.length > 0 ? (
                      task.attachments.map(att => (
                          <div key={att.id} className="group flex items-center gap-3 p-2 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                                  {att.type === 'link' ? <LinkIcon className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-orange-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <a href={att.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-foreground hover:text-primary truncate block">
                                      {att.name}
                                  </a>
                                  {att.size && (
                                      <div className="text-[10px] text-muted-foreground">
                                          {Math.round(att.size / 1024)} KB
                                      </div>
                                  )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <a href={att.url} target="_blank" rel="noreferrer" className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-background">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <button onClick={() => deleteAttachment(att.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-background">
                                      <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-xs text-muted-foreground italic px-1">No attachments</div>
                  )}
              </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
             <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Task Color
              </label>
              <div className="flex flex-wrap gap-2">
                  <button
                     onClick={() => handleUpdate({ color: undefined })}
                     className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${!task.color ? 'border-primary' : 'border-transparent hover:border-border'}`}
                     title="Default"
                  >
                      <div className="w-full h-full rounded-full bg-secondary" />
                  </button>
                  {TASK_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => handleUpdate({ color })}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${task.color === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      >
                          {task.color === color && <Check className="w-4 h-4 text-white mix-blend-difference" />}
                      </button>
                  ))}
              </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-primary" /> Subtasks
                </label>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                </span>
             </div>
             
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                {task.subtasks.map(sub => (
                  <motion.div 
                    key={sub.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-2 group bg-secondary/20 rounded-lg p-2"
                  >
                    <div className="flex items-center gap-3">
                        <button
                        onClick={() => toggleSubtask(sub.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 relative overflow-hidden ${sub.completed ? 'bg-primary border-primary' : 'border-muted-foreground/40 hover:border-primary'}`}
                        >
                            <motion.div
                                initial={false}
                                animate={{ scale: sub.completed ? 1 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                                <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                            </motion.div>
                            {sub.completed && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0.5 }}
                                    animate={{ scale: 2, opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute inset-0 bg-white rounded-full"
                                />
                            )}
                        </button>
                        <input 
                        type="text" 
                        value={sub.title}
                        onChange={(e) => updateSubtask(sub.id, { title: e.target.value })}
                        className={`flex-1 bg-transparent text-sm focus:outline-none transition-all ${sub.completed ? 'text-muted-foreground line-through opacity-70' : 'text-foreground'}`}
                        />
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="relative">
                                <input 
                                    type="date"
                                    value={sub.dueDate ? sub.dueDate.split('T')[0] : ''}
                                    onChange={(e) => updateSubtask(sub.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                />
                                <button className={`p-1 rounded hover:bg-background/80 ${sub.dueDate ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`} title="Set subtask due date">
                                    <Calendar className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <button 
                            onClick={() => handleUpdate({ subtasks: task.subtasks.filter(s => s.id !== sub.id) })}
                            className="p-1 rounded hover:bg-background/80 text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete subtask"
                            >
                            <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Subtask Due Date Display */}
                    {sub.dueDate && (
                        <div className="flex items-center gap-1.5 pl-7 text-[10px]">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className={`${
                                new Date(sub.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && !sub.completed 
                                ? 'text-red-500 font-medium' 
                                : 'text-muted-foreground'
                            }`}>
                                {new Date(sub.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    )}
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
              
              <form onSubmit={handleAddSubtask} className="flex items-center gap-3 p-2 border border-dashed border-border rounded-lg hover:bg-secondary/30 transition-colors">
                <Plus className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add a subtask..."
                  className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/50"
                />
              </form>
          </div>
          
          {/* Activity Log (Read Only) - Collapsible in design */}
          <div className="pt-6 border-t border-border/50">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Activity
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {task.logs.slice().reverse().map(log => (
                <div key={log.id} className="flex items-start gap-2 text-[11px] text-muted-foreground/60">
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                  <span>
                      <span className="font-medium text-muted-foreground/80">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {' - '} 
                      {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/50 flex justify-end bg-card/50">
          <button 
            onClick={saveAndClose}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: task.color || undefined }}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>

      </motion.div>
    </div>
  );
};
    