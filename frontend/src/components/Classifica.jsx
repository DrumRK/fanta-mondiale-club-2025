import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";

export default function Classifica() {
  const [classifica, setClassifica] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClassifica = async () => {
      try {
        setLoading(true);
        console.log("🔄 Fetching classifica...");
        const data = await apiService.getClassifica();
        console.log("📊 Classifica data received:", data);
        
        if (Array.isArray(data)) {
          setClassifica(data);
        } else {
          console.error("❌ Data is not an array:", data);
          setClassifica([]);
          setError("I dati ricevuti non sono nel formato corretto.");
        }
        setError(null);
      } catch (err) {
        console.error("❌ Errore nel caricamento della classifica:", err);
        setError("Impossibile caricare la classifica. Riprova più tardi.");
        setClassifica([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClassifica();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-6"></div>
          <div className="text-xl font-medium text-white">Caricamento classifica...</div>
          <div className="text-gray-400 mt-2">Elaborazione risultati in corso</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center backdrop-blur-sm">
        <div className="text-6xl mb-4">⚠️</div>
        <div className="text-xl font-bold text-red-400 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (classifica.length === 0) {
    return (
      <div className="space-y-8">
        {/* Statistics Cards - Empty State */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Torneo</p>
                <p className="text-2xl font-bold text-white">In attesa</p>
              </div>
              <div className="text-3xl">🏆</div>
            </div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Partite</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <div className="text-3xl">⚽</div>
            </div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Giocatori</p>
                <p className="text-2xl font-bold text-white">8</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-2xl font-bold text-white">Setup</p>
              </div>
              <div className="text-3xl">⚙️</div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center backdrop-blur-sm">
          <div className="text-6xl mb-6">🏆</div>
          <h3 className="text-3xl font-bold text-white mb-4">Classifica in preparazione</h3>
          <p className="text-gray-400 text-lg mb-8">
            Le statistiche saranno disponibili dopo le prime partite del torneo
          </p>
          
          {/* Scoring Rules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-gray-700/50 rounded-xl p-6 hover:bg-gray-600/50 transition-all duration-200">
              <div className="text-4xl mb-3">🥇</div>
              <div className="text-sm text-gray-400 mb-2">Vittoria</div>
              <div className="text-2xl font-bold text-green-400">+3 punti</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-6 hover:bg-gray-600/50 transition-all duration-200">
              <div className="text-4xl mb-3">🤝</div>
              <div className="text-sm text-gray-400 mb-2">Pareggio</div>
              <div className="text-2xl font-bold text-yellow-400">+1 punto</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-6 hover:bg-gray-600/50 transition-all duration-200">
              <div className="text-4xl mb-3">❌</div>
              <div className="text-sm text-gray-400 mb-2">Sconfitta</div>
              <div className="text-2xl font-bold text-red-400">0 punti</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getRankIcon = (position) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return position;
  };

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Leader</p>
              <p className="text-2xl font-bold text-white">{classifica[0]?.name || "TBD"}</p>
            </div>
            <div className="text-3xl">👑</div>
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Partite Totali</p>
              <p className="text-2xl font-bold text-white">{classifica.reduce((acc, p) => acc + (p.partite || 0), 0)}</p>
            </div>
            <div className="text-3xl">⚽</div>
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Punti Totali</p>
              <p className="text-2xl font-bold text-white">{classifica.reduce((acc, p) => acc + (p.punti || 0), 0)}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Media Punti</p>
              <p className="text-2xl font-bold text-white">
                {classifica.length > 0 ? (classifica.reduce((acc, p) => acc + (p.punti || 0), 0) / classifica.length).toFixed(1) : "0.0"}
              </p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl backdrop-blur-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-gray-700 p-6">
          <h3 className="text-3xl font-bold text-white flex items-center">
            <span className="mr-4">🏆</span>
            Classifica Generale
          </h3>
          <p className="text-gray-400 mt-2">Posizioni aggiornate in tempo reale</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {classifica.map((giocatore, idx) => (
              <div 
                key={giocatore.name || idx} 
                className={`flex items-center justify-between p-6 rounded-xl transition-all duration-200 hover:scale-[1.02] group ${
                  idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' :
                  idx === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30' :
                  idx === 2 ? 'bg-gradient-to-r from-orange-600/20 to-yellow-600/20 border border-orange-600/30' :
                  'bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/30'
                }`}
              >
                <div className="flex items-center space-x-6">
                  {/* Rank */}
                  <div className={`flex items-center justify-center w-14 h-14 rounded-full font-bold text-lg shadow-lg ${
                    idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black' :
                    idx === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-black' :
                    idx === 2 ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-black' :
                    'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  }`}>
                    {getRankIcon(idx + 1)}
                  </div>
                  
                  {/* Player Info */}
                  <div>
                    <p className="font-bold text-white text-xl group-hover:text-purple-300 transition-colors duration-200">
                      {giocatore.name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-400">
                      🎮 {giocatore.partite || 0} partite • 
                      🤝 {giocatore.pareggi || 0} pareggi • 
                      ❌ {giocatore.sconfitte || 0} sconfitte
                    </p>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="text-3xl font-bold text-white group-hover:text-green-300 transition-colors duration-200">
                    {giocatore.punti || 0}
                  </div>
                  <div className="text-sm text-green-400 font-medium">punti</div>
                  {idx === 0 && (
                    <div className="text-xs text-yellow-400 font-bold mt-1">👑 LEADER</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}