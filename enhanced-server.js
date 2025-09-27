const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Database simulation
let users = [];
let reports = [];
let socialPosts = [];
let hotspots = [];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// NLP Engine for hazard detection
class NLPEngine {
  constructor() {
    this.hazardKeywords = {
      flood: ['flood', 'flooding', 'water', 'rain', 'overflow', 'submerged'],
      storm: ['storm', 'cyclone', 'hurricane', 'wind', 'tornado'],
      fire: ['fire', 'burning', 'smoke', 'flames', 'wildfire'],
      earthquake: ['earthquake', 'tremor', 'shake', 'seismic'],
      tsunami: ['tsunami', 'wave', 'surge', 'coastal'],
      accident: ['accident', 'crash', 'collision', 'emergency']
    };
    
    this.urgencyKeywords = ['urgent', 'emergency', 'critical', 'immediate', 'help', 'rescue'];
    this.locationKeywords = ['near', 'at', 'in', 'around', 'close to'];
  }

  analyzeText(text) {
    const lowerText = text.toLowerCase();
    const analysis = {
      hazardType: null,
      urgencyLevel: 0,
      keywords: [],
      sentiment: 'neutral',
      confidence: 0
    };

    // Detect hazard type
    for (const [type, keywords] of Object.entries(this.hazardKeywords)) {
      const matches = keywords.filter(keyword => lowerText.includes(keyword));
      if (matches.length > 0) {
        analysis.hazardType = type;
        analysis.keywords.push(...matches);
        analysis.confidence += matches.length * 0.2;
      }
    }

    // Detect urgency
    const urgencyMatches = this.urgencyKeywords.filter(keyword => lowerText.includes(keyword));
    analysis.urgencyLevel = Math.min(urgencyMatches.length * 0.3, 1);
    analysis.keywords.push(...urgencyMatches);

    // Simple sentiment analysis
    const negativeWords = ['danger', 'disaster', 'severe', 'critical', 'emergency'];
    const positiveWords = ['safe', 'help', 'rescue', 'support'];
    
    const negCount = negativeWords.reduce((count, word) => 
      count + (lowerText.match(new RegExp(word, 'g')) || []).length, 0);
    const posCount = positiveWords.reduce((count, word) => 
      count + (lowerText.match(new RegExp(word, 'g')) || []).length, 0);
    
    if (negCount > posCount) analysis.sentiment = 'negative';
    else if (posCount > negCount) analysis.sentiment = 'positive';

    analysis.confidence = Math.min(analysis.confidence, 1);
    return analysis;
  }

  processSocialMedia(posts) {
    return posts.map(post => ({
      ...post,
      analysis: this.analyzeText(post.content),
      relevanceScore: this.calculateRelevance(post)
    })).filter(post => post.analysis.confidence > 0.3);
  }

  calculateRelevance(post) {
    const analysis = this.analyzeText(post.content);
    return analysis.confidence * (1 + post.engagement / 100) * (analysis.urgencyLevel + 0.5);
  }
}

const nlpEngine = new NLPEngine();

// Hotspot generation algorithm
function generateHotspots() {
  const locationClusters = {};
  const timeWindow = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();

  // Group reports by location (within ~10km radius)
  reports.filter(report => now - new Date(report.timestamp).getTime() < timeWindow)
    .forEach(report => {
      const key = `${Math.floor(report.latitude * 10)}_${Math.floor(report.longitude * 10)}`;
      if (!locationClusters[key]) {
        locationClusters[key] = [];
      }
      locationClusters[key].push(report);
    });

  // Generate hotspots from clusters with 2+ reports
  hotspots = Object.entries(locationClusters)
    .filter(([key, reports]) => reports.length >= 2)
    .map(([key, clusterReports]) => {
      const avgLat = clusterReports.reduce((sum, r) => sum + r.latitude, 0) / clusterReports.length;
      const avgLng = clusterReports.reduce((sum, r) => sum + r.longitude, 0) / clusterReports.length;
      
      const severityScore = clusterReports.reduce((score, r) => {
        const weights = { critical: 4, high: 3, medium: 2, low: 1 };
        return score + (weights[r.severity] || 1);
      }, 0);

      return {
        id: key,
        latitude: avgLat,
        longitude: avgLng,
        reportCount: clusterReports.length,
        severity: severityScore > 10 ? 'critical' : severityScore > 6 ? 'high' : 'medium',
        types: [...new Set(clusterReports.map(r => r.type))],
        lastUpdate: Math.max(...clusterReports.map(r => new Date(r.timestamp).getTime())),
        affectedPeople: clusterReports.reduce((sum, r) => sum + (parseInt(r.peopleAffected) || 0), 0)
      };
    });
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html'));
});

// User management
app.post('/api/users/register', (req, res) => {
  const user = { id: Date.now(), ...req.body, registeredAt: new Date().toISOString() };
  users.push(user);
  res.json({ success: true, user });
});

app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  res.json({ success: !!user, user });
});

// Report management
app.post('/api/reports', upload.array('media', 10), (req, res) => {
  const report = {
    id: Date.now(),
    ...req.body,
    mediaFiles: req.files ? req.files.map(f => f.filename) : [],
    timestamp: new Date().toISOString(),
    verified: false,
    nlpAnalysis: nlpEngine.analyzeText(req.body.description || '')
  };
  
  reports.push(report);
  generateHotspots();
  
  // Trigger early warning if critical
  if (report.severity === 'critical' || report.nlpAnalysis.urgencyLevel > 0.7) {
    triggerEarlyWarning(report);
  }
  
  res.json({ success: true, report });
});

