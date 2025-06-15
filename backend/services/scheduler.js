import cron from 'node-cron';
import { MatchUpdater } from './matchUpdater.js';

export class Scheduler {
  static scheduleUpdateJob = null;
  static resultsUpdateJob = null;
  static isScheduleUpdating = false;
  static isResultsUpdating = false;
  static scheduleUpdateStartTime = null;
  static resultsUpdateStartTime = null;
  static status = {
    scheduleJob: 'stopped',
    resultsJob: 'stopped',
    lastScheduleUpdate: null,
    lastResultsUpdate: null,
    errors: []
  };

  // 📅 SCHEDULE UPDATE - Once daily at 6 AM
  static startScheduleUpdates() {
    if (this.scheduleUpdateJob) {
      console.log('📅 Schedule update job already running');
      return;
    }

    console.log('📅 Starting daily schedule update job (6:00 AM)...');
    
    // Run at 6:00 AM every day
    this.scheduleUpdateJob = cron.schedule('0 6 * * *', async () => {
      await this.triggerScheduleUpdateWithRetry();
    }, {
      scheduled: true,
      timezone: "Europe/Rome"
    });

    this.status.scheduleJob = 'running';
    console.log('✅ Daily schedule update job started');
  }

  // ⚽ RESULTS UPDATE - Every 5 minutes
  static startResultsUpdates() {
    if (this.resultsUpdateJob) {
      console.log('⚽ Results update job already running');
      return;
    }

    console.log('⚽ Starting frequent results update job (every 5 minutes)...');
    
    // Run every 5 minutes
    this.resultsUpdateJob = cron.schedule('*/5 * * * *', async () => {
      await this.triggerResultsUpdateWithRetry();
    }, {
      scheduled: true,
      timezone: "Europe/Rome"
    });

    this.status.resultsJob = 'running';
    console.log('✅ Frequent results update job started');
  }

  // 🚀 START ALL JOBS
  static startAll() {
    console.log('🚀 Starting all scheduled jobs...');
    this.startScheduleUpdates();
    this.startResultsUpdates();
    
    // Run initial updates
    this.triggerScheduleUpdateWithRetry();
    this.triggerResultsUpdateWithRetry();
  }

  // 🛑 STOP ALL JOBS
  static stopAll() {
    console.log('🛑 Stopping all scheduled jobs...');
    
    if (this.scheduleUpdateJob) {
      this.scheduleUpdateJob.stop();
      this.scheduleUpdateJob = null;
      this.status.scheduleJob = 'stopped';
    }
    
    if (this.resultsUpdateJob) {
      this.resultsUpdateJob.stop();
      this.resultsUpdateJob = null;
      this.status.resultsJob = 'stopped';
    }
    
    console.log('✅ All scheduled jobs stopped');
  }

  // 📅 MANUAL SCHEDULE UPDATE WITH LOCK AND RETRY
  static async triggerScheduleUpdateWithRetry(maxRetries = 3) {
    if (this.isScheduleUpdating) {
      console.log('⏳ Schedule update already in progress, skipping...');
      return { success: false, message: 'Update already in progress' };
    }

    this.isScheduleUpdating = true;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📅 Schedule update attempt ${attempt}/${maxRetries}...`);
        
        const result = await MatchUpdater.updateSchedule();
        
        this.status.lastScheduleUpdate = new Date().toISOString();
        this.status.errors = this.status.errors.filter(e => e.type !== 'schedule');
        
        console.log('✅ Schedule update completed successfully');
        return result;
        
      } catch (error) {
        console.error(`❌ Schedule update attempt ${attempt} failed:`, error.message);
        
        this.status.errors.push({
          type: 'schedule',
          message: error.message,
          timestamp: new Date().toISOString(),
          attempt
        });
        
        if (attempt === maxRetries) {
          console.error('❌ All schedule update attempts failed');
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s
        console.log(`⏰ Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.isScheduleUpdating = false;
  }

