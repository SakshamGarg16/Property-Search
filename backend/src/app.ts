// src/app.ts
import express from 'express';
import bodyParser from 'body-parser';
import propertyRoutes from './routes/property.routes';
import cors from 'cors';


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/api/properties', propertyRoutes);
export default app;
