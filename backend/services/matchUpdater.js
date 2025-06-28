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
    let newlyFinishedMatches = 0;
    let hasAnyUpdates = false;

    // Process each match
    for (const match of matches) {
      try {
        // Check if this match was previously not finished
        const existingMatch = await this.getMatchByExternalId(match.fixture.id);
        const wasFinished = existingMatch?.status === 'finished';
        
        const saved = await MatchService.saveMatch(match);
        if (saved) {
          updatedResults++;
          hasAnyUpdates = true;
          
          // Only count as newly finished if it wasn't finished before
          if (match.fixture.status.short === 'FT' && !wasFinished) {
            newlyFinishedMatches++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing result ${match.fixture.id}:`, error.message);
      }
    }

    // 🔄 MODIFICA: Controlla eliminazioni dopo aggiornamenti
    if (newlyFinishedMatches > 0 || hasAnyUpdates) {
      console.log(`🔍 Checking team eliminations...`);
      try {
        await MatchService.checkEliminatedTeams();
        console.log('✅ Team elimination check completed');
      } catch (error) {
        console.error('❌ Error in elimination check:', error);
      }
    }

    // Recalculate leaderboard if we have any updates to finished matches
    // OR if we have newly finished matches
    if (newlyFinishedMatches > 0) {
      console.log(`🏆 Recalculating leaderboard due to ${newlyFinishedMatches} newly finished matches...`);
      await LeaderboardService.recalculateLeaderboard();
    } else if (hasAnyUpdates) {
      // Check if any finished matches were updated (score corrections, etc.)
      const hasFinishedMatches = await this.hasFinishedMatches();
      if (hasFinishedMatches) {
        console.log('🏆 Recalculating leaderboard due to updates in finished matches...');
        await LeaderboardService.recalculateLeaderboard();
      }
    }

    // Update results timestamp
    await this.setLastResultsUpdateTime();

    console.log(`✅ Results update completed:`);
    console.log(`   - Updated results: ${updatedResults}`);
    console.log(`   - Newly finished matches: ${newlyFinishedMatches}`);
    console.log(`   - Leaderboard updated: ${newlyFinishedMatches > 0 ? 'Yes' : 'No'}`);

    return {
      success: true,
      type: 'results',
      updatedResults,
      newlyFinishedMatches,
      leaderboardUpdated: newlyFinishedMatches > 0
    };

  } catch (error) {
    console.error('❌ Error in results update:', error);
    throw error;
  }
}

// Helper method to get existing match
static async getMatchByExternalId(externalId) {
  try {
    const result = await query(`
      SELECT * FROM matches WHERE external_id = $1
    `, [externalId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error getting match by external ID:', error);
    return null;
  }
}

// Helper method to check if there are any finished matches
static async hasFinishedMatches() {
  try {
    const result = await query(`
      SELECT COUNT(*) as count FROM matches WHERE status = 'finished'
    `);
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('❌ Error checking finished matches:', error);
    return false;
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
    
    console.log('⚽ Fetching tournament matches with robust date range...');
    
    // 🆕 FINESTRA MOLTO PIÙ AMPIA per non perdere nulla
    const today = new Date();
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const threeDaysAhead = new Date(today);
    threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);
    
    console.log(`📅 Fetching matches from ${fiveDaysAgo.toISOString().split('T')[0]} to ${threeDaysAhead.toISOString().split('T')[0]}`);
    
    const response = await axios.get("https://api-football-v1.p.rapidapi.com/v3/fixtures", {
      params: { 
        league: 15, 
        season: 2025,
        from: fiveDaysAgo.toISOString().split('T')[0],
        to: threeDaysAhead.toISOString().split('T')[0]
      },
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": apiHost,
      },
      timeout: 20000 // Timeout più lungo
    });

    if (!response.data || !response.data.response) {
      throw new Error('Invalid API response format');
    }

    const allMatches = response.data.response;
    console.log(`📊 Total matches received from API: ${allMatches.length}`);

    // 🆕 FILTRO MOLTO PERMISSIVO - prendi quasi tutto quello che potrebbe essere rilevante
    const relevantMatches = allMatches.filter(match => {
      const status = match.fixture.status.short;
      const matchDate = new Date(match.fixture.date);
      const now = new Date();
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      // Includi MOLTE più condizioni per non perdere nulla
      return (
        // 🔴 Tutte le partite live (qualsiasi status che potrebbe essere live)
        ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT', 'BREAK'].includes(status) ||
        // 🏁 Partite finite negli ultimi 2 giorni
        (status === 'FT' && matchDate >= twoDaysAgo) ||
        // 📅 Partite programmate nei prossimi 2 giorni  
        (['NS', 'TBD', 'CANC', 'PST', 'SUSP'].includes(status) && matchDate <= threeDaysAhead) ||
        // 🚨 Qualsiasi altra partita di oggi (per sicurezza)
        (matchDate.toDateString() === now.toDateString())
      );
    });

    // 🆕 LOGGING DETTAGLIATO
    const statusCounts = {};
    allMatches.forEach(match => {
      const status = match.fixture.status.short;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('📈 All status codes in API response:', statusCounts);
    console.log(`📊 Relevant matches after filtering: ${relevantMatches.length}`);
    
    // Log delle partite rilevanti per debug
    relevantMatches.forEach(match => {
      console.log(`   🎯 ${match.teams.home.name} vs ${match.teams.away.name} - ${match.fixture.status.short} - ${match.fixture.date}`);
    });

    return relevantMatches;
    
  } catch (error) {
    console.error('❌ DETAILED API ERROR:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
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