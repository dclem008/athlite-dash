import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { GetTemplatesResponse } from '@athlite-dash/types';

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('sport_templates')
      .select(`
        id, name, 
        metric_definitions (id, template_id, key, name, type, category, is_required, options)
      `);

    if (error) throw error;

    const response: GetTemplatesResponse = { data: data as any };
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Database Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};