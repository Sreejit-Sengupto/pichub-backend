import dotenv from 'dotenv';
import connectDB from './database/index.js';
import { app } from './app.js';

dotenv.config({
    path: './.env',
});

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log('Server listening on PORT 🚢: ' + process.env.PORT);
        });
    })
    .catch((err) => {
        console.log('Failed to start the server' + err.message);
    });
