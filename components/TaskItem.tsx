
import React, { useMemo } from 'react';
import { Check, Calendar, Flag, Clock, Bell, Repeat, AlertCircle, Siren, Timer } from 'lucide-react';
import { Task, Priority, Label, Recurrence } from '../types';
import { motion } from 'framer-motion';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onSelect: (task: Task) => void;
  allLabels?: Label[];
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onSelect, allLabels = [] }) => {
  const isOverdue = useMemo(() => {
    if (!task.dueDate || task.completed) return false;
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Check if due date is strictly before today (ignoring time for "Today" tasks)
    return due < today;
  }, [task.dueDate, task.completed]);
  
  const priorityColors = {
    [Priority.High]: 'text-red-500 bg-red-500/10 border-red-500/20',
    [Priority.Medium]: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    [Priority.Low]: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    [Priority.None]: 'hidden',
  };

  const taskLabels = task.labelIds ? task.labelIds.map(id => allLabels.find(l => l.id === id)).filter(Boolean) as Label[] : [];
  
  // Calculate if there are active reminders
  const hasActiveReminders = task.reminders && task.reminders.length > 0 && task.reminders.some(r => !r.fired);
  const isRecurring = task.recurrence && task.recurrence !== Recurrence.None;

  // Determine border/bg color based on Task Color property
  const customColorStyle = task.color 
    ? { borderColor: `${task.color}40`, backgroundColor: `${task.color}05` } 
    : {};

  const leftStripColor = task.color 
    ? task.color 
    : task.priority !== Priority.None 
      ? priorityColors[task.priority].split(' ')[0].replace('text-', 'bg-') // simplistic extraction 
      : 'transparent';

  // Fix for extracting bg color properly from tailwind class string
  const getPriorityColorHex = (p: Priority) => {
      if (p === Priority.High) return '#ef4444';
      if (p === Priority.Medium) return '#f97316';
      if (p === Priority.Low) return '#3b82f6';
      return 'transparent';
  };
  const stripColor = task.color || (task.priority !== Priority.None ? getPriorityColorHex(task.priority) : 'transparent');

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onClick={() => onSelect(task)}
      className={`
        group flex items-start gap-4 p-4 rounded-2xl border mb-3 cursor-pointer relative overflow-hidden transition-colors
        ${task.completed 
          ? 'bg-secondary/30 border-transparent opacity-60' 
          : isOverdue
            ? 'bg-red-500/5 border-red-500/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.1)]'
            : 'glass-card hover:shadow-lg hover:shadow-primary/5 border-border/50'
        }
      `}
      style={!task.completed && !isOverdue ? customColorStyle : undefined}
    >
      {/* Priority/Color Indicator Strip */}
      {!task.completed && (
        <div 
            className="absolute left-0 top-0 bottom-0 w-1 opacity-60" 
            style={{ backgroundColor: isOverdue ? '#ef4444' : stripColor }}
        />
      )}

      <div className="relative flex items-center justify-center mt-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
            ${task.completed 
              ? 'bg-primary border-primary scale-110' 
              : isOverdue
                ? 'border-red-500/50 hover:border-red-500 bg-red-500/10'
                : 'border-muted-foreground/30 hover:border-primary bg-background'
            }
          `}
          style={!task.completed && !isOverdue && task.color ? { borderColor: task.color } : undefined}
        >
          <motion.div
            initial={false}
            animate={{ scale: task.completed ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
             {task.completed ? (
                 <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
             ) : (
                 null
             )}
          </motion.div>
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-base font-medium truncate transition-all ${task.completed ? 'text-muted-foreground line-through decoration-2 decoration-border' : isOverdue ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
            {task.title}
          </h4>
          
          <div className="flex items-center gap-1.5">
             {isOverdue && !task.completed && (
                 <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                    <AlertCircle className="w-3 h-3" /> Overdue
                 </span>
             )}
             {isRecurring && !task.completed && (
                 <Repeat className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
             )}
             {hasActiveReminders && !task.completed && (
                 <Bell className="w-3.5 h-3.5 text-primary/70 fill-primary/20 shrink-0 mt-1" />
             )}
          </div>
        </div>
        
        {task.description && !task.completed && (
          <p className="text-sm text-muted-foreground/80 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-3">
           {task.priority !== Priority.None && (
             <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${priorityColors[task.priority]}`}>
               {task.priority}
             </span>
           )}

           {/* Label Chips */}
           {taskLabels.map(label => (
             <span 
                key={label.id}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1"
                style={{ 
                    backgroundColor: `${label.color}15`, 
                    color: label.color,
                    borderColor: `${label.color}30`
                }}
             >
                 <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: label.color }} />
                 {label.name}
             </span>
           ))}

          {task.dueDate && (
            <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}
          
          {task.deadline && (
             <div className="flex items-center gap-1.5 text-xs text-red-500/80 font-medium" title="Deadline">
               <Siren className="w-3.5 h-3.5" />
               <span>
                 {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
               </span>
             </div>
          )}
          
          {task.estimate && (
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{task.estimate}</span>
             </div>
          )}
          
          {task.actualTime && (
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title="Actual time spent">
                <Timer className="w-3.5 h-3.5" />
                <span>{task.actualTime}</span>
             </div>
          )}

          {task.subtasks.length > 0 && (
            <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">
                {task.subtasks.filter(t => t.completed).length}/{task.subtasks.length} subtasks
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
    