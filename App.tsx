
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { TaskItem } from './components/TaskItem';
import { SmartInput } from './components/SmartInput';
import { TaskDetailModal } from './components/TaskDetailModal';
import { Task, TaskList, ViewType, Priority, Recurrence, Label, RecurrenceUnit, TaskLog } from './types';
import { Search, Sun, Moon, Menu, Tag, Bell, History, User, Clock, Activity, CheckCircle2, Circle, ArrowUpDown, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Initial Mock Data
const INITIAL_LISTS: TaskList[] = [
  { id: 'personal', name: 'Personal', color: '#ec4899', icon: '👤' },
  { id: 'work', name: 'Work', color: '#3b82f6', icon: '💼' },
  { id: 'ideas', name: 'Ideas', color: '#f59e0b', icon: '💡' },
];

const INITIAL_LABELS: Label[] = [
  { id: 'urgent', name: 'Urgent', color: '#ef4444' },
  { id: 'design', name: 'Design', color: '#8b5cf6' },
  { id: 'dev', name: 'Dev', color: '#10b981' },
];

type SortOption = 'smart' | 'dueDate' | 'priority' | 'added' | 'alphabetical';

// Helper to check if date is today
const isToday = (dateString?: string) => {
  if (!dateString) return false;
  const d = new Date(dateString);
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

// Helper for next 7 days
const isNext7Days = (dateString?: string) => {
  if (!dateString) return false;
  const d = new Date(dateString);
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  return d >= today && d <= nextWeek;
};

// Helper to calculate next due date for recurrence
const calculateNextDueDate = (
    currentDateStr: string | undefined, 
    recurrence: Recurrence, 
    custom?: { amount: number, unit: RecurrenceUnit }
): Date | undefined => {
    if (!currentDateStr) return undefined; 
    const date = new Date(currentDateStr);
    
    switch (recurrence) {
        case Recurrence.Daily:
            date.setDate(date.getDate() + 1);
            break;
        case Recurrence.Weekly:
            date.setDate(date.getDate() + 7);
            break;
        case Recurrence.Monthly:
            date.setMonth(date.getMonth() + 1);
            break;
        case Recurrence.Yearly:
            date.setFullYear(date.getFullYear() + 1);
            break;
        case Recurrence.Weekdays:
            // Move to next day until it is a weekday (1-5)
            do {
                date.setDate(date.getDate() + 1);
            } while (date.getDay() === 0 || date.getDay() === 6);
            break;
        case Recurrence.Custom:
            if (custom) {
                const { amount, unit } = custom;
                if (unit === 'days') date.setDate(date.getDate() + amount);
                if (unit === 'weeks') date.setDate(date.getDate() + amount * 7);
                if (unit === 'months') date.setMonth(date.getMonth() + amount);
                if (unit === 'years') date.setFullYear(date.getFullYear() + amount);
            }
            break;
    }
    return date;
};

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // App State
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('zentask_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [lists, setLists] = useState<TaskList[]>(() => {
    const saved = localStorage.getItem('zentask_lists');
    return saved ? JSON.parse(saved) : INITIAL_LISTS;
  });

  const [labels, setLabels] = useState<Label[]>(() => {
    const saved = localStorage.getItem('zentask_labels');
    return saved ? JSON.parse(saved) : INITIAL_LABELS;
  });

  const [activeView, setActiveView] = useState<ViewType>('inbox');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Sorting State
  const [sortBy, setSortBy] = useState<SortOption>('smart');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('zentask_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('zentask_lists', JSON.stringify(lists));
  }, [lists]);

  useEffect(() => {
    localStorage.setItem('zentask_labels', JSON.stringify(labels));
  }, [labels]);

  // Click outside sort menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
            setShowSortMenu(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reminder Check Logic
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = new Date();
      setTasks(currentTasks => {
        let hasUpdates = false;
        const updatedTasks = currentTasks.map(task => {
          if (task.completed || !task.reminders || task.reminders.length === 0) return task;

          const remindersToFire = task.reminders.filter(r => !r.fired && new Date(r.time) <= now);

          if (remindersToFire.length > 0) {
            hasUpdates = true;
            
            remindersToFire.forEach(() => {
              if (Notification.permission === 'granted') {
                new Notification(`Reminder: ${task.title}`, {
                  body: task.description || 'You have a task scheduled.',
                });
              }
            });

            return {
              ...task,
              reminders: task.reminders.map(r => 
                remindersToFire.some(rt => rt.id === r.id) ? { ...r, fired: true } : r
              )
            };
          }
          return task;
        });

        return hasUpdates ? updatedTasks : currentTasks;
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleAddTask = (newTaskPartial: Partial<Task>) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      listId: activeView === 'inbox' || activeView === 'today' || activeView === 'next7' || activeView === 'upcoming' || activeView === 'all' || activeView === 'activity' || activeView === 'search' ? 'inbox' : activeView,
      title: newTaskPartial.title || 'Untitled Task',
      description: newTaskPartial.description,
      completed: false,
      priority: newTaskPartial.priority || Priority.None,
      subtasks: [],
      recurrence: Recurrence.None,
      labelIds: [],
      reminders: [],
      attachments: [],
      logs: [{
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        message: 'Task created'
      }],
      createdAt: Date.now(),
      ...newTaskPartial
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev => {
      const taskIndex = prev.findIndex(t => t.id === id);
      if (taskIndex === -1) return prev;

      const task = prev[taskIndex];
      const newCompletedStatus = !task.completed;

      const updatedTask = {
        ...task,
        completed: newCompletedStatus,
        logs: [
          ...task.logs,
          { 
              id: crypto.randomUUID(), 
              timestamp: Date.now(), 
              message: newCompletedStatus ? 'Completed task' : 'Uncompleted task' 
          }
        ]
      };

      // Create a new array copy
      const newTasks = [...prev];
      newTasks[taskIndex] = updatedTask;

      // Handle Recurrence
      if (newCompletedStatus && task.recurrence !== Recurrence.None) {
        const nextDate = calculateNextDueDate(task.dueDate || new Date().toISOString(), task.recurrence, task.recurrenceCustom);

        if (nextDate) {
          const nextTask: Task = {
            ...task,
            id: crypto.randomUUID(),
            completed: false,
            dueDate: nextDate.toISOString(),
            // Clear reminders for the new instance as they are date-specific
            reminders: [],
            attachments: [], // Should recurring tasks inherit attachments? Usually no for new files, maybe yes for context. Let's assume clear for clean slate.
            // Reset logs for the new task
            logs: [{
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              message: `Recurring task created from '${task.title}'`
            }],
            createdAt: Date.now()
          };
          // Add the new task to the beginning of the list
          newTasks.unshift(nextTask);
        }
      }

      return newTasks;
    });
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => {
      if (t.id === updatedTask.id) {
        const timestamp = Date.now();
        const newLogs: TaskLog[] = [];
        const addLog = (msg: string) => newLogs.push({ id: crypto.randomUUID(), timestamp, message: msg });

        // Title
        if (t.title !== updatedTask.title) {
             addLog(`Renamed to "${updatedTask.title}"`);
        }
        // Description
        if (t.description !== updatedTask.description) {
            if (!t.description && updatedTask.description) addLog(`Added description`);
            else if (t.description && !updatedTask.description) addLog(`Removed description`);
            else addLog(`Updated description`);
        }
        // Due Date
        if (t.dueDate !== updatedTask.dueDate) {
            if (updatedTask.dueDate) {
                 const dateStr = new Date(updatedTask.dueDate).toLocaleDateString();
                 addLog(t.dueDate ? `Rescheduled to ${dateStr}` : `Set due date to ${dateStr}`);
            } else {
                 addLog(`Removed due date`);
            }
        }
        // Deadline
        if (t.deadline !== updatedTask.deadline) {
            if (updatedTask.deadline) {
                 const dateStr = new Date(updatedTask.deadline).toLocaleDateString();
                 addLog(t.deadline ? `Changed deadline to ${dateStr}` : `Set deadline to ${dateStr}`);
            } else {
                 addLog(`Removed deadline`);
            }
        }
        // Priority
        if (t.priority !== updatedTask.priority) {
            addLog(`Changed priority from ${t.priority} to ${updatedTask.priority}`);
        }
        // List
        if (t.listId !== updatedTask.listId) {
            const oldList = lists.find(l => l.id === t.listId)?.name || 'Inbox';
            const newList = lists.find(l => l.id === updatedTask.listId)?.name || 'Inbox';
            addLog(`Moved from ${oldList} to ${newList}`);
        }
        // Estimate
        if (t.estimate !== updatedTask.estimate) {
            if (updatedTask.estimate) addLog(`Set estimate to ${updatedTask.estimate}`);
            else addLog(`Removed estimate`);
        }
        // Actual Time
        if (t.actualTime !== updatedTask.actualTime) {
            if (updatedTask.actualTime) addLog(`Logged actual time: ${updatedTask.actualTime}`);
            else addLog(`Removed actual time log`);
        }
        
        // Diff Labels
        const oldLabels = t.labelIds || [];
        const newLabels = updatedTask.labelIds || [];
        if (JSON.stringify(oldLabels.sort()) !== JSON.stringify(newLabels.sort())) {
            const added = newLabels.filter(id => !oldLabels.includes(id));
            const removed = oldLabels.filter(id => !newLabels.includes(id));
            added.forEach(id => addLog(`Added label "${labels.find(l => l.id === id)?.name || 'Unknown'}"`));
            removed.forEach(id => addLog(`Removed label "${labels.find(l => l.id === id)?.name || 'Unknown'}"`));
        }

        // Diff Attachments
        const oldAttachments = t.attachments || [];
        const newAttachments = updatedTask.attachments || [];
        if (oldAttachments.length !== newAttachments.length) {
             const added = newAttachments.filter(a => !oldAttachments.some(oa => oa.id === a.id));
             const removed = oldAttachments.filter(a => !newAttachments.some(na => na.id === a.id));
             added.forEach(a => addLog(`Added attachment "${a.name}"`));
             removed.forEach(a => addLog(`Removed attachment "${a.name}"`));
        }

        // Subtasks Detailed Diff
        const oldSubtasks = t.subtasks;
        const newSubtasks = updatedTask.subtasks;
        const oldSubtasksMap = new Map(oldSubtasks.map(s => [s.id, s]));
        const newSubtasksMap = new Map(newSubtasks.map(s => [s.id, s]));

        // Check for added and modified subtasks
        newSubtasks.forEach(ns => {
            if (!oldSubtasksMap.has(ns.id)) {
                addLog(`Added subtask: "${ns.title}"`);
            } else {
                const os = oldSubtasksMap.get(ns.id)!;
                // Completion status
                if (os.completed !== ns.completed) {
                     addLog(`${ns.completed ? 'Completed' : 'Uncompleted'} subtask: "${ns.title}"`);
                }
                // Title change
                if (os.title !== ns.title) {
                    addLog(`Renamed subtask to "${ns.title}"`);
                }
                // Due Date change
                if (os.dueDate !== ns.dueDate) {
                     if (ns.dueDate && !os.dueDate) addLog(`Set due date for subtask "${ns.title}"`);
                     else if (!ns.dueDate && os.dueDate) addLog(`Removed due date from subtask "${ns.title}"`);
                     else if (ns.dueDate && os.dueDate) addLog(`Rescheduled subtask "${ns.title}"`);
                }
            }
        });

        // Check for removed subtasks
        oldSubtasks.forEach(os => {
            if (!newSubtasksMap.has(os.id)) {
                addLog(`Deleted subtask: "${os.title}"`);
            }
        });

        // Log Merging Logic
        // Filter out generic 'Updated task details' logs generated by TaskDetailModal in favor of our specific logs
        const previousLogIds = new Set(t.logs.map(l => l.id));
        const logsFromModal = updatedTask.logs.filter(l => !previousLogIds.has(l.id));
        
        // Filter out "Updated task details" from the new logs coming from modal
        const meaningfulLogsFromModal = logsFromModal.filter(l => l.message !== 'Updated task details');

        // Combine: Old Logs + Meaningful Modal Logs + New Specific Logs
        const finalLogs = [...t.logs, ...meaningfulLogsFromModal, ...newLogs];

        return { ...updatedTask, logs: finalLogs };
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSelectedTask(null);
  };

  // Lists & Labels Handlers
  const handleAddList = (name: string, color: string, icon: string) => {
    setLists(prev => [...prev, { id: crypto.randomUUID(), name, color, icon }]);
  };

  const handleUpdateList = (id: string, updates: Partial<TaskList>) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleDeleteList = (id: string) => {
    setLists(prev => prev.filter(l => l.id !== id));
    // Move tasks from deleted list to inbox
    setTasks(prev => prev.map(t => t.listId === id ? { ...t, listId: 'inbox' } : t));
    if (activeView === id) setActiveView('inbox');
  };

  const handleAddLabel = (name: string, color: string) => {
    setLabels(prev => [...prev, { id: crypto.randomUUID(), name, color }]);
  };

  const handleUpdateLabel = (id: string, updates: Partial<Label>) => {
    setLabels(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleDeleteLabel = (id: string) => {
    setLabels(prev => prev.filter(l => l.id !== id));
    // Also remove label from tasks
    setTasks(prev => prev.map(t => ({ ...t, labelIds: t.labelIds.filter(lid => lid !== id) })));
    if (activeView === id) setActiveView('inbox');
  };

  // Counts
  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Inbox count
    counts['inbox'] = tasks.filter(t => t.listId === 'inbox' && !t.completed).length;
    
    // Today count
    counts['today'] = tasks.filter(t => isToday(t.dueDate) && !t.completed).length;
    
    // Lists counts
    lists.forEach(list => {
      counts[list.id] = tasks.filter(t => t.listId === list.id && !t.completed).length;
    });
    
    // Labels counts
    labels.forEach(label => {
      counts[label.id] = tasks.filter(t => t.labelIds?.includes(label.id) && !t.completed).length;
    });

    return counts;
  }, [tasks, lists, labels]);

  // Derived State for Views
  const filteredTasks = useMemo<Task[]>(() => {
    if (activeView === 'activity') return [];

    let filtered: Task[] = tasks;

    if (activeView === 'search') {
        // Global Search Logic
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            filtered = filtered.filter(t => 
                t.title.toLowerCase().includes(lowerQ) || 
                t.description?.toLowerCase().includes(lowerQ)
            );
        } else {
            // If no query, maybe return nothing or all? Returning all for now, but visually implied search is active.
            // Or stay empty to encourage typing.
        }
    } else {
        // Standard View Filtering
        
        // Check if activeView is a label ID
        const isLabelView = labels.some(l => l.id === activeView);

        if (isLabelView) {
        filtered = filtered.filter(t => t.labelIds?.includes(activeView) && !t.completed);
        } else {
        switch (activeView) {
            case 'inbox':
            filtered = filtered.filter(t => t.listId === 'inbox' && !t.completed);
            break;
            case 'today':
            filtered = filtered.filter(t => isToday(t.dueDate) && !t.completed);
            break;
            case 'next7':
            filtered = filtered.filter(t => isNext7Days(t.dueDate) && !t.completed);
            break;
            case 'upcoming':
            filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate) > new Date() && !t.completed);
            break;
            case 'all':
            break;
            default:
            // Custom List View
            filtered = filtered.filter(t => t.listId === activeView && !t.completed);
        }
        }
    }

    // Sorting Logic
    const prioOrder = { [Priority.High]: 3, [Priority.Medium]: 2, [Priority.Low]: 1, [Priority.None]: 0 };

    // Use a copy to sort to avoid mutating state reference, and add explicit types to callback arguments
    return [...filtered].sort((a: Task, b: Task) => {
      // Always put completed tasks at the bottom if the view shows them (mostly handled by filtering, but good for 'all' view completeness)
      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      switch (sortBy) {
        case 'dueDate':
          // Earliest due date first
          if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          // Items with due date come before items without
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return 0;
        
        case 'priority':
          // High to Low
          if (prioOrder[b.priority] !== prioOrder[a.priority]) {
            return prioOrder[b.priority] - prioOrder[a.priority];
          }
          return 0;
        
        case 'added':
          // Newest first
          return b.createdAt - a.createdAt;

        case 'alphabetical':
          // A-Z
          return a.title.localeCompare(b.title);

        case 'smart':
        default:
          // 1. Priority
          if (prioOrder[b.priority] !== prioOrder[a.priority]) {
            return prioOrder[b.priority] - prioOrder[a.priority];
          }
          // 2. Due Date (Earliest first)
          if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return 0;
      }
    });
  }, [tasks, activeView, labels, searchQuery, sortBy]);

  // Activity View Data Aggregation
  const groupedActivityLogs = useMemo(() => {
    type ActivityLogItem = TaskLog & { taskTitle: string; taskColor?: string; taskId: string };

    if (activeView !== 'activity') return {} as Record<string, ActivityLogItem[]>;

    const allLogs: ActivityLogItem[] = tasks.flatMap(task => 
      task.logs.map(log => ({
        ...log,
        taskTitle: task.title,
        taskColor: task.color,
        taskId: task.id
      }))
    ).sort((a, b) => b.timestamp - a.timestamp);

    const groups: Record<string, ActivityLogItem[]> = {};

    allLogs.forEach(log => {
      const date = new Date(log.timestamp);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let groupKey = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(log);
    });

    return groups;
  }, [tasks, activeView]);

  const viewTitle = useMemo(() => {
    if (activeView === 'inbox') return 'Inbox';
    if (activeView === 'today') return 'Today';
    if (activeView === 'next7') return 'Next 7 Days';
    if (activeView === 'upcoming') return 'Upcoming';
    if (activeView === 'all') return 'All Tasks';
    if (activeView === 'activity') return 'Activity Log';
    if (activeView === 'search') return 'Search Results';
    
    const list = lists.find(l => l.id === activeView);
    if (list) return list.name;
    
    const label = labels.find(l => l.id === activeView);
    if (label) return label.name;
    
    return 'Tasks';
  }, [activeView, lists, labels]);

  const SortMenuItem = ({ option, label }: { option: SortOption, label: string }) => (
    <button 
      onClick={() => { setSortBy(option); setShowSortMenu(false); }}
      className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors ${sortBy === option ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'}`}
    >
      <span>{label}</span>
      {sortBy === option && <Check className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-72 p-4 h-full">
        <Sidebar 
          lists={lists}
          labels={labels}
          activeView={activeView} 
          onChangeView={setActiveView} 
          onAddList={handleAddList}
          onUpdateList={handleUpdateList}
          onDeleteList={handleDeleteList}
          onAddLabel={handleAddLabel}
          onUpdateLabel={handleUpdateLabel}
          onDeleteLabel={handleDeleteLabel}
          taskCounts={taskCounts}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-background z-50 md:hidden"
            >
              <Sidebar 
                lists={lists}
                labels={labels}
                activeView={activeView} 
                onChangeView={(v) => { setActiveView(v); setIsMobileSidebarOpen(false); }} 
                onAddList={handleAddList}
                onUpdateList={handleUpdateList}
                onDeleteList={handleDeleteList}
                onAddLabel={handleAddLabel}
                onUpdateLabel={handleUpdateLabel}
                onDeleteLabel={handleDeleteLabel}
                taskCounts={taskCounts}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 md:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-secondary rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div>
                <motion.h2 
                  key={viewTitle}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold tracking-tight"
                >
                  {viewTitle}
                </motion.h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {activeView === 'activity' 
                      ? 'Track history across all tasks' 
                      : activeView === 'search'
                        ? `Found ${filteredTasks.length} tasks`
                        : `${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`
                    }
                </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Sort Control */}
            <div className="relative" ref={sortMenuRef}>
                <button 
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className={`p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ${showSortMenu ? 'bg-secondary text-foreground' : ''}`}
                    title="Sort tasks"
                >
                    <ArrowUpDown className="w-5 h-5" />
                </button>
                <AnimatePresence>
                    {showSortMenu && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute top-full right-0 mt-2 w-48 bg-popover border border-border rounded-xl shadow-xl p-1.5 z-50"
                        >
                            <div className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">Sort By</div>
                            <SortMenuItem option="smart" label="Smart (Default)" />
                            <SortMenuItem option="priority" label="Priority" />
                            <SortMenuItem option="dueDate" label="Due Date" />
                            <SortMenuItem option="added" label="Date Added" />
                            <SortMenuItem option="alphabetical" label="Alphabetical" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="relative hidden sm:block group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="Search everywhere..."
                value={searchQuery}
                onChange={(e) => {
                    const q = e.target.value;
                    setSearchQuery(q);
                    if (q && activeView !== 'search') {
                        setActiveView('search');
                    }
                }}
                className="pl-9 pr-4 py-2 bg-secondary/50 border border-transparent rounded-xl text-sm focus:bg-background focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all w-64"
              />
            </div>
            
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium shadow-lg shadow-purple-500/20">
                <User className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-2 custom-scrollbar relative">
          
          {activeView === 'activity' ? (
             /* Activity Log View */
             <div className="max-w-3xl mx-auto pb-20">
                 {Object.keys(groupedActivityLogs).length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                         <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                             <Activity className="w-8 h-8 opacity-50" />
                         </div>
                         <p>No activity recorded yet.</p>
                     </div>
                 ) : (
                     <div className="space-y-8 relative">
                         {/* Vertical Timeline Line */}
                         <div className="absolute left-7 top-4 bottom-0 w-px bg-border/50" />
                         
                         {Object.entries(groupedActivityLogs).map(([dateGroup, logs]) => (
                             <div key={dateGroup} className="relative">
                                 <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 mb-4 flex items-center gap-4">
                                     <div className="w-14 text-right text-xs font-bold text-primary uppercase tracking-wider shrink-0">
                                         {dateGroup}
                                     </div>
                                     <div className="h-px flex-1 bg-border/50" />
                                 </div>
                                 
                                 <div className="space-y-6">
                                     {logs.map(log => (
                                         <motion.div 
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            key={log.id} 
                                            className="flex gap-6 relative group"
                                         >
                                             <div className="w-14 text-right text-[10px] text-muted-foreground pt-1 font-mono shrink-0">
                                                 {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                             </div>
                                             
                                             {/* Timeline Node */}
                                             <div className="absolute left-[3.25rem] top-1.5 z-10">
                                                 <div className="w-3 h-3 rounded-full border-2 border-background ring-2 ring-secondary bg-muted-foreground/30 group-hover:bg-primary group-hover:ring-primary/30 transition-all" />
                                             </div>

                                             <div className="flex-1 bg-card/50 hover:bg-card border border-transparent hover:border-border rounded-xl p-3 transition-all">
                                                 <div className="flex items-center justify-between mb-1">
                                                     <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                                         <span className="text-muted-foreground font-normal">Task:</span> 
                                                         {log.taskTitle}
                                                     </h4>
                                                 </div>
                                                 <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                     {log.message.toLowerCase().includes('completed') && !log.message.toLowerCase().includes('uncompleted') ? (
                                                         <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                     ) : (
                                                         <Circle className="w-2 h-2 fill-current opacity-50" />
                                                     )}
                                                     {log.message}
                                                 </p>
                                             </div>
                                         </motion.div>
                                     ))}
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
          ) : (
            /* Standard Task List View */
            <div className="max-w-3xl mx-auto pb-20 space-y-6">
                {/* Smart Input Area */}
                <div className="mb-8 sticky top-0 z-20 pt-2 pb-4 bg-gradient-to-b from-background via-background to-transparent">
                    <SmartInput onAddTask={handleAddTask} />
                </div>

                <AnimatePresence mode="popLayout">
                {filteredTasks.length > 0 ? (
                    filteredTasks.map(task => (
                    <TaskItem 
                        key={task.id} 
                        task={task} 
                        allLabels={labels}
                        onToggle={handleToggleTask} 
                        onSelect={setSelectedTask}
                    />
                    ))
                ) : (
                    <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20"
                    >
                    {activeView === 'search' ? (
                         <>
                             <div className="w-24 h-24 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-10 h-10 opacity-50" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No results found</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
                                Try searching for something else.
                            </p>
                         </>
                    ) : (
                        <>
                            <div className="w-24 h-24 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <div className="text-4xl opacity-50">✨</div>
                            </div>
                            <h3 className="text-lg font-medium text-foreground">All caught up!</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
                                You have no tasks for this view. Enjoy your day or add a new task above.
                            </p>
                        </>
                    )}
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            labels={labels}
            lists={lists}
            onAddLabel={handleAddLabel}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            onSave={(updated) => {
                handleUpdateTask(updated);
            }}
            onDelete={handleDeleteTask}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
    