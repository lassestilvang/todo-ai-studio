import React, { useState } from 'react';
import { 
  Calendar, 
  Inbox, 
  CalendarDays, 
  Layers, 
  CheckCircle2, 
  List, 
  Plus,
  Tag,
  MoreHorizontal,
  Edit2,
  Trash2,
  Settings,
  Zap,
  History
} from 'lucide-react';
import { TaskList, ViewType, Label } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  lists: TaskList[];
  labels: Label[];
  activeView: ViewType;
  onChangeView: (view: ViewType) => void;
  onAddList: (name: string, color: string, icon: string) => void;
  onUpdateList: (id: string, updates: Partial<TaskList>) => void;
  onDeleteList: (id: string) => void;
  onAddLabel: (name: string, color: string) => void;
  onUpdateLabel: (id: string, updates: Partial<Label>) => void;
  onDeleteLabel: (id: string) => void;
  taskCounts: Record<string, number>;
}

const LABEL_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

export const Sidebar: React.FC<SidebarProps> = ({ 
  lists, 
  labels,
  activeView, 
  onChangeView, 
  onAddList,
  onUpdateList,
  onDeleteList,
  onAddLabel,
  onUpdateLabel,
  onDeleteLabel,
  taskCounts
}) => {
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

  const navItemClass = (view: ViewType) => `
    relative flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group outline-none
    ${activeView === view 
      ? 'text-primary' 
      : 'text-muted-foreground hover:text-foreground'
    }
  `;

  const NavItem = ({ view, icon: Icon, label, count, color }: { view: ViewType, icon: any, label: string, count?: number, color?: string }) => (
    <button onClick={() => onChangeView(view)} className={navItemClass(view)}>
      {activeView === view && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 bg-primary/10 rounded-xl"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <div className="relative flex items-center gap-3 z-10">
        <Icon className={`w-4 h-4 ${activeView === view ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} style={{ color: activeView === view ? color : undefined }} />
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span className="relative z-10 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-semibold group-hover:bg-background transition-colors">
          {count}
        </span>
      )}
    </button>
  );

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      onAddList(newListName, '#8b5cf6', '📋');
      setNewListName('');
      setIsCreatingList(false);
    }
  };

  const handleCreateLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabelName.trim()) {
      onAddLabel(newLabelName, LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)]);
      setNewLabelName('');
      setIsCreatingLabel(false);
    }
  };

  return (
    <div className="h-full w-full glass-card flex flex-col border-r border-white/10">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground tracking-tight">ZenTask</h1>
        </div>

        <nav className="space-y-1">
          <NavItem view="inbox" icon={Inbox} label="Inbox" count={taskCounts['inbox']} />
          <NavItem view="today" icon={Calendar} label="Today" count={taskCounts['today']} />
          <NavItem view="next7" icon={CalendarDays} label="Next 7 Days" />
          <NavItem view="upcoming" icon={Layers} label="Upcoming" />
          <NavItem view="all" icon={List} label="All Tasks" />
          <NavItem view="activity" icon={History} label="Activity Log" />
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-8">
        
        {/* LISTS SECTION */}
        <div>
            <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">
                My Lists
            </h3>
            <button 
                onClick={() => setIsCreatingList(true)}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-1 rounded-md transition-colors"
            >
                <Plus className="w-3.5 h-3.5" />
            </button>
            </div>

            <nav className="space-y-1">
            {lists.map(list => (
                <button 
                key={list.id} 
                onClick={() => onChangeView(list.id)} 
                className={navItemClass(list.id)}
                >
                {activeView === list.id && (
                    <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    />
                )}
                <div className="relative flex items-center gap-3 z-10">
                    <span className="text-sm filter drop-shadow-sm">{list.icon}</span>
                    <span className="truncate">{list.name}</span>
                </div>
                {taskCounts[list.id] ? (
                    <span className="relative z-10 text-xs text-muted-foreground font-medium">
                    {taskCounts[list.id]}
                </span>
                ) : null}
                </button>
            ))}

            {isCreatingList && (
                <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleCreateList} 
                className="pt-1"
                >
                <input
                    autoFocus
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="List name..."
                    className="w-full bg-secondary/50 border border-transparent rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background transition-all placeholder:text-muted-foreground"
                    onBlur={() => !newListName && setIsCreatingList(false)}
                />
                </motion.form>
            )}
            </nav>
        </div>

        {/* LABELS SECTION */}
        <div>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">
                    Labels
                </h3>
                <button 
                    onClick={() => setIsCreatingLabel(true)}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-1 rounded-md transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>
            
            <nav className="space-y-1">
                {labels.map(label => (
                    <div key={label.id} className="relative group/item">
                         {editingLabelId === label.id ? (
                             <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setEditingLabelId(null);
                                }}
                                className="px-2 py-1 flex items-center gap-2 bg-secondary/50 rounded-lg"
                             >
                                 <input
                                    type="color"
                                    value={label.color}
                                    onChange={(e) => onUpdateLabel(label.id, { color: e.target.value })}
                                    className="w-4 h-4 rounded cursor-pointer bg-transparent border-none p-0"
                                 />
                                 <input 
                                    autoFocus
                                    className="bg-transparent text-sm w-full focus:outline-none"
                                    value={label.name}
                                    onChange={(e) => onUpdateLabel(label.id, { name: e.target.value })}
                                    onBlur={() => setEditingLabelId(null)}
                                 />
                             </form>
                         ) : (
                            <button 
                                onClick={() => onChangeView(label.id)} 
                                className={navItemClass(label.id)}
                            >
                                {activeView === label.id && (
                                    <motion.div
                                    layoutId="activeNav"
                                    className="absolute inset-0 bg-primary/10 rounded-xl"
                                    />
                                )}
                                <div className="relative flex items-center gap-3 z-10 w-full">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                                    <span className="truncate flex-1 text-left">{label.name}</span>
                                </div>
                                
                                {/* Label Actions */}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity z-20">
                                    {taskCounts[label.id] > 0 && (
                                        <span className="text-xs text-muted-foreground font-medium mr-1">
                                            {taskCounts[label.id]}
                                        </span>
                                    )}
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); setEditingLabelId(label.id); }}
                                        className="p-1 hover:bg-background/80 rounded text-muted-foreground hover:text-primary cursor-pointer"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </div>
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); onDeleteLabel(label.id); }}
                                        className="p-1 hover:bg-background/80 rounded text-muted-foreground hover:text-destructive cursor-pointer"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </div>
                                </div>
                            </button>
                         )}
                    </div>
                ))}

                {isCreatingLabel && (
                    <motion.form 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleCreateLabel} 
                    className="pt-1"
                    >
                    <input
                        autoFocus
                        type="text"
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        placeholder="Label name..."
                        className="w-full bg-secondary/50 border border-transparent rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background transition-all placeholder:text-muted-foreground"
                        onBlur={() => !newLabelName && setIsCreatingLabel(false)}
                    />
                    </motion.form>
                )}
            </nav>
        </div>
      </div>
      
      <div className="p-4 border-t border-border/50">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/10 mb-2">
           <div className="flex items-center gap-2 text-xs font-medium text-primary mb-1">
              <Zap className="w-3 h-3 fill-primary" />
              <span>Pro Tip</span>
           </div>
           <p className="text-[10px] text-muted-foreground leading-relaxed">
              Use labels to organize tasks across different lists.
           </p>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2 mt-4">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                  <Settings className="w-3 h-3" />
               </div>
               <span>Settings</span>
            </div>
            <span>v1.1</span>
        </div>
      </div>
    </div>
  );
};