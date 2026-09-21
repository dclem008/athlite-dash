import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CreateEventRequest } from '@athlite-dash/types';

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventData = req.body as CreateEventRequest;
    const verifiedUserId = (req as any).user.id;

    // --- NEW: Strict Date Validation ---
    const eventDate = new Date(eventData.recorded_at);
    const now = new Date();

    if (eventDate > now) {
      res.status(400).json({ error: 'Cannot log events in the future.' });
      return;
    }
    // -----------------------------------

    const { data, error } = await supabase
      .from('events')
      .insert([{
        user_id: verifiedUserId,
        template_id: eventData.template_id,
        type: eventData.type,
        recorded_at: eventData.recorded_at,
        payload: eventData.payload,
      }])
      .select();

    if (error) throw error;

    res.status(201).json({ message: 'Workout logged successfully!', event: data[0] });
  } catch (error: any) {
    console.error('Insert Error:', error.message);
    res.status(500).json({ error: 'Failed to log workout' });
  }
};