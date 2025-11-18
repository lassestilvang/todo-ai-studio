
export enum Priority {
  None = 'None',
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export enum Recurrence {
  None = 'None',
  Daily = 'Daily',
  Weekdays = 'Weekdays',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Yearly = 'Yearly',
  Custom = 'Custom',
}

export type RecurrenceUnit = 'days' | 'weeks' | 'months' | 'years';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string; // ISO String
}

export interface TaskLog {
  id: string;
  timestamp: number;
  message: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Reminder {
  id: string;
  time: string; // ISO String
  fired: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'link';
  url: string;
  mimeType?: string;
  size?: number;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string; // ISO String
  deadline?: string; // ISO String
  reminders: Reminder[];
  estimate?: string; // HH:mm
  actualTime?: string; // HH:mm
  priority: Priority;
  subtasks: SubTask[];
  recurrence: Recurrence;
  recurrenceCustom?: {
    amount: number;
    unit: RecurrenceUnit;
  };
  labelIds: string[];
  attachments: Attachment[];
  color?: string; // Custom task color
  logs: TaskLog[];
  createdAt: number;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault?: boolean;
}

export type ViewType = 'inbox' | 'today' | 'upcoming' | 'next7' | 'all' | 'completed' | string; // string for custom list IDs or Label IDs

export interface AISuggestedTask {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: Priority;
  estimate?: string;
}
