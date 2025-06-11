import React from "react";

export default function Regolamento() {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
          <span className="mr-4">📋</span>
          Regolamento Torneo
        </h2>
        <p className="text-gray-400 text-lg">Tutte le regole e meccaniche del Fanta Mondiale per Club 2025</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Budget & Acquisti */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl backdrop-blur-sm overflow-hidden hover:scale-[1.02] transition-all duration-300">
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-gray-700 p-6">
            <h3 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">💰</span>
              Budget & Acquisti
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-1">1</div>
              <p className="text-gray-300">Ogni partecipante ha <span className="font-bold text-green-400">1000 crediti</span> per l'acquisto delle squadre</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-1">2</div>
              <p className="text-gray-300">Ogni partecipante può acquistare <span className="font-bold text-green-400">4 squadre</span>, una per ciascuna fascia</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-1">3</div>
              <p className="text-gray-300">Non è possibile acquistare più di <span className="font-bold text-green-400">una squadra dello stesso girone</span></p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-1">4</div>
              <p className="text-gray-300">L'asta per le squadre è <span className="font-bold text-green-400">libera</span>: nessun prezzo minimo o massimo</p>
            </div>
          </div>
        </div>

        {/* Sistema di Punteggio */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl backdrop-blur-sm overflow-hidden hover:scale-[1.02] transition-all duration-300">
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-gray-700 p-6">
            <h3 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">⚽</span>
              Sistema di Punteggio
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🏆</div>
                <span className="font-medium text-gray-300">Vittoria nei 90 minuti</span>
              </div>
              <div className="text-2xl font-bold text-green-400">+3 punti</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🤝</div>
                <span className="font-medium text-gray-300">Pareggio nei 90 minuti</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">+1 punto</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">❌</div>
                <span className="font-medium text-gray-300">Sconfitta nei 90 minuti</span>
              </div>
              <div className="text-2xl font-bold text-red-400">0 punti</div>
            </div>
          </div>
        </div>

        {/* Eliminazione Diretta */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl backdrop-blur-sm overflow-hidden hover:scale-[1.02] transition-all duration-300">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-gray-700 p-6">
            <h3 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">🎯</span>
              Eliminazione Diretta
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-gray-300 mb-4">In caso di pareggio nei 90 minuti durante la fase ad eliminazione diretta:</p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">+1</div>
                <span className="text-gray-300">Punto a entrambe le squadre per il pareggio</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-pink-500/10 rounded-lg border border-pink-500/20">
                <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">+1</div>
                <span className="text-gray-300">Punto extra alla squadra che passa il turno (rigori/supplementari)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Premi Finali */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl backdrop-blur-sm overflow-hidden hover:scale-[1.02] transition-all duration-300">
          <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-b border-gray-700 p-6">
            <h3 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">🏆</span>
              Premi Finali
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
              <div className="text-3xl">🥇</div>
              <div>
                <div className="font-bold text-yellow-400 text-lg">Vincitore Generale</div>
                <div className="text-gray-300">Giocatore con più punti totali</div>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
              <div className="text-3xl">🎖️</div>
              <div>
                <div className="font-bold text-purple-400 text-lg">Premio Speciale</div>
                <div className="text-gray-300">Giocatore con la squadra vincitrice del torneo</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-8 text-center backdrop-blur-sm">
        <div className="text-6xl mb-4">🍀</div>
        <h3 className="text-2xl font-bold text-white mb-2">Buona fortuna a tutti i partecipanti!</h3>
        <p className="text-gray-400 text-lg">Che vinca il migliore nel Fanta Mondiale per Club 2025!</p>
        <div className="flex justify-center space-x-4 mt-6">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse delay-100"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-200"></div>
        </div>
      </div>
    </div>
  );
}