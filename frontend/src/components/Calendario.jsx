// components/Calendario.jsx - FIX TIMEZONE
import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";

export default function Calendario() {
  const [partite, setPartite] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCalendario = async () => {
      try {
        setLoading(true);
        const data = await apiService.getCalendario();
        setPartite(data);
        setError(null);
      } catch (err) {
        console.error("Errore nel caricamento del calendario:", err);
        setError("Impossibile caricare il calendario. Riprova più tardi.");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendario();
  }, []);

  // 🕐 FIX TIMEZONE FUNCTION
  const formatTimeWithCorrectTimezone = (dateString) => {
    const date = new Date(dateString);
    
    // Debug log per vedere cosa arriva
    console.log("🕐 Original date:", dateString);
    console.log("🕐 Parsed date:", date);
    
    // Opzione 1: Sottrai 2 ore manualmente
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-white">Caricamento calendario...</div>
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

  // Group matches by day with corrected timezone
  const partitePerGiorno = partite.reduce((acc, match) => {
    const giorno = formatDateWithCorrectTimezone(match.date);
    if (!acc[giorno]) acc[giorno] = [];
    acc[giorno].push(match);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">📅 Calendario Partite</h2>
        <p className="text-gray-400">Tutte le prossime partite del torneo</p>
        <div className="text-xs text-yellow-400 mt-2">🕐 Orari in timezone italiana (Europe/Rome)</div>
      </div>

      {Object.keys(partitePerGiorno).length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center backdrop-blur-sm">
          <div className="text-6xl mb-6">📅</div>
          <h3 className="text-2xl font-bold text-white mb-4">Nessuna partita programmata</h3>
          <p className="text-gray-400 text-lg">
            Il calendario verrà aggiornato non appena saranno disponibili nuove partite.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(partitePerGiorno).map(([giorno, matches]) => (
            <div key={giorno} className="bg-gray-800/50 border border-gray-700 rounded-2xl backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-gray-700 p-6">
                <h3 className="text-2xl font-bold text-white capitalize flex items-center">
                  <span className="mr-3">📆</span>
                  {giorno}
                </h3>
                <p className="text-gray-400 mt-1">{matches.length} partite programmate</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {matches.map(match => (
                    <div 
                      key={match.id} 
                      className="bg-gray-700/50 border border-gray-600/50 rounded-xl p-4 hover:bg-gray-600/50 transition-all duration-200 hover:scale-[1.02] group"
                    >
                      {/* Match Time - FIXED */}
                      <div className="text-center mb-4">
                        <div className="inline-flex items-center px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
                          <span className="text-sm font-medium text-blue-300">
                            🕐 {formatTimeWithCorrectTimezone(match.date)}
                          </span>
                        </div>
                        {/* Debug info - rimuovi in produzione */}
                        <div className="text-xs text-gray-500 mt-1">
                          Debug: {match.date} → {formatTimeWithCorrectTimezone(match.date)}
                        </div>
                      </div>

                      {/* Teams */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-center">
                          <div className="font-bold text-white text-lg group-hover:text-blue-300 transition-colors duration-200">
                            {match.home}
                          </div>
                          <div className="text-sm text-blue-400 font-medium mt-1">
                            ({match.homeowner})
                          </div>
                        </div>
                        
                        <div className="mx-6 flex flex-col items-center">
                          <div className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-200">⚽</div>
                          <div className="text-sm font-bold text-gray-400">VS</div>
                        </div>
                        
                        <div className="flex-1 text-center">
                          <div className="font-bold text-white text-lg group-hover:text-pink-300 transition-colors duration-200">
                            {match.away}
                          </div>
                          <div className="text-sm text-pink-400 font-medium mt-1">
                            ({match.awayowner})
                          </div>
                        </div>
                      </div>

                      {/* Match Status */}
                      <div className="text-center mt-4">
                        <div className="inline-flex items-center px-2 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                          <span className="text-xs font-medium text-green-300">Programmata</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}