import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Mount the router (Prefixes all routes inside with /api)
app.use('/api', apiRouter);

app.listen(PORT as number, '127.0.0.1', () => {
  console.log(`🚀 Server is running on http://127.0.0.1:${PORT}`);
});