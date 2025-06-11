import React from "react";

export default function Regolamento() {
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Regolamento</h2>
      <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
        <p>- Ogni partecipante ha 1000 crediti per l'acquisto delle squadre.</p>
        <p>- Ogni partecipante può acquistare 4 squadre, una per ciascuna fascia.</p>
        <p>- Non è possibile acquistare più di una squadra dello stesso girone.</p>
        <p>- L'asta per le squadre è libera: nessun prezzo minimo o massimo.</p>
        <p>- Sistema di punteggio:</p>
        <ul className="list-disc list-inside ml-4">
          <li>Vittoria nei 90 minuti: 3 punti</li>
          <li>Pareggio nei 90 minuti: 1 punto a testa</li>
          <li>Sconfitta nei 90 minuti: 0 punti</li>
          <li>In caso di pareggio nei 90 minuti durante la fase ad eliminazione diretta:</li>
          <ul className="list-disc list-inside ml-6">
            <li>+1 punto a entrambe le squadre</li>
            <li>+1 punto extra alla squadra che passa il turno</li>
          </ul>
        </ul>
        <p>- Premi finali:</p>
        <ul className="list-disc list-inside ml-4">
          <li>Vincitore con più punti totali</li>
          <li>Giocatore con la squadra vincitrice del torneo</li>
        </ul>
      </div>
    </div>
  );
}
