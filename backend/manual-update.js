import ConfigService from './services/configService.js'; // Load your config service
import { LeaderboardService } from './services/database/leaderboardService.js';

async function forceLeaderboardUpdate() {
  try {
    console.log('🏆 Force recalculating leaderboard...');
    
    const result = await LeaderboardService.recalculateLeaderboard();
    
    console.log('✅ Leaderboard updated successfully!');
    console.log(`📊 Updated ${result.length} players`);
    
    // Show the updated leaderboard
    console.log('\n🏆 Updated leaderboard:');
    result.forEach((player, index) => {
      console.log(`${index + 1}. ${player.name} - ${player.punti} points (W:${player.wins} D:${player.pareggi} L:${player.sconfitte})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating leaderboard:', error);
    process.exit(1);
  }
}

forceLeaderboardUpdate();