  // ⚽ MANUAL RESULTS UPDATE WITH LOCK AND RETRY
  static async triggerResultsUpdateWithRetry(maxRetries = 3) {
  // 🆕 CHECK SE È BLOCCATO DA TROPPO TEMPO
  const maxExecutionTime = 10 * 60 * 1000; // 10 minuti max
  const now = Date.now();
  
  if (this.isResultsUpdating) {
    // Controlla da quanto tempo è in corso
    const updateStartTime = this.resultsUpdateStartTime || now;
    const elapsedTime = now - updateStartTime;
    
    if (elapsedTime > maxExecutionTime) {
      console.log(`🚨 Results update stuck for ${Math.round(elapsedTime/1000/60)} minutes - FORCE RESET`);
      this.isResultsUpdating = false;
      this.resultsUpdateStartTime = null;
    } else {
      console.log(`⏳ Results update in progress for ${Math.round(elapsedTime/1000)} seconds, skipping...`);
      return { success: false, message: 'Update already in progress', elapsedTime };
    }
  }

  this.isResultsUpdating = true;
  this.resultsUpdateStartTime = now; // 🆕 TRACK START TIME
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`⚽ Results update attempt ${attempt}/${maxRetries}...`);
      
      // 🆕 TIMEOUT PER SINGOLO TENTATIVO
      const updatePromise = MatchUpdater.updateResults();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Update timeout after 5 minutes')), 5 * 60 * 1000)
      );
      
      const result = await Promise.race([updatePromise, timeoutPromise]);
      
      this.status.lastResultsUpdate = new Date().toISOString();
      this.status.errors = this.status.errors.filter(e => e.type !== 'results');
      
      console.log('✅ Results update completed successfully');
      return result;
      
    } catch (error) {
      console.error(`❌ Results update attempt ${attempt} failed:`, error.message);
      
      this.status.errors.push({
        type: 'results',
        message: error.message,
        timestamp: new Date().toISOString(),
        attempt
      });
      
      if (attempt === maxRetries) {
        console.error('❌ All results update attempts failed');
        throw error;
      }
      
      // Wait before retry
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`⏰ Waiting ${waitTime/1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    } finally {
      // 🆕 ALWAYS RESET FLAG
      if (attempt === maxRetries || this.isResultsUpdating) {
        this.isResultsUpdating = false;
        this.resultsUpdateStartTime = null;
      }
    }
  }
}

  // 🔧 LEGACY METHODS FOR BACKWARD COMPATIBILITY
  static async triggerUpdate() {
    console.log('🔧 Legacy triggerUpdate called - running both schedule and results updates');
    
    const scheduleResult = await this.triggerScheduleUpdateWithRetry();
    const resultsResult = await this.triggerResultsUpdateWithRetry();
    
    return {
      success: true,
      schedule: scheduleResult,
      results: resultsResult
    };
  }

  static async triggerScheduleUpdate() {
    return await this.triggerScheduleUpdateWithRetry();
  }

  static async triggerResultsUpdate() {
    return await this.triggerResultsUpdateWithRetry();
  }

  // 📊 GET STATUS
  static getStatus() {
    return {
      ...this.status,
      scheduleUpdateRunning: this.isScheduleUpdating,
      resultsUpdateRunning: this.isResultsUpdating,
      scheduleJobActive: !!this.scheduleUpdateJob,
      resultsJobActive: !!this.resultsUpdateJob,
      nextScheduleRun: this.scheduleUpdateJob ? 'Daily at 6:00 AM' : 'Not scheduled',
      nextResultsRun: this.resultsUpdateJob ? 'Every 5 minutes' : 'Not scheduled',
      systemTime: new Date().toISOString(),
      timezone: 'Europe/Rome'
    };
  }

  // 🔄 RESTART JOBS
  static restart() {
    console.log('🔄 Restarting scheduler...');
    this.stopAll();
    setTimeout(() => {
      this.startAll();
    }, 1000);
  }

  // 🧹 CLEANUP ERROR LOG
  static clearErrors() {
    this.status.errors = [];
    console.log('🧹 Error log cleared');
  }

  // 🔍 GET RECENT ERRORS
  static getRecentErrors(hours = 24) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    
    return this.status.errors.filter(error => 
      new Date(error.timestamp) > cutoff
    );
  }
  // 🆕 NUOVO: Force reset del sistema
static forceResetUpdateLocks() {
  console.log('🔄 FORCE RESETTING all update locks...');
  this.isScheduleUpdating = false;
  this.isResultsUpdating = false;
  this.scheduleUpdateStartTime = null;
  this.resultsUpdateStartTime = null;
  
  // Clear stuck errors
  this.status.errors = this.status.errors.filter(e => {
    const errorAge = Date.now() - new Date(e.timestamp).getTime();
    return errorAge < 30 * 60 * 1000; // Keep only errors from last 30 minutes
  });
  
  console.log('✅ All locks reset, system ready for new updates');
  
  return {
    success: true,
    message: 'System locks reset successfully',
    timestamp: new Date().toISOString()
  };
}
}