import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

import userRouter from './routes/user.route.js';
import uploadRouter from './routes/media.route.js';
import galleryRouter from './routes/gallery.route.js';
import testRouter from './routes/test.route.js';

// user routes
app.use('/api/v1/user', userRouter);

// media routes
app.use('/api/v1/media', uploadRouter);

// gallery route
app.use('/api/v1/gallery', galleryRouter);

// Healthcheck
app.use('/api/v1/tester', testRouter);

// Base URL
// http://localhost:8080/api/v1

export { app };
