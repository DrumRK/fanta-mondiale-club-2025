import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";

export default function ProssimiIncontri() {
  const [partite, setPartite] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIncontri = async () => {
      try {
        setLoading(true);
        const data = await apiService.getIncontriOggi();
        setPartite(data);
        setError(null);
      } catch (err) {
        console.error("Errore nel caricamento degli incontri:", err);
        setError("Impossibile caricare gli incontri. Riprova più tardi.");
      } finally {
        setLoading(false);
      }
    };

    fetchIncontri();
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
      month: "long"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-6"></div>
          <div className="text-xl font-medium text-white">Caricamento incontri live...</div>
          <div className="text-gray-400 mt-2">Sincronizzazione in corso</div>
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

  const partitePerGiorno = partite.reduce((acc, match) => {
    const giorno = formatDateWithCorrectTimezone(match.data);
    if (!acc[giorno]) acc[giorno] = [];
    acc[giorno].push(match);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <span className="mr-3">⚡</span>
          Incontri Live
        </h2>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <p className="text-gray-400">Aggiornamenti in tempo reale</p>
        </div>
        <div className="text-xs text-yellow-400 mt-2">🕐 Orari in timezone italiana (Europe/Rome)</div>
      </div>

      {Object.keys(partitePerGiorno).length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center backdrop-blur-sm">
          <div className="text-6xl mb-6">⚡</div>
          <h3 className="text-2xl font-bold text-white mb-4">Nessuna partita live</h3>
          <p className="text-gray-400 text-lg mb-6">
            Non ci sono partite in programma per oggi.
          </p>
          
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-sm text-gray-400">Prossime partite</div>
              <div className="text-lg font-bold text-blue-400">Nel calendario</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="text-3xl mb-2">🔄</div>
              <div className="text-sm text-gray-400">Aggiornamenti</div>
              <div className="text-lg font-bold text-green-400">Automatici</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm text-gray-400">Statistiche</div>
              <div className="text-lg font-bold text-purple-400">Live</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(partitePerGiorno).map(([giorno, matches]) => (
            <div key={giorno} className="bg-gray-800/50 border border-gray-700 rounded-2xl backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border-b border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white capitalize flex items-center">
                      <span className="mr-3">🔴</span>
                      {giorno}
                    </h3>
                    <p className="text-gray-400 mt-1">{matches.length} partite live</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-400 font-bold text-sm">LIVE</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  {matches.map((match, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-700/50 border border-gray-600/50 rounded-xl p-6 hover:bg-gray-600/50 transition-all duration-200 hover:scale-[1.02] group relative"
                    >
                      {/* Live indicator */}
                      <div className="absolute top-4 right-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-bold text-red-400">LIVE</span>
                        </div>
                      </div>

                      {/* Match Time - FIXED */}
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center px-4 py-2 bg-red-500/20 rounded-full border border-red-500/30">
                          <span className="text-lg font-bold text-red-300">
                            🕐 {formatTimeWithCorrectTimezone(match.data)}
                          </span>
                        </div>
                      </div>

                      {/* Teams */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-center">
                          <div className="font-bold text-white text-xl group-hover:text-blue-300 transition-colors duration-200">
                            {match.home}
                          </div>
                          <div className="text-sm text-blue-400 font-medium mt-2 px-3 py-1 bg-blue-500/20 rounded-full inline-block">
                            {match.homeowner}
                          </div>
                        </div>
                        
                        <div className="mx-8 flex flex-col items-center">
                          <div className="text-4xl mb-2 group-hover:scale-125 transition-transform duration-200">⚡</div>
                          <div className="text-sm font-bold text-gray-400">LIVE</div>
                          <div className="w-16 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mt-2 animate-pulse"></div>
                        </div>
                        
                        <div className="flex-1 text-center">
                          <div className="font-bold text-white text-xl group-hover:text-pink-300 transition-colors duration-200">
                            {match.away}
                          </div>
                          <div className="text-sm text-pink-400 font-medium mt-2 px-3 py-1 bg-pink-500/20 rounded-full inline-block">
                            {match.awayowner}
                          </div>
                        </div>
                      </div>

                      {/* Match Status */}
                      <div className="text-center mt-6">
                        <div className="inline-flex items-center px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                          <span className="text-sm font-medium text-green-300">In corso</span>
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