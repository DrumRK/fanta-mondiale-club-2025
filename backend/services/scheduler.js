import cron from 'node-cron';
import { MatchUpdater } from './matchUpdater.js';

export class Scheduler {
  static isStarted = false;

  // Start all scheduled jobs
  static start() {
    if (this.isStarted) {
      console.log('⚠️ Scheduler already started');
      return;
    }

    console.log('🕐 Starting smart scheduler...');

    // 📅 SCHEDULE UPDATE: Once daily at 3 AM (get upcoming matches)
    cron.schedule('0 3 * * *', async () => {
      console.log('📅 Daily schedule update triggered (3 AM)');
      try {
        await MatchUpdater.updateSchedule();
      } catch (error) {
        console.error('❌ Schedule update failed:', error.message);
      }
    });

    // ⚽ RESULTS UPDATE: Every 5 minutes (get live results)
    cron.schedule('*/5 * * * *', async () => {
      console.log('⚽ Live results update triggered (every 5 min)');
      try {
        await MatchUpdater.updateResults();
      } catch (error) {
        console.error('❌ Results update failed:', error.message);
      }
    });

    // 🏆 LEADERBOARD RECALC: Every hour (ensure accuracy)
    cron.schedule('0 * * * *', async () => {
      console.log('🏆 Hourly leaderboard recalculation triggered');
      try {
        const { LeaderboardService } = await import('./database/leaderboardService.js');
        await LeaderboardService.recalculateLeaderboard();
      } catch (error) {
        console.error('❌ Leaderboard recalculation failed:', error.message);
      }
    });

    // 🧹 MAINTENANCE: Weekly on Sundays at 2 AM
    cron.schedule('0 2 * * 0', async () => {
      console.log('🧹 Weekly maintenance triggered');
      try {
        await this.weeklyMaintenance();
      } catch (error) {
        console.error('❌ Weekly maintenance failed:', error.message);
      }
    });

    this.isStarted = true;
    console.log('✅ Smart scheduler started successfully');
    console.log('📅 Scheduled jobs:');
    console.log('   - Daily 3 AM: Schedule updates (upcoming matches)');
    console.log('   - Every 5 min: Results updates (live scores)');
    console.log('   - Every hour: Leaderboard recalculation');
    console.log('   - Weekly Sunday 2 AM: Maintenance');
  }

  // Stop all scheduled jobs
  static stop() {
    if (!this.isStarted) {
      console.log('⚠️ Scheduler not running');
      return;
    }

    cron.destroy();
    this.isStarted = false;
    console.log('🛑 Scheduler stopped');
  }

  // Manual triggers
  static async triggerScheduleUpdate() {
    console.log('🔧 Manual schedule update triggered');
    try {
      return await MatchUpdater.updateSchedule();
    } catch (error) {
      console.error('❌ Manual schedule update failed:', error);
      throw error;
    }
  }

  static async triggerResultsUpdate() {
    console.log('🔧 Manual results update triggered');
    try {
      return await MatchUpdater.updateResults();
    } catch (error) {
      console.error('❌ Manual results update failed:', error);
      throw error;
    }
  }

  static async triggerUpdate() {
    console.log('🔧 Manual full update triggered (both schedule and results)');
    try {
      return await MatchUpdater.manualUpdate();
    } catch (error) {
      console.error('❌ Manual update failed:', error);
      throw error;
    }
  }

  // Weekly maintenance tasks
  static async weeklyMaintenance() {
    console.log('🧹 Running weekly maintenance...');
    
    try {
      // Force update schedule
      await MatchUpdater.updateSchedule();
      
      // Force recalculate leaderboard
      const { LeaderboardService } = await import('./database/leaderboardService.js');
      await LeaderboardService.recalculateLeaderboard();
      
      console.log('✅ Weekly maintenance completed');
    } catch (error) {
      console.error('❌ Weekly maintenance error:', error);
      throw error;
    }
  }

  // Get scheduler status
  static getStatus() {
    return {
      isRunning: this.isStarted,
      strategy: 'Smart dual-frequency updates',
      scheduleFrequency: 'Daily at 3 AM',
      resultsFrequency: 'Every 5 minutes',
      jobs: [
        'Daily 3 AM: Schedule updates (upcoming matches)',
        'Every 5 min: Results updates (live scores)',
        'Every hour: Leaderboard recalculation',
        'Weekly Sunday 2 AM: Maintenance'
      ],
      nextScheduleUpdate: 'Daily at 3 AM',
      nextResultsUpdate: 'Every 5 minutes'
    };
  }
}