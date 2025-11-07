-- Migration: Enable Realtime for chat_messages
-- Enables real-time subscriptions for live chat functionality

-- Enable realtime for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

