import React, { useEffect, useState } from "react";
import axios from "axios";
import { RAPID_API } from "./config"; // ✅ Centralizzazione configurazione

const giocatori = [
  { name: "ENZO", teams: ["Paris Saint Germain", "Borussia Dortmund", "Wydad AC", "Urawa"] },
  { name: "ROB&CLA", teams: ["Palmeiras", "Inter", "Boca Juniors", "Pachuca"] },
  { name: "MATTO DI LUSCIANO", teams: ["Manchester City", "Red Bull Salzburg", "Los Angeles FC", "Auckland City"] },
  { name: "ZIO ALDO", teams: ["Fluminense", "Chelsea", "Monterrey", "Inter Miami"] },
  { name: "DANI & CIRO", teams: ["Flamengo", "Benfica", "Al-Hilal Saudi FC", "Al Ain"] },
  { name: "MARIO", teams: ["River Plate", "FC Porto", "Botafogo", "Mamelodi Sundowns"] },
  { name: "UMBERTO", teams: ["Bayern München", "Atletico Madrid", "Ulsan Hyundai FC", "ES Tunis"] },
  { name: "BENNY", teams: ["Real Madrid", "Juventus", "Al Ahly", "Seattle Sounders"] } // ✅ Fix qui
];

const trovaProprietario = (teamName) => {
  for (const giocatore of giocatori) {
    if (giocatore.teams.includes(teamName)) return giocatore.name;
  }
  console.warn(`❗ Nessun proprietario trovato per: ${teamName}`);
  return "--";
};

export default function ProssimiIncontri() {
  const [partite, setPartite] = useState([]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get(RAPID_API.BASE_URL, {
          params: { league: 15, season: 2025 },
          headers: RAPID_API.HEADERS,
        });

        const todayStr = new Date().toISOString().slice(0, 10);

        const todaysMatches = response.data.response.filter(match =>
          match.fixture.date.startsWith(todayStr)
        );

        setPartite(todaysMatches);
      } catch (err) {
        console.error("❌ Errore nel caricamento dei prossimi incontri:", err);
      }
    };

    fetchMatches();
  }, []);

  const partitePerGiorno = partite.reduce((acc, match) => {
    const giorno = new Date(match.fixture.date).toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
    if (!acc[giorno]) acc[giorno] = [];
    acc[giorno].push(match);
    return acc;
  }, {});

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Prossimi Incontri</h2>
      {Object.keys(partitePerGiorno).length === 0 ? (
        <p className="text-center">Nessuna partita in programma oggi.</p>
      ) : (
        Object.entries(partitePerGiorno).map(([giorno, matches]) => (
          <div key={giorno} className="bg-white shadow-lg rounded-xl p-5 mb-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2 text-center">{giorno}</h3>
            <ul className="space-y-3">
              {matches.map(match => (
                <li key={match.fixture.id} className="border p-3 rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-600 mb-1 text-center">
                    {new Date(match.fixture.date).toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                  <div className="flex justify-between items-center text-center">
                    <span className="flex-1">
                      <strong>{match.teams.home.name}</strong><br />
                      <small>({trovaProprietario(match.teams.home.name)})</small>
                    </span>
                    <span className="mx-3 font-medium">vs</span>
                    <span className="flex-1">
                      <strong>{match.teams.away.name}</strong><br />
                      <small>({trovaProprietario(match.teams.away.name)})</small>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
