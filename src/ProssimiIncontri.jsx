import React, { useEffect, useState } from "react";
import axios from "axios";

const giocatori = [
  { name: "ENZO", teams: ["Paris Saint Germain", "Borussia Dortmund", "Wydad AC", "Urawa"] },
  { name: "ROB&CLA", teams: ["Palmeiras", "Inter", "Boca Juniors", "Pachuca"] },
  { name: "MATTO DI LUSCIANO", teams: ["Manchester City", "Red Bull Salzburg", "Los Angeles FC", "Auckland City"] },
  { name: "ZIO ALDO", teams: ["Fluminense", "Chelsea", "Monterrey", "Inter Miami"] },
  { name: "DANI & CIRO", teams: ["Flamengo", "Benfica", "Al-Hilal Saudi FC", "Al Ain"] },
  { name: "MARIO", teams: ["River Plate", "FC Porto", "Botafogo", "Mamelodi Sundowns"] },
  { name: "UMBERTO", teams: ["Bayern München", "Atletico Madrid", "Ulsan Hyundai FC", "ES Tunis"] },
  { name: "BENNY", teams: [, "Real Madrid", "Juventus", "Al Ahly", "Seattle Sounders"] }
];

const trovaProprietario = (teamName) => {
  for (const giocatore of giocatori) {
    if (giocatore.teams.includes(teamName)) {
      return giocatore.name;
    }
  }
  return "--";
};

export default function ProssimiIncontri() {
  const [partite, setPartite] = useState([]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get("https://api-football-v1.p.rapidapi.com/v3/fixtures", {
          params: { league: 15, season: 2025 },
          headers: {
            "X-RapidAPI-Key": "ea94cfdf4bmshf69bdb973c12389p1c0c6fjsn29f022cc6533",
            "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
          },
        });

        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);

        const todaysMatches = response.data.response.filter(match => {
          return match.fixture.date.startsWith(todayStr);
        });

        setPartite(todaysMatches);
      } catch (err) {
        console.error("Errore nel caricamento dei prossimi incontri:", err);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-xl font-semibold mb-3">Prossimi Incontri di Oggi</h2>
      {partite.length === 0 ? (
        <p>Nessuna partita in programma oggi.</p>
      ) : (
        <ul className="space-y-3">
          {partite.map((match) => (
            <li key={match.fixture.id} className="border p-3 rounded">
              <div className="text-sm text-gray-500 mb-1">
                {new Date(match.fixture.date).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="flex justify-between">
                <span>
                  <strong>{match.teams.home.name}</strong> ({trovaProprietario(match.teams.home.name)})
                </span>
                <span className="mx-2">vs</span>
                <span>
                  <strong>{match.teams.away.name}</strong> ({trovaProprietario(match.teams.away.name)})
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}