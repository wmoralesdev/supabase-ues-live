/**
 * Messages service - CRUD operations for chat_messages table
 */

import { supabase } from "./supabase";
import type { ChatMessage, CreateMessageInput } from "../types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Fetch all messages for a specific event, ordered by creation time (ascending)
 */
export async function getMessagesByEvent(eventId: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  return { data, error };
}

/**
 * Create a new chat message
 */
export async function createMessage(input: CreateMessageInput) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([input])
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a chat message
 */
export async function deleteMessage(id: string) {
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("id", id);

  return { error };
}

/**
 * Subscribe to realtime updates for messages in a specific event
 * @param eventId - The event ID to subscribe to
 * @param callback - Function called when new messages are received
 * @returns RealtimeChannel that can be used to unsubscribe
 */
export function subscribeToMessages(
  eventId: string,
  callback: (message: ChatMessage) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`messages:${eventId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        callback(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to presence updates for users in a specific event
 * @param eventId - The event ID to subscribe to
 * @param userId - The current user's ID
 * @param onPresenceChange - Callback called when presence state changes
 * @returns RealtimeChannel that can be used to unsubscribe
 */
export function subscribeToPresence(
  eventId: string,
  userId: string,
  onPresenceChange: (count: number) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`presence:${eventId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    })
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const count = Object.keys(state).length;
      onPresenceChange(count);
    })
    .on("presence", { event: "join" }, () => {
      const state = channel.presenceState();
      const count = Object.keys(state).length;
      onPresenceChange(count);
    })
    .on("presence", { event: "leave" }, () => {
      const state = channel.presenceState();
      const count = Object.keys(state).length;
      onPresenceChange(count);
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
        });
      }
    });

  return channel;
}

