import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import categoriesRouter from './routes/categoriesRouter.js';
import custumersRouter from './routes/customersRouter.js';
import gamesRouter from './routes/gamesRouter.js';
import renstalsRouter from './routes/rentalsRouter.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.use(categoriesRouter);
app.use(custumersRouter);
app.use(gamesRouter);
app.use(renstalsRouter);

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => console.log('Server is running'));
