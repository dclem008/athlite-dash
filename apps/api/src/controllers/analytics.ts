import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { GetAnalyticsResponse } from '@athlite-dash/types';

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const verifiedUserId = (req as any).user.id;
    const { templateId } = req.params;
    const targetAthleteId = req.query.athlete_id as string; // NEW: Optional query param

    if (!templateId) {
      res.status(400).json({ error: 'Template ID is required' });
      return;
    }

    let queryUserId = verifiedUserId; // Default to the logged-in user

    // --- RBAC SECURITY CHECK ---
    // If they are asking for someone else's data, prove they are the coach
    if (targetAthleteId && targetAthleteId !== verifiedUserId) {
      const { data: relationship, error: relError } = await supabase
        .from('coach_athletes')
        .select('coach_id')
        .eq('coach_id', verifiedUserId)
        .eq('athlete_id', targetAthleteId)
        .single();
      
      if (relError || !relationship) {
        res.status(403).json({ error: 'Forbidden: You are not authorized to view this athlete.' });
        return;
      }
      queryUserId = targetAthleteId; // Security passed. Allow the query change.
    }

    const { data, error } = await supabase
      .from('events')
      .select('id, recorded_at, payload')
      .eq('user_id', queryUserId)
      .eq('template_id', templateId)
      .order('recorded_at', { ascending: true });

    if (error) throw error;
    res.status(200).json({ data: data as any });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};