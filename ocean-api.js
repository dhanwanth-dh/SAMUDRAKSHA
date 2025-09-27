// Ocean Hazard Monitoring API Service
class OceanMonitorAPI {
  constructor() {
    this.apiKey = 'demo-key'; // Replace with actual API key
    this.baseURL = 'https://api.openweathermap.org/data/2.5';
    this.hazards = [];
    this.sensors = new Map();
    this.predictions = [];
  }

  // Initialize monitoring system
  async initialize() {
    await this.loadSensorData();
    await this.fetchWeatherData();
    this.startRealTimeMonitoring();
    return { status: 'initialized', timestamp: new Date().toISOString() };
  }

  // Fetch real-time weather and ocean data
  async fetchWeatherData() {
    try {
      // Simulate API call - replace with actual weather service
      const mockData = {
        current: {
          temp: 24 + Math.random() * 6,
          windSpeed: 30 + Math.random() * 30,
          waveHeight: 1.5 + Math.random() * 3,
          visibility: 5 + Math.random() * 10,
          pressure: 1010 + Math.random() * 20
        },
        forecast: this.generateForecast()
      };
      
      this.processWeatherData(mockData);
      return mockData;
    } catch (error) {
      console.error('Weather data fetch failed:', error);
      return null;
    }
  }

  // Generate weather forecast
  generateForecast() {
    const forecast = [];
    for (let i = 0; i < 24; i++) {
      forecast.push({
        hour: i,
        stormRisk: Math.random() * 100,
        waveHeight: 1 + Math.random() * 4,
        windSpeed: 20 + Math.random() * 40,
        temperature: 22 + Math.random() * 8
      });
    }
    return forecast;
  }

  // Process and analyze weather data for hazards
  processWeatherData(data) {
    this.hazards = [];
    
    // Storm detection
    if (data.current.windSpeed > 50) {
      this.hazards.push({
        type: 'storm',
        severity: data.current.windSpeed > 70 ? 'high' : 'medium',
        description: `High wind speeds detected: ${data.current.windSpeed.toFixed(1)} km/h`,
        location: { lat: 20.5937, lng: 78.9629 },
        timestamp: new Date().toISOString()
      });
    }

    // Wave height warning
    if (data.current.waveHeight > 3) {
      this.hazards.push({
        type: 'waves',
        severity: data.current.waveHeight > 4 ? 'high' : 'medium',
        description: `Dangerous wave heights: ${data.current.waveHeight.toFixed(1)}m`,
        location: { lat: 19.0, lng: 72.8 },
        timestamp: new Date().toISOString()
      });
    }

    // Visibility warning
    if (data.current.visibility < 3) {
      this.hazards.push({
        type: 'visibility',
        severity: 'medium',
        description: `Poor visibility conditions: ${data.current.visibility.toFixed(1)}km`,
        location: { lat: 13.0, lng: 80.2 },
        timestamp: new Date().toISOString()
      });
    }
  }

  // AI-powered risk assessment
  assessRisk(location, timeframe = 24) {
    const riskFactors = {
      storm: 0,
      waves: 0,
      wind: 0,
      visibility: 0
    };

    // Analyze current hazards
    this.hazards.forEach(hazard => {
      const distance = this.calculateDistance(location, hazard.location);
      const proximity = Math.max(0, 1 - distance / 100); // Risk decreases with distance
      
      switch (hazard.type) {
        case 'storm':
          riskFactors.storm += proximity * (hazard.severity === 'high' ? 0.8 : 0.5);
          break;
        case 'waves':
          riskFactors.waves += proximity * (hazard.severity === 'high' ? 0.7 : 0.4);
          break;
        case 'wind':
          riskFactors.wind += proximity * 0.3;
          break;
        case 'visibility':
          riskFactors.visibility += proximity * 0.2;
          break;
      }
    });

    const overallRisk = Math.min(1, Object.values(riskFactors).reduce((a, b) => a + b, 0));
    
    return {
      overallRisk: overallRisk,
      riskLevel: overallRisk > 0.7 ? 'high' : overallRisk > 0.4 ? 'medium' : 'low',
      factors: riskFactors,
      recommendations: this.generateRecommendations(overallRisk),
      timestamp: new Date().toISOString()
    };
  }

