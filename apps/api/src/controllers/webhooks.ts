import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { HealthWebhookPayload } from '@athlite-dash/types';

export const handleHealthWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Security Check: Verify the secret header
    const incomingSecret = req.headers['x-webhook-secret'];
    if (incomingSecret !== process.env.WEBHOOK_SECRET) {
      res.status(401).json({ error: 'Unauthorized webhook attempt' });
      return;
    }

    const payload = req.body as HealthWebhookPayload;

    // 2. Look up the 'Daily Health' template ID dynamically
    const { data: templateData, error: templateError } = await supabase
      .from('sport_templates')
      .select('id')
      .eq('name', 'Daily Health')
      .single();

    if (templateError || !templateData) {
      throw new Error('Daily Health template not found in database');
    }

    // 3. Insert the normalized data into the dynamic events table
    const { error: insertError } = await supabase
      .from('events')
      .insert([{
        user_id: payload.user_id,
        template_id: templateData.id,
        type: 'health_log',
        recorded_at: payload.timestamp,
        payload: payload.metrics, // Inject the HRV/Sleep data directly into the JSONB column
      }]);

    if (insertError) throw insertError;

    res.status(200).json({ message: 'Health data successfully logged via webhook' });
  } catch (error: any) {
    console.error('Webhook Error:', error.message);
    res.status(500).json({ error: 'Internal Webhook Error' });
  }
};