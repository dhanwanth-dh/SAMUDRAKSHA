// Offline Data Collection and Sync Manager
class OfflineManager {
  constructor() {
    this.dbName = 'HazardReportingDB';
    this.version = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    
    this.init();
    this.setupEventListeners();
  }

  async init() {
    try {
      this.db = await this.openDB();
      await this.createStores();
      console.log('Offline database initialized');
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
    }
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('reports')) {
          const reportStore = db.createObjectStore('reports', { keyPath: 'id' });
          reportStore.createIndex('timestamp', 'timestamp');
          reportStore.createIndex('synced', 'synced');
        }
        
        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
          mediaStore.createIndex('reportId', 'reportId');
        }
        
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
      };
    });
  }

  async createStores() {
    // Stores are created in onupgradeneeded
  }

  setupEventListeners() {
    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
      this.updateUI('online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateUI('offline');
    });

    // Periodic sync attempt
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncOfflineData();
      }
    }, 30000); // Try sync every 30 seconds
  }

  // Store report offline
  async storeReportOffline(reportData) {
    try {
      const transaction = this.db.transaction(['reports'], 'readwrite');
      const store = transaction.objectStore('reports');
      
      const report = {
        ...reportData,
        id: Date.now(),
        synced: false,
        offlineCreated: true,
        timestamp: new Date().toISOString()
      };
      
      await store.add(report);
      this.syncQueue.push(report);
      
      console.log('Report stored offline:', report.id);
      return report;
    } catch (error) {
      console.error('Failed to store report offline:', error);
      throw error;
    }
  }

  // Store media files offline
  async storeMediaOffline(reportId, files) {
    try {
      const transaction = this.db.transaction(['media'], 'readwrite');
      const store = transaction.objectStore('media');
      
      const mediaPromises = Array.from(files).map(async (file, index) => {
        const mediaData = {
          id: `${reportId}_${index}`,
          reportId: reportId,
          file: file,
          type: file.type,
          size: file.size,
          name: file.name,
          synced: false
        };
        
        return store.add(mediaData);
      });
      
      await Promise.all(mediaPromises);
      console.log(`${files.length} media files stored offline for report ${reportId}`);
    } catch (error) {
      console.error('Failed to store media offline:', error);
    }
  }

  // Get offline reports
  async getOfflineReports() {
    try {
      const transaction = this.db.transaction(['reports'], 'readonly');
      const store = transaction.objectStore('reports');
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get offline reports:', error);
      return [];
    }
  }

  // Sync offline data when online
  async syncOfflineData() {
    if (!this.isOnline || this.syncQueue.length === 0) return;
    
    console.log(`Syncing ${this.syncQueue.length} offline reports...`);
    
    try {
      const unsyncedReports = await this.getUnsyncedReports();
      
      for (const report of unsyncedReports) {
        await this.syncSingleReport(report);
      }
      
      this.syncQueue = [];
      this.updateUI('synced');
      
    } catch (error) {
      console.error('Sync failed:', error);
      this.updateUI('sync-failed');
    }
  }

  async getUnsyncedReports() {
    const transaction = this.db.transaction(['reports'], 'readonly');
    const store = transaction.objectStore('reports');
    const index = store.index('synced');
    const request = index.getAll(false);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async syncSingleReport(report) {
    try {
      // Get associated media files
      const mediaFiles = await this.getReportMedia(report.id);
      
      // Create FormData for multipart upload
      const formData = new FormData();
      Object.keys(report).forEach(key => {
        if (key !== 'id' && key !== 'synced' && key !== 'offlineCreated') {
          formData.append(key, report[key]);
        }
      });
      
      // Add media files
      mediaFiles.forEach((media, index) => {
        formData.append('media', media.file);
      });
      
      // Send to server
      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        // Mark as synced
        await this.markReportSynced(report.id);
        await this.markMediaSynced(report.id);
        console.log(`Report ${report.id} synced successfully`);
      } else {
        throw new Error(`Sync failed: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error(`Failed to sync report ${report.id}:`, error);
      throw error;
    }
  }

  async getReportMedia(reportId) {
    const transaction = this.db.transaction(['media'], 'readonly');
    const store = transaction.objectStore('media');
    const index = store.index('reportId');
    const request = index.getAll(reportId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markReportSynced(reportId) {
    const transaction = this.db.transaction(['reports'], 'readwrite');
    const store = transaction.objectStore('reports');
    const report = await store.get(reportId);
    
    if (report) {
      report.synced = true;
      report.syncedAt = new Date().toISOString();
      await store.put(report);
    }
  }

  async markMediaSynced(reportId) {
    const transaction = this.db.transaction(['media'], 'readwrite');
    const store = transaction.objectStore('media');
    const index = store.index('reportId');
    const mediaFiles = await index.getAll(reportId);
    
    for (const media of mediaFiles) {
      media.synced = true;
      media.syncedAt = new Date().toISOString();
      await store.put(media);
    }
  }

  // Update UI based on connection status
  updateUI(status) {
    const indicator = document.getElementById('connectionStatus');
    if (!indicator) return;
    
    switch (status) {
      case 'online':
        indicator.textContent = 'Online';
        indicator.className = 'status-online';
        break;
      case 'offline':
        indicator.textContent = 'Offline Mode';
        indicator.className = 'status-offline';
        break;
      case 'syncing':
        indicator.textContent = 'Syncing...';
        indicator.className = 'status-syncing';
        break;
      case 'synced':
        indicator.textContent = 'Synced';
        indicator.className = 'status-synced';
        setTimeout(() => this.updateUI(this.isOnline ? 'online' : 'offline'), 2000);
        break;
      case 'sync-failed':
        indicator.textContent = 'Sync Failed';
        indicator.className = 'status-error';
        setTimeout(() => this.updateUI(this.isOnline ? 'online' : 'offline'), 3000);
        break;
    }
  }

  // Get storage usage info
  async getStorageInfo() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage,
        available: estimate.quota,
        percentage: (estimate.usage / estimate.quota * 100).toFixed(2)
      };
    }
    return null;
  }

  // Clear old offline data
  async clearOldData(daysOld = 7) {
    const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
    
    try {
      const transaction = this.db.transaction(['reports', 'media'], 'readwrite');
      const reportStore = transaction.objectStore('reports');
      const mediaStore = transaction.objectStore('media');
      
      // Get old synced reports
      const reports = await reportStore.getAll();
      const oldReports = reports.filter(r => 
        r.synced && new Date(r.timestamp) < cutoffDate
      );
      
      // Delete old reports and their media
      for (const report of oldReports) {
        await reportStore.delete(report.id);
        
        const mediaFiles = await mediaStore.index('reportId').getAll(report.id);
        for (const media of mediaFiles) {
          await mediaStore.delete(media.id);
        }
      }
      
      console.log(`Cleaned up ${oldReports.length} old reports`);
    } catch (error) {
      console.error('Failed to clean up old data:', error);
    }
  }
}

// Initialize offline manager
const offlineManager = new OfflineManager();

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.offlineManager = offlineManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OfflineManager;
}