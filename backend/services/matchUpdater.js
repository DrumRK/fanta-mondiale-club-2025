import axios from "axios";
import ConfigService from "./configService.js";
import { MatchService } from "./database/matchService.js";
import { LeaderboardService } from "./database/leaderboardService.js";
import { query } from "../db/connection.js";

export class MatchUpdater {

  // 📅 SCHEDULE UPDATE - Get all upcoming matches (once daily)
  static async updateSchedule() {
    console.log('📅 Starting schedule update - fetching upcoming matches...');
    
    try {
      const lastUpdate = await this.getLastScheduleUpdateTime();
      console.log(`📅 Last schedule update: ${lastUpdate}`);

      // Fetch ALL matches (scheduled + live + finished) for the tournament
      const matches = await this.fetchScheduleFromAPI();
      console.log(`📊 Fetched ${matches.length} matches from schedule API`);

      let newMatches = 0;
      let updatedMatches = 0;

      // Process each match
      for (const match of matches) {
        try {
          const saved = await MatchService.saveMatch(match);
          if (saved) {
            if (match.fixture.status.short === 'NS' || match.fixture.status.short === 'TBD') {
              newMatches++;
            } else {
              updatedMatches++;
            }
          }
        } catch (error) {
          console.error(`❌ Error processing match ${match.fixture.id}:`, error.message);
        }
      }

      // Update schedule timestamp
      await this.setLastScheduleUpdateTime();

      console.log(`✅ Schedule update completed:`);
      console.log(`   - New matches: ${newMatches}`);
      console.log(`   - Updated matches: ${updatedMatches}`);

      return {
        success: true,
        type: 'schedule',
        newMatches,
        updatedMatches
      };

    } catch (error) {
      console.error('❌ Error in schedule update:', error);
      throw error;
    }
  }

  // ⚽ RESULTS UPDATE - Get live/recent match results (every 5 minutes)
  static async updateResults() {
    console.log('⚽ Starting results update - fetching live/recent results...');
    
    try {
      const lastUpdate = await this.getLastResultsUpdateTime();
      console.log(`⚽ Last results update: ${lastUpdate}`);

      // Fetch only live and recent finished matches
      const matches = await this.fetchResultsFromAPI();
      console.log(`📊 Fetched ${matches.length} live/recent matches from results API`);

      let updatedResults = 0;
      let finishedMatches = 0;

      // Process each match
      for (const match of matches) {
        try {
          const saved = await MatchService.saveMatch(match);
          if (saved) {
            updatedResults++;
            if (match.fixture.status.short === 'FT') {
              finishedMatches++;
            }
          }
        } catch (error) {
          console.error(`❌ Error processing result ${match.fixture.id}:`, error.message);
        }
      }

      // Recalculate leaderboard if we have new finished matches
      if (finishedMatches > 0) {
        console.log('🏆 Recalculating leaderboard...');
        await LeaderboardService.recalculateLeaderboard();
      }

      // Update results timestamp
      await this.setLastResultsUpdateTime();

      console.log(`✅ Results update completed:`);
      console.log(`   - Updated results: ${updatedResults}`);
      console.log(`   - Finished matches: ${finishedMatches}`);
      console.log(`   - Leaderboard updated: ${finishedMatches > 0 ? 'Yes' : 'No'}`);

      return {
        success: true,
        type: 'results',
        updatedResults,
        finishedMatches,
        leaderboardUpdated: finishedMatches > 0
      };

    } catch (error) {
      console.error('❌ Error in results update:', error);
      throw error;
    }
  }