app.get('/api/reports', (req, res) => {
  const { severity, type, hours = 24 } = req.query;
  const timeLimit = Date.now() - (hours * 60 * 60 * 1000);
  
  let filteredReports = reports.filter(r => new Date(r.timestamp).getTime() > timeLimit);
  
  if (severity) filteredReports = filteredReports.filter(r => r.severity === severity);
  if (type) filteredReports = filteredReports.filter(r => r.type === type);
  
  res.json({ reports: filteredReports, total: filteredReports.length });
});

// Hotspot management
app.get('/api/hotspots', (req, res) => {
  generateHotspots();
  res.json({ hotspots, total: hotspots.length });
});

// Social media integration
app.post('/api/social/analyze', (req, res) => {
  const { posts } = req.body;
  const analyzedPosts = nlpEngine.processSocialMedia(posts);
  
  // Store relevant posts
  socialPosts.push(...analyzedPosts.filter(p => p.relevanceScore > 0.5));
  
  res.json({ 
    analyzed: analyzedPosts.length,
    relevant: analyzedPosts.filter(p => p.relevanceScore > 0.5).length,
    posts: analyzedPosts
  });
});

app.get('/api/social/feed', (req, res) => {
  // Mock social media data
  const mockPosts = [
    { platform: 'Twitter', content: 'Heavy rainfall in Mumbai causing flooding #MumbaiRains #Emergency', engagement: 150, timestamp: new Date() },
    { platform: 'Facebook', content: 'Cyclone warning issued for Odisha coast. Please stay safe!', engagement: 89, timestamp: new Date() },
    { platform: 'Instagram', content: 'Forest fire spreading near Dehradun. Authorities responding.', engagement: 67, timestamp: new Date() }
  ];
  
  const analyzedPosts = nlpEngine.processSocialMedia(mockPosts);
  res.json({ posts: analyzedPosts });
});

// NLP insights
app.get('/api/nlp/insights', (req, res) => {
  const allTexts = [...reports.map(r => r.description), ...socialPosts.map(p => p.content)];
  const combinedText = allTexts.join(' ');
  
  const insights = {
    totalAnalyzed: allTexts.length,
    keywordFrequency: extractKeywordFrequency(combinedText),
    hazardTypes: getHazardTypeDistribution(),
    sentimentDistribution: getSentimentDistribution(),
    urgencyTrends: getUrgencyTrends()
  };
  
  res.json(insights);
});

// Early warning system
function triggerEarlyWarning(report) {
  const warning = {
    id: Date.now(),
    type: 'early_warning',
    severity: report.severity,
    hazardType: report.type,
    location: { lat: report.latitude, lng: report.longitude },
    message: `Critical ${report.type} reported: ${report.title}`,
    timestamp: new Date().toISOString(),
    reportId: report.id
  };
  
  // In production, this would send SMS, email, push notifications
  console.log('EARLY WARNING TRIGGERED:', warning);
  
  // Broadcast to connected clients (WebSocket in production)
  // io.emit('early_warning', warning);
}

// Utility functions
function extractKeywordFrequency(text) {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const frequency = {};
  words.forEach(word => {
    if (word.length > 3) frequency[word] = (frequency[word] || 0) + 1;
  });
  return Object.entries(frequency).sort(([,a], [,b]) => b - a).slice(0, 20);
}

function getHazardTypeDistribution() {
  const distribution = {};
  reports.forEach(r => distribution[r.type] = (distribution[r.type] || 0) + 1);
  return distribution;
}

function getSentimentDistribution() {
  const distribution = { positive: 0, negative: 0, neutral: 0 };
  reports.forEach(r => {
    if (r.nlpAnalysis) distribution[r.nlpAnalysis.sentiment]++;
  });
  return distribution;
}

function getUrgencyTrends() {
  const last24h = reports.filter(r => Date.now() - new Date(r.timestamp).getTime() < 24 * 60 * 60 * 1000);
  return {
    total: last24h.length,
    critical: last24h.filter(r => r.severity === 'critical').length,
    high: last24h.filter(r => r.severity === 'high').length
  };
}

// Multilingual support
app.get('/api/translations/:lang', (req, res) => {
  const translations = {
    en: { title: "Hazard Reporting System", submit: "Submit Report" },
    hi: { title: "आपदा रिपोर्टिंग सिस्टम", submit: "रिपोर्ट जमा करें" },
    bn: { title: "বিপদ রিপোর্টিং সিস্টেম", submit: "রিপোর্ট জমা দিন" }
  };
  
  res.json(translations[req.params.lang] || translations.en);
});

// Offline sync
app.post('/api/sync', (req, res) => {
  const { offlineReports } = req.body;
  
  offlineReports.forEach(report => {
    report.syncedAt = new Date().toISOString();
    reports.push(report);
  });
  
  generateHotspots();
  res.json({ synced: offlineReports.length, success: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`Enhanced Hazard Monitoring Server running on http://localhost:${PORT}`);
  
  // Generate initial hotspots
  generateHotspots();
  
  // Auto-refresh hotspots every 5 minutes
  setInterval(generateHotspots, 5 * 60 * 1000);
});

module.exports = app;