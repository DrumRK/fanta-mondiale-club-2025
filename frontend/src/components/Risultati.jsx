// components/Risultati.jsx - FIXED TIMEZONE VERSION
import React, { useEffect, useState } from "react";
import { useAppData } from "../context/AppContext";

export default function Risultati() {
  const { data, loading, fetchData } = useAppData();
const [error, setError] = useState(null);

useEffect(() => {
  const loadRisultati = async () => {
    try {
      await fetchData('risultati');
      setError(null);
    } catch (err) {
      console.error("Errore nel caricamento dei risultati:", err);
      setError("Impossibile caricare i risultati. Riprova più tardi.");
    }
  };

  loadRisultati();
}, []);

  // 🕐 FIX TIMEZONE FUNCTIONS
  const formatTimeWithCorrectTimezone = (dateString) => {
    const date = new Date(dateString);
    const correctedDate = new Date(date.getTime() - (2 * 60 * 60 * 1000));
    
    return correctedDate.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateWithCorrectTimezone = (dateString) => {
    const date = new Date(dateString);
    const correctedDate = new Date(date.getTime() - (2 * 60 * 60 * 1000));
    
    return correctedDate.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  if (loading.risultati) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-white">Caricamento risultati...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
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

  // Raggruppa partite per data con timezone corretta
  const partite = data.risultati || [];
  const partitePerGiorno = partite.reduce((acc, match) => {
    const giorno = formatDateWithCorrectTimezone(match.date);
    if (!acc[giorno]) acc[giorno] = [];
    acc[giorno].push(match);
    return acc;
  }, {});

  // Funzione per determinare il vincitore
  const getWinner = (match) => {
    if (match.home_goals > match.away_goals) {
      return { team: match.home, owner: match.homeowner, type: 'home' };
    } else if (match.away_goals > match.home_goals) {
      return { team: match.away, owner: match.awayowner, type: 'away' };
    } else if (match.winner_team && match.winner_owner) {
      return { 
        team: match.winner_team, 
        owner: match.winner_owner, 
        type: match.winner_team === match.home ? 'home' : 'away',
        afterPenalties: true 
      };
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">🏆 Risultati Finali</h2>
        <p className="text-gray-400">Tutte le partite completate del torneo</p>
        <div className="text-xs text-yellow-400 mt-2">🕐 Orari in timezone italiana (Europe/Rome)</div>
      </div>

      {Object.keys(partitePerGiorno).length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center backdrop-blur-sm">
          <div className="text-6xl mb-6">🏆</div>
          <h3 className="text-2xl font-bold text-white mb-4">Nessuna partita completata</h3>
          <p className="text-gray-400 text-lg">
            I risultati appariranno qui non appena le partite saranno completate.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Statistiche rapide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Partite Completate</p>
                  <p className="text-2xl font-bold text-white">{partite.length}</p>
                </div>
                <div className="text-3xl">⚽</div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Gol Totali</p>
                  <p className="text-2xl font-bold text-white">
                    {partite.reduce((acc, match) => acc + (match.home_goals || 0) + (match.away_goals || 0), 0)}
                  </p>
                </div>
                <div className="text-3xl">🎯</div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pareggi</p>
                  <p className="text-2xl font-bold text-white">
                    {partite.filter(match => match.home_goals === match.away_goals).length}
                  </p>
                </div>
                <div className="text-3xl">🤝</div>
              </div>
            </div>
          </div>

          {/* Lista risultati per giorno */}
          {Object.entries(partitePerGiorno).map(([giorno, matches]) => (
            <div key={giorno} className="bg-gray-800/50 border border-gray-700 rounded-2xl backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-b border-gray-700 p-6">
                <h3 className="text-2xl font-bold text-white capitalize flex items-center">
                  <span className="mr-3">📅</span>
                  {giorno}
                </h3>
                <p className="text-gray-400 mt-1">{matches.length} partite completate</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  {matches.map((match, index) => {
                    const winner = getWinner(match);
                    
                    return (
                      <div 
                        key={match.id || index} 
                        className="bg-gray-700/50 border border-gray-600/50 rounded-xl p-6 hover:bg-gray-600/50 transition-all duration-200 hover:scale-[1.02] group"
                      >
                        {/* Header con orario - FIXED */}
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                            <span className="text-sm font-medium text-green-300">
                              🏁 {formatTimeWithCorrectTimezone(match.date)} - Completata
                            </span>
                          </div>
                        </div>

                        {/* Squadre e risultato */}
                        <div className="flex items-center justify-between">
                          {/* Squadra Casa */}
                          <div className={`flex-1 text-center p-4 rounded-xl transition-all duration-300 ${
                            winner?.type === 'home' 
                              ? 'bg-green-500/20 border-2 border-green-500/50 transform scale-105' 
                              : 'bg-gray-600/30'
                          }`}>
                            <div className="font-bold text-white text-xl mb-2">
                              {match.home}
                              {winner?.type === 'home' && <span className="ml-2">👑</span>}
                            </div>
                            <div className="text-sm text-blue-400 font-medium mb-3">
                              {match.homeowner}
                            </div>
                            <div className={`text-4xl font-bold mb-2 ${
                              winner?.type === 'home' ? 'text-green-400' : 'text-gray-300'
                            }`}>
                              {match.home_goals}
                            </div>
                          </div>
                          
                          {/* Separatore centrale con info aggiuntive */}
                          <div className="mx-6 flex flex-col items-center">
                            <div className="text-2xl mb-2">⚽</div>
                            <div className="text-sm font-bold text-gray-400 mb-2">VS</div>
                            {winner?.afterPenalties && (
                              <div className="text-xs text-yellow-400 font-bold bg-yellow-500/20 px-2 py-1 rounded">
                                RIGORI
                              </div>
                            )}
                            {match.is_knockout && (
                              <div className="text-xs text-red-400 font-bold bg-red-500/20 px-2 py-1 rounded mt-1">
                                ELIMINAZIONE
                              </div>
                            )}
                          </div>
                          
                          {/* Squadra Ospite */}
                          <div className={`flex-1 text-center p-4 rounded-xl transition-all duration-300 ${
                            winner?.type === 'away' 
                              ? 'bg-green-500/20 border-2 border-green-500/50 transform scale-105' 
                              : 'bg-gray-600/30'
                          }`}>
                            <div className="font-bold text-white text-xl mb-2">
                              {match.away}
                              {winner?.type === 'away' && <span className="ml-2">👑</span>}
                            </div>
                            <div className="text-sm text-pink-400 font-medium mb-3">
                              {match.awayowner}
                            </div>
                            <div className={`text-4xl font-bold mb-2 ${
                              winner?.type === 'away' ? 'text-green-400' : 'text-gray-300'
                            }`}>
                              {match.away_goals}
                            </div>
                          </div>
                        </div>

                        {/* Footer con vincitore */}
                        <div className="text-center mt-6">
                          {winner ? (
                            <div className="inline-flex items-center px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30">
                              <span className="text-lg font-bold text-green-300">
                                🏆 Vincitore: {winner.owner}
                                {winner.afterPenalties && " (ai rigori)"}
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                              <span className="text-lg font-bold text-yellow-300">
                                🤝 Pareggio
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}