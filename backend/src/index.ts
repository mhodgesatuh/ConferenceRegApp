// src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import registrationRoutes from './routes/registration';

dotenv.config();

const app = express();
const port = process.env.DB_PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/registrations', registrationRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
