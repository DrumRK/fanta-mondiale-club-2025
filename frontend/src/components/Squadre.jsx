import React, { useEffect, useState } from "react";
import { useAppData } from "../context/AppContext";

export default function Squadre() {
  const { data, loading, fetchData } = useAppData();
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSquadre = async () => {
      try {
        console.log('🔄 Caricamento squadre...');
        await fetchData('squadre');
        console.log('✅ Squadre caricate:', data.squadre);
        setError(null);
      } catch (err) {
        console.error("❌ Errore nel caricamento delle squadre:", err);
        setError("Impossibile caricare le squadre. Riprova più tardi.");
      }
    };

    loadSquadre();
  }, [fetchData]);

  // Debug logs
  useEffect(() => {
    console.log('🔍 Stato componente Squadre:', {
      loading: loading.squadre,
      hasData: !!data.squadre,
      dataLength: data.squadre?.length,
      error
    });
  }, [loading, data, error]);

  if (loading.squadre) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-white">Caricamento squadre...</div>
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

  // ✅ CORRETTO: Sposta la dichiarazione fuori dal JSX
  const giocatori = data.squadre || [];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">👥 Squadre dei Giocatori</h2>
        <p className="text-gray-400">Ogni giocatore ha selezionato 4 squadre per il torneo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {giocatori.map((player, index) => {
          // Calcola squadre attive per questo giocatore
          const activeTeams = player.teams?.filter(team => !team.eliminated).length || 0;
          const totalTeams = player.teams?.length || 0;
          
          return (
            <div 
              key={player.name || index} 
              className="bg-gray-800/50 border border-gray-700 rounded-2xl backdrop-blur-sm overflow-hidden hover:scale-105 transition-all duration-300 hover:bg-gray-700/50"
            >
              <div className="p-6">
                {/* Player Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">{player.name}</h3>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {player.name?.charAt(0) || '?'}
                  </div>
                </div>

                {/* Teams List */}
                <div className="space-y-3">
                  {(player.teams || []).map((team, idx) => {
                    const isEliminated = team.eliminated || false;
                    const eliminationReason = team.elimination_reason;
                    
                    // Determina l'icona e il colore in base al motivo dell'eliminazione
                    const getEliminationDisplay = () => {
                      if (!isEliminated) return { icon: (idx + 1), color: 'bg-gradient-to-r from-green-400 to-blue-500' };
                      
                      switch (eliminationReason) {
                        case 'Group stage elimination':
                          return { icon: '🏁', color: 'bg-orange-500', reason: 'Eliminata ai gironi' };
                        case 'Knockout stage defeat':
                          return { icon: '⚔️', color: 'bg-red-500', reason: 'Eliminata ai playoff' };
                        default:
                          return { icon: '❌', color: 'bg-gray-500', reason: 'Eliminata' };
                      }
                    };
                    
                    const elimination = getEliminationDisplay();
                    
                    return (
                      <div 
                        key={`${player.name}-${idx}`} 
                        className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] group border border-gray-600/30 ${
                          isEliminated 
                            ? 'bg-gray-800/30 opacity-50 grayscale' 
                            : 'bg-gray-700/50 hover:bg-gray-600/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md group-hover:scale-110 transition-all duration-200 ${
                          isEliminated 
                            ? elimination.color
                            : 'bg-gradient-to-r from-green-400 to-blue-500'
                        }`}>
                          {elimination.icon}
                        </div>
                        
                        <div className="flex-1">
                          <span className={`font-medium transition-colors duration-200 block ${
                            isEliminated 
                              ? 'text-gray-500 line-through' 
                              : 'text-gray-200 group-hover:text-white'
                          }`}>
                            {team.name || team}
                          </span>
                          
                          {isEliminated && elimination.reason && (
                            <div className="text-xs text-red-400 mt-1">
                              {elimination.reason}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {isEliminated ? '💀' : '⚽'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stats Footer con contatore dinamico */}
                <div className="mt-6 pt-4 border-t border-gray-700/50">
                  {/* CONTATORE DINAMICO */}
                  <div className="text-center mb-4">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full border font-bold text-sm ${
                      activeTeams === totalTeams 
                        ? 'bg-green-500/20 border-green-500/30 text-green-300'
                        : activeTeams > totalTeams / 2 
                        ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
                        : activeTeams > 0
                        ? 'bg-orange-500/20 border-orange-500/30 text-orange-300'
                        : 'bg-red-500/20 border-red-500/30 text-red-300'
                    }`}>
                      <span className="mr-2">
                        {activeTeams === totalTeams ? '🎯' : 
                         activeTeams > totalTeams / 2 ? '⚠️' : 
                         activeTeams > 0 ? '🚨' : '💀'}
                      </span>
                      Squadre: {activeTeams}/{totalTeams}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Squadre Attive</span>
                      <span className="text-green-400 font-bold">
                        {activeTeams}
                      </span>
                    </div>
                    
                    {player.teams?.some(team => team.eliminated && team.elimination_reason === 'Group stage elimination') && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Eliminate ai gironi</span>
                        <span className="text-orange-400 font-bold">
                          {player.teams.filter(team => team.elimination_reason === 'Group stage elimination').length}
                        </span>
                      </div>
                    )}
                    
                    {player.teams?.some(team => team.eliminated && team.elimination_reason === 'Knockout stage defeat') && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Eliminate ai playoff</span>
                        <span className="text-red-400 font-bold">
                          {player.teams.filter(team => team.elimination_reason === 'Knockout stage defeat').length}
                        </span>
                      </div>
                    )}

                    {/* Fallback per eliminazioni generiche */}
                    {player.teams?.some(team => team.eliminated && !team.elimination_reason) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Eliminate</span>
                        <span className="text-gray-400 font-bold">
                          {player.teams.filter(team => team.eliminated && !team.elimination_reason).length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(!data.squadre || data.squadre.length === 0) && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center backdrop-blur-sm">
          <div className="text-6xl mb-6">👥</div>
          <h3 className="text-2xl font-bold text-white mb-4">Nessuna squadra disponibile</h3>
          <p className="text-gray-400 text-lg">
            Le squadre saranno visualizzate qui una volta caricate dal sistema.
          </p>
        </div>
      )}
    </div>
  );
}