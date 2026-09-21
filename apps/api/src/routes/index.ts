import { getAnalytics } from '../controllers/analytics';
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getTemplates } from '../controllers/templates';
import { createEvent } from '../controllers/events';
import { AthleteHealthCheckResponse } from '@athlite-dash/types';
import { handleHealthWebhook } from '../controllers/webhooks';
import { createGoal, getGoals } from '../controllers/goals';
import { getMe, getMyAthletes } from '../controllers/users';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req: Request, res: Response) => {
  const responseData: AthleteHealthCheckResponse = {
    status: 'success',
    message: 'Athlite-Dash API is running securely.',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(responseData);
});

// v1 Routes
apiRouter.get('/v1/templates', getTemplates);
apiRouter.post('/v1/events', requireAuth, createEvent);
apiRouter.get('/v1/analytics/:templateId', requireAuth, getAnalytics);
// Webhook Routes (Public but secured via secret headers)
apiRouter.post('/v1/webhooks/health', handleHealthWebhook);
// Goal Routes
apiRouter.post('/v1/goals', requireAuth, createGoal);
apiRouter.get('/v1/goals/:templateId', requireAuth, getGoals);
// User & Coach Routes
apiRouter.get('/v1/auth/me', requireAuth, getMe);
apiRouter.get('/v1/coach/athletes', requireAuth, getMyAthletes);