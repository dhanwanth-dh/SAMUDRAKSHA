# Enhanced AI-Powered Hazard Monitoring & Crowd Reporting System

A comprehensive hazard monitoring and crowd reporting platform with AI-powered analysis, real-time dashboard, social media integration, and multilingual support for coastal and remote communities.

## Features

👥 **Enhanced User Registration & Management**
- Multi-role user system (Citizens, Officials, Responders, Volunteers)
- Profile management with photo upload
- Multilingual interface (English, Hindi, Bengali, Tamil)
- User authentication and authorization

📱 **Advanced Hazard Reporting**
- Media upload support (photos, videos)
- GPS location integration with interactive maps
- Severity classification and impact assessment
- Social media integration for wider reach
- Offline data collection with sync capabilities

📊 **Live Crowd Dashboard**
- Real-time map visualization of all reports
- Dynamic hotspot generation based on report density
- Social media feed integration and monitoring
- Advanced filtering and search capabilities
- Live statistics and trend analysis

🤖 **NLP Engine & AI Analysis**
- Automatic hazard detection from text descriptions
- Keyword extraction and sentiment analysis
- Social media post relevance scoring
- Multilingual text processing
- Threat level assessment algorithms

🗺️ **Dynamic Hotspot Generation**
- Automatic clustering of nearby reports
- Severity-based hotspot classification
- Real-time hotspot updates and alerts
- Geographic analysis and pattern recognition

🌐 **Social Media Integration**
- Twitter and Facebook sharing capabilities
- Hashtag tracking and trend analysis
- Social media post analysis for hazard detection
- Community engagement metrics

📡 **Offline Capabilities**
- Local data storage using IndexedDB
- Automatic sync when connection restored
- Media file caching for remote areas
- Queue management for pending uploads

🌍 **Multilingual Support**
- Interface translation for regional accessibility
- Multi-language content processing
- Cultural adaptation for different regions
- Localized emergency terminology

⚡ **Early Warning System**
- Automated alert generation for critical reports
- Integration with emergency response systems
- Multi-channel notification support
- Escalation protocols for severe incidents

🌊 **Ocean Monitoring (Original Features)**
- Live sensor data from wave height, wind speed, water temperature
- Interactive hazard map with real-time updates
- AI-powered risk assessment and predictions
- Weather forecast analysis and alerts

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Access the Application**
   - Open your browser to `http://localhost:3000`
   - Navigate to "Ocean Monitor" from the main menu

### Development Mode
```bash
npm run dev
```

## API Endpoints

### Ocean Monitoring
- `GET /api/ocean/status` - System status
- `GET /api/ocean/hazards` - Current hazards
- `GET /api/ocean/weather` - Weather data
- `POST /api/ocean/risk-assessment` - Risk analysis
- `POST /api/ocean/chat` - AI chat interface
- `GET /api/ocean/sensors` - Sensor status

### Example API Usage

**Risk Assessment:**
```javascript
fetch('/api/ocean/risk-assessment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    latitude: 20.5937,
    longitude: 78.9629,
    timeframe: 24
  })
})
```

**AI Chat:**
```javascript
fetch('/api/ocean/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "What are the current ocean conditions?"
  })
})
```

## Integration with Existing Website

The ocean monitoring system seamlessly integrates with your existing community platform:

1. **Navigation Integration** - Added to main navigation menu
2. **User Authentication** - Uses existing login system
3. **Consistent UI** - Matches existing design patterns
4. **Data Sharing** - Can integrate with existing issue reporting

## Configuration

### Environment Variables
Create a `.env` file:
```
PORT=3000
WEATHER_API_KEY=your_api_key_here
DATABASE_URL=your_database_url
```

### Customization
- Modify `ocean-api.js` for different data sources
- Update `ocean-monitor.html` for UI customization
- Configure alert thresholds in the API service

## Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```bash
docker build -t ocean-monitor .
docker run -p 3000:3000 ocean-monitor
```

## Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript, Leaflet.js
- **Backend:** Node.js, Express.js
- **AI/ML:** Custom risk assessment algorithms
- **Maps:** OpenStreetMap, Leaflet
- **Real-time:** WebSocket support (planned)

## Future Enhancements

- [ ] Integration with real weather APIs (OpenWeatherMap, NOAA)
- [ ] Machine learning for improved predictions
- [ ] Mobile app companion
- [ ] SMS/Email alert system
- [ ] Multi-language support
- [ ] Advanced data visualization
- [ ] Integration with maritime authorities

## Support

For technical support or questions:
- Check the API documentation
- Review the example implementations
- Contact the development team

## License

MIT License - see LICENSE file for details