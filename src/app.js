const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const apiRoutes = require('./routes/index');
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to TourishSite Backend API' });
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = app;
