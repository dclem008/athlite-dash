import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { UserProfile, GetAthletesResponse } from '@athlite-dash/types';

// Get the current logged-in user's profile (Role & Name)
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const verifiedUserId = (req as any).user.id;
    
    const { data, error } = await supabase
      .from('users')
      .select('id, role, first_name, last_name')
      .eq('id', verifiedUserId)
      .single();

    if (error || !data) throw new Error('User not found');

    res.status(200).json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// If the user is a coach, get all athletes assigned to them
export const getMyAthletes = async (req: Request, res: Response): Promise<void> => {
  try {
    const verifiedUserId = (req as any).user.id;

    // We use a database JOIN to get the athlete profiles through the junction table
    const { data, error } = await supabase
      .from('coach_athletes')
      .select(`
        athlete:users!coach_athletes_athlete_id_fkey (
          id, role, first_name, last_name
        )
      `)
      .eq('coach_id', verifiedUserId);

    if (error) throw error;

    // Flatten the joined data structure to match our TypeScript contract
    const athletes = data.map((row: any) => row.athlete) as UserProfile[];

    res.status(200).json({ data: athletes });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch athletes' });
  }
};