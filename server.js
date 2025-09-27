const express = require('express');
const cors = require('cors');
const path = require('path');
const OceanMonitorAPI = require('./ocean-api.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Ocean Monitor
const oceanMonitor = new OceanMonitorAPI();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html'));
});

// Ocean Monitor API endpoints
app.get('/api/ocean/status', async (req, res) => {
  try {
    const status = await oceanMonitor.initialize();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ocean/hazards', (req, res) => {
  res.json({
    hazards: oceanMonitor.hazards,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/ocean/weather', async (req, res) => {
  try {
    const weather = await oceanMonitor.fetchWeatherData();
    res.json(weather);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ocean/risk-assessment', (req, res) => {
  const { latitude, longitude, timeframe } = req.body;
  const location = { lat: latitude, lng: longitude };
  const risk = oceanMonitor.assessRisk(location, timeframe);
  res.json(risk);
});

app.post('/api/ocean/chat', (req, res) => {
  const { query } = req.body;
  const response = oceanMonitor.processAIQuery(query);
  res.json(response);
});

app.get('/api/ocean/sensors', (req, res) => {
  res.json({
    sensors: Object.fromEntries(oceanMonitor.sensors),
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Ocean Monitor Server running on http://localhost:${PORT}`);
  oceanMonitor.initialize().then(() => {
    console.log('Ocean monitoring system initialized');
  });
});

module.exports = app;