import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { EventEmitter } from 'events';
import code from './pair.js';

// Increase EventEmitter limit (investigate if this is truly needed)
EventEmitter.defaultMaxListeners = 15; // Default is 10, adjust cautiously

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 8000;

// Built-in middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (optional, if you have a public folder)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/code', code);
app.get('/pair', (req, res, next) => {
    res.sendFile(path.join(__dirname, 'pair.html'), (err) => {
        if (err) next(err);
    });
});
app.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, 'main.html'), (err) => {
        if (err) next(err);
    });
});

// Error-handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.listen(PORT, () => {
    console.log(`Powered-by-sula-md-rika-md-cyber-freedom\n\nServer running on http://localhost:${PORT}`);
});

export default app;
