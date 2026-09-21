import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CreateGoalRequest, GetGoalsResponse } from '@athlite-dash/types';

export const createGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const goalData = req.body as CreateGoalRequest;
    const verifiedUserId = (req as any).user.id;

    const { data, error } = await supabase
      .from('goals')
      .insert([{
        user_id: verifiedUserId,
        template_id: goalData.template_id,
        metric_key: goalData.metric_key,
        target_value: goalData.target_value,
        deadline: goalData.deadline,
      }])
      .select();

    if (error) throw error;
    res.status(201).json({ message: 'Goal created successfully!', goal: data[0] });
  } catch (error: any) {
    console.error('Goal Insert Error:', error.message);
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

export const getGoals = async (req: Request, res: Response): Promise<void> => {
  try {
    const verifiedUserId = (req as any).user.id;
    const { templateId } = req.params;

    const { data, error } = await supabase
      .from('goals')
      .select('id, template_id, metric_key, target_value, deadline')
      .eq('user_id', verifiedUserId)
      .eq('template_id', templateId);

    if (error) throw error;

    const response: GetGoalsResponse = { data: data as any };
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Goal Fetch Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};