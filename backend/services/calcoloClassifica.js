import axios from "axios";
import { RAPID_API_KEY, RAPID_API_HOST } from "../config.js";
import { giocatori } from "../data/giocatori.js";

// Add these debug lines
console.log("🔧 calcoloClassifica - API Key loaded:", RAPID_API_KEY ? "✅ Yes" : "❌ No");
console.log("🔧 calcoloClassifica - API Key first 10:", RAPID_API_KEY ? RAPID_API_KEY.substring(0, 10) + "..." : "undefined");
console.log("🔧 calcoloClassifica - Full process.env.RAPID_API_KEY:", process.env.RAPID_API_KEY ? process.env.RAPID_API_KEY.substring(0, 10) + "..." : "undefined");

const trovaProprietario = (teamName) => {
  for (const giocatore of giocatori) {
    if (giocatore.teams.includes(teamName)) {
      return giocatore.name;
    }
  }
  return null;
};

export const calcolaClassifica = async () => {
  const punteggi = {};
  const partiteGiocate = {};
  const pareggi = {};
  const sconfitte = {};

  giocatori.forEach((g) => {
    punteggi[g.name] = 0;
    partiteGiocate[g.name] = 0;
    pareggi[g.name] = 0;
    sconfitte[g.name] = 0;
  });

  try {
    const response = await axios.get("https://api-football-v1.p.rapidapi.com/v3/fixtures", {
      params: { league: 15, season: 2025 },
      headers: {
        "X-RapidAPI-Key": RAPID_API_KEY,
        "X-RapidAPI-Host": RAPID_API_HOST,
      },
    });

    const matches = response.data.response.filter(match => match.fixture.status.short === "FT");

    matches.forEach(match => {
      const homeTeam = match.teams.home.name;
      const awayTeam = match.teams.away.name;
      const homeGoals = match.goals.home;
      const awayGoals = match.goals.away;
      const winner = match.teams.winner?.name || null;
      const status = match.score.penalty ? "KO" : "GRUPPI";

      const homeOwner = trovaProprietario(homeTeam);
      const awayOwner = trovaProprietario(awayTeam);

      if (!homeOwner && !awayOwner) {
        console.warn(`⚠️ Nessun proprietario trovato per ${homeTeam} vs ${awayTeam}`);
        return;
      }

      if (homeOwner) partiteGiocate[homeOwner]++;
      if (awayOwner) partiteGiocate[awayOwner]++;

      if (homeGoals > awayGoals) {
        if (homeOwner) punteggi[homeOwner] += 3;
        if (awayOwner) sconfitte[awayOwner]++;
      } else if (homeGoals < awayGoals) {
        if (awayOwner) punteggi[awayOwner] += 3;
        if (homeOwner) sconfitte[homeOwner]++;
      } else {
        if (homeOwner) {
          punteggi[homeOwner] += 1;
          pareggi[homeOwner]++;
        }
        if (awayOwner) {
          punteggi[awayOwner] += 1;
          pareggi[awayOwner]++;
        }

        if (status === "KO" && winner) {
          const winnerOwner = trovaProprietario(winner);
          if (winnerOwner) {
            punteggi[winnerOwner] += 1;
          }
        }
      }
    });

    return Object.entries(punteggi).map(([name, punti]) => ({
      name,
      punti,
      partite: partiteGiocate[name],
      pareggi: pareggi[name],
      sconfitte: sconfitte[name],
    })).sort((a, b) => b.punti - a.punti);
  } catch (error) {
    console.error("❌ Errore durante il calcolo della classifica:", error);
    return [];
  }
};