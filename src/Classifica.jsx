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
  { name: "BENNY", teams: ["Real Madrid", "Juventus", "Al Ahly", "Seattle Sounders"] }
];

const trovaProprietario = (teamName) => {
  for (const giocatore of giocatori) {
    if (giocatore.teams.includes(teamName)) {
      return giocatore.name;
    }
  }
  return "--";
};

export default function Classifica() {
  const [classifica, setClassifica] = useState([]);

  useEffect(() => {
    const fetchRisultati = async () => {
      try {
        const response = await axios.get("https://api-football-v1.p.rapidapi.com/v3/fixtures", {
          params: { league: 15, season: 2025 },
          headers: {
            "X-RapidAPI-Key": "ea94cfdf4bmshf69bdb973c12389p1c0c6fjsn29f022cc6533",
            "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
          },
        });

        const matches = response.data.response.filter(match => match.fixture.status.short === "FT");

        const punteggi = {};
        const partiteGiocate = {};
        const pareggi = {};
        const sconfitte = {};

        giocatori.forEach(g => {
          punteggi[g.name] = 0;
          partiteGiocate[g.name] = 0;
          pareggi[g.name] = 0;
          sconfitte[g.name] = 0;
        });

        matches.forEach(match => {
          const homeTeam = match.teams.home.name;
          const awayTeam = match.teams.away.name;
          const homeGoals = match.goals.home;
          const awayGoals = match.goals.away;
          const status = match.score.penalty ? "KO" : "GRUPPI";

          const homeOwner = trovaProprietario(homeTeam);
          const awayOwner = trovaProprietario(awayTeam);

          if (homeOwner !== "--") partiteGiocate[homeOwner]++;
          if (awayOwner !== "--") partiteGiocate[awayOwner]++;

          if (homeGoals > awayGoals) {
            punteggi[homeOwner] += 3;
            sconfitte[awayOwner]++;
          } else if (homeGoals < awayGoals) {
            punteggi[awayOwner] += 3;
            sconfitte[homeOwner]++;
          } else {
            punteggi[homeOwner] += 1;
            punteggi[awayOwner] += 1;
            pareggi[homeOwner]++;
            pareggi[awayOwner]++;

            const winnerTeam = match.teams.winner?.name;
            const winnerOwner = trovaProprietario(winnerTeam);
            if (status === "KO" && winnerOwner !== "--") {
              punteggi[winnerOwner] += 1;
            }
          }
        });

        const classificaFinale = Object.entries(punteggi).map(([name, punti]) => ({
          name,
          punti,
          partite: partiteGiocate[name],
          pareggi: pareggi[name],
          sconfitte: sconfitte[name],
        })).sort((a, b) => b.punti - a.punti);

        setClassifica(classificaFinale);
      } catch (err) {
        console.error("Errore nel caricamento della classifica:", err);
      }
    };

    fetchRisultati();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-3xl font-bold mb-6 text-center text-indigo-700">Classifica Fanta Mondiale</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-xl">
          <thead>
            <tr className="bg-indigo-100 text-indigo-900">
              <th className="py-3 px-4 text-left">#</th>
              <th className="py-3 px-4 text-left">Giocatore</th>
              <th className="py-3 px-4 text-center">Punti</th>
              <th className="py-3 px-4 text-center">Partite</th>
              <th className="py-3 px-4 text-center">Pareggi</th>
              <th className="py-3 px-4 text-center">Sconfitte</th>
            </tr>
          </thead>
          <tbody>
            {classifica.map((g, idx) => (
              <tr key={g.name} className="border-t hover:bg-gray-50">
                <td className="py-2 px-4">{idx + 1}</td>
                <td className="py-2 px-4 font-semibold">{g.name}</td>
                <td className="py-2 px-4 text-center">{g.punti}</td>
                <td className="py-2 px-4 text-center">{g.partite}</td>
                <td className="py-2 px-4 text-center text-yellow-700">{g.pareggi}</td>
                <td className="py-2 px-4 text-center text-red-600">{g.sconfitte}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