  // 📅 Fetch ALL matches for schedule (comprehensive)
  static async fetchScheduleFromAPI() {
    try {
      const apiKey = ConfigService.getRapidApiKey();
      const apiHost = ConfigService.getRapidApiHost();
      
      console.log('📅 Fetching tournament schedule from API...');
      
      const response = await axios.get("https://api-football-v1.p.rapidapi.com/v3/fixtures", {
        params: { 
          league: 15, 
          season: 2025
          // No date filters - get everything for the tournament
        },
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": apiHost,
        },
        timeout: 30000
      });

      if (!response.data || !response.data.response) {
        throw new Error('Invalid API response format');
      }

      console.log('📈 Schedule matches received:', response.data.response.length);
      return response.data.response;
    } catch (error) {
      this.handleAPIError(error, 'schedule');
      throw error;
    }
  }

  // ⚽ Fetch ONLY live and recent matches for results (targeted)
  static async fetchResultsFromAPI() {
    try {
      const apiKey = ConfigService.getRapidApiKey();
      const apiHost = ConfigService.getRapidApiHost();
      
      console.log('⚽ Fetching live/recent results from API...');
      
      // Get today's date
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const response = await axios.get("https://api-football-v1.p.rapidapi.com/v3/fixtures", {
        params: { 
          league: 15, 
          season: 2025,
          // Only get matches from yesterday to tomorrow (live window)
          from: yesterday.toISOString().split('T')[0],
          to: tomorrow.toISOString().split('T')[0]
        },
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": apiHost,
        },
        timeout: 15000 // Shorter timeout for frequent updates
      });

      if (!response.data || !response.data.response) {
        throw new Error('Invalid API response format');
      }

      // Filter to only live, finished, or recent matches
      const relevantMatches = response.data.response.filter(match => {
        const status = match.fixture.status.short;
        return status === 'LIVE' || status === '1H' || status === '2H' || 
               status === 'HT' || status === 'FT' || status === 'ET' || status === 'P';
      });

      console.log('📈 Live/recent matches received:', relevantMatches.length);
      return relevantMatches;
    } catch (error) {
      this.handleAPIError(error, 'results');
      throw error;
    }
  }

  // Handle API errors consistently
  static handleAPIError(error, type) {
    if (error.response?.status === 429) {
      console.error(`⚠️ API Rate limit exceeded for ${type} update`);
    } else if (error.response?.status === 401) {
      console.error(`🔑 API Authentication failed for ${type} update`);
    } else if (error.code === 'ECONNABORTED') {
      console.error(`⏰ Request timeout for ${type} update`);
    } else {
      console.error(`❌ Error fetching ${type} from Football API:`, error.message);
    }
  }

  // Timestamp management for schedule updates
  static async getLastScheduleUpdateTime() {
    try {
      const result = await query(`
        SELECT value FROM system_settings WHERE key = 'last_schedule_update'
      `);
      return result.rows[0]?.value || '2025-01-01 00:00:00';
    } catch (error) {
      console.error('❌ Error getting last schedule update time:', error);
      return '2025-01-01 00:00:00';
    }
  }

  static async setLastScheduleUpdateTime() {
    try {
      await query(`
        INSERT INTO system_settings (key, value) 
        VALUES ('last_schedule_update', $1)
        ON CONFLICT (key) DO UPDATE SET 
          value = EXCLUDED.value,
          updated_at = CURRENT_TIMESTAMP
      `, [new Date().toISOString()]);
    } catch (error) {
      console.error('❌ Error setting last schedule update time:', error);
    }
  }

  // Timestamp management for results updates  
  static async getLastResultsUpdateTime() {
    try {
      const result = await query(`
        SELECT value FROM system_settings WHERE key = 'last_results_update'
      `);
      return result.rows[0]?.value || '2025-01-01 00:00:00';
    } catch (error) {
      console.error('❌ Error getting last results update time:', error);
      return '2025-01-01 00:00:00';
    }
  }

  static async setLastResultsUpdateTime() {
    try {
      await query(`
        INSERT INTO system_settings (key, value) 
        VALUES ('last_results_update', $1)
        ON CONFLICT (key) DO UPDATE SET 
          value = EXCLUDED.value,
          updated_at = CURRENT_TIMESTAMP
      `, [new Date().toISOString()]);
    } catch (error) {
      console.error('❌ Error setting last results update time:', error);
    }
  }

  // Legacy methods for backward compatibility
  static async updateMatches() {
    // For backward compatibility, do both
    const scheduleResult = await this.updateSchedule();
    const resultsResult = await this.updateResults();
    
    return {
      success: true,
      schedule: scheduleResult,
      results: resultsResult
    };
  }

  static async manualUpdate() {
    console.log('🔧 Manual update triggered - doing both schedule and results');
    return await this.updateMatches();
  }

  // Get legacy timestamp for compatibility
  static async getLastUpdateTime() {
    return await this.getLastResultsUpdateTime();
  }

  static async setLastUpdateTime() {
    return await this.setLastResultsUpdateTime();
  }
}