  // Generate safety recommendations
  generateRecommendations(riskLevel) {
    if (riskLevel > 0.7) {
      return [
        'Avoid all marine activities',
        'Small vessels should return to harbor immediately',
        'Monitor weather updates continuously',
        'Prepare emergency supplies'
      ];
    } else if (riskLevel > 0.4) {
      return [
        'Exercise caution in marine activities',
        'Monitor weather conditions closely',
        'Ensure safety equipment is ready',
        'Consider postponing non-essential trips'
      ];
    } else {
      return [
        'Normal marine activities permitted',
        'Standard safety precautions advised',
        'Monitor routine weather updates'
      ];
    }
  }

  // AI Chat Response System
  processAIQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('current') || lowerQuery.includes('now')) {
      return this.getCurrentConditionsResponse();
    } else if (lowerQuery.includes('forecast') || lowerQuery.includes('predict')) {
      return this.getForecastResponse();
    } else if (lowerQuery.includes('safety') || lowerQuery.includes('recommend')) {
      return this.getSafetyResponse();
    } else if (lowerQuery.includes('hazard') || lowerQuery.includes('danger')) {
      return this.getHazardResponse();
    } else {
      return {
        response: "I can help you with current ocean conditions, weather forecasts, safety recommendations, and hazard analysis. What specific information do you need?",
        type: 'general'
      };
    }
  }

  getCurrentConditionsResponse() {
    const currentHazards = this.hazards.filter(h => 
      new Date() - new Date(h.timestamp) < 3600000 // Last hour
    );
    
    return {
      response: `Current conditions: ${currentHazards.length} active hazards detected. Wind speeds up to 45 km/h, wave heights 2.3m. ${currentHazards.length > 0 ? 'Caution advised.' : 'Conditions are relatively stable.'}`,
      type: 'current',
      data: currentHazards
    };
  }

  getForecastResponse() {
    return {
      response: "24-hour forecast shows increasing storm activity. Storm risk: 85%, High wave probability: 70%. Recommend avoiding coastal areas after 6 PM today.",
      type: 'forecast',
      data: this.predictions
    };
  }

  getSafetyResponse() {
    const risk = this.assessRisk({ lat: 20.5937, lng: 78.9629 });
    return {
      response: `Current risk level: ${risk.riskLevel}. Recommendations: ${risk.recommendations.join(', ')}`,
      type: 'safety',
      data: risk
    };
  }

  getHazardResponse() {
    return {
      response: `${this.hazards.length} hazards currently tracked: ${this.hazards.map(h => h.type).join(', ')}. Most severe: ${this.hazards.find(h => h.severity === 'high')?.description || 'None'}`,
      type: 'hazards',
      data: this.hazards
    };
  }

  // Utility functions
  calculateDistance(pos1, pos2) {
    const R = 6371; // Earth's radius in km
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  async loadSensorData() {
    // Simulate sensor network initialization
    this.sensors.set('wave-sensor-1', { status: 'online', lastUpdate: new Date() });
    this.sensors.set('wind-sensor-1', { status: 'online', lastUpdate: new Date() });
    this.sensors.set('temp-sensor-1', { status: 'online', lastUpdate: new Date() });
    this.sensors.set('visibility-sensor-1', { status: 'offline', lastUpdate: new Date(Date.now() - 3600000) });
  }

  startRealTimeMonitoring() {
    // Update data every 30 seconds
    setInterval(async () => {
      await this.fetchWeatherData();
      this.broadcastUpdate();
    }, 30000);
  }

  broadcastUpdate() {
    // Emit updates to connected clients
    const update = {
      timestamp: new Date().toISOString(),
      hazards: this.hazards,
      sensorStatus: Object.fromEntries(this.sensors)
    };
    
    // In a real implementation, this would use WebSockets
    console.log('Broadcasting update:', update);
  }
}

// Initialize the monitoring system
const oceanMonitor = new OceanMonitorAPI();

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.OceanMonitorAPI = OceanMonitorAPI;
  window.oceanMonitor = oceanMonitor;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OceanMonitorAPI;
}