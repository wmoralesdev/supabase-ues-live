/**
 * Database type definitions for Events and Chat Messages
 */

export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string; // ISO 8601 timestamp string
  location: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface CreateEventInput {
  title: string;
  description?: string | null;
  date: string; // ISO 8601 timestamp string
  location: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string | null;
  date?: string; // ISO 8601 timestamp string
  location?: string;
}

export interface CreateMessageInput {
  event_id: string;
  user_id: string;
  content: string;
}

