/**
 * Events service - CRUD operations for events table
 */

import { supabase } from "./supabase";
import type { CreateEventInput, UpdateEventInput } from "../types/database";

/**
 * Fetch all events, ordered by date (ascending)
 */
export async function getEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  return { data, error };
}

/**
 * Fetch a single event by ID
 */
export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  return { data, error };
}

/**
 * Create a new event
 */
export async function createEvent(input: CreateEventInput) {
  const { data, error } = await supabase
    .from("events")
    .insert([input])
    .select()
    .single();

  return { data, error };
}

/**
 * Update an existing event
 */
export async function updateEvent(id: string, input: UpdateEventInput) {
  const { data, error } = await supabase
    .from("events")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete an event (cascades to associated messages)
 */
export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  return { error };
}

