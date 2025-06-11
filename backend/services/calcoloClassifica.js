import axios from "axios";
import { giocatori } from "../data/giocatori.js";

const trovaProprietario = (team) => {
  for (const g of giocatori) {
    if (g.teams.includes(team)) return g.name;
  }
  return "--";
};

export async function calcolaClassifica() {
  const { data } = await axios.get("https://api-football-v1.p.rapidapi.com/v3/fixtures", {
    params: { league: 15, season: 2025 },
    headers: {
      "X-RapidAPI-Key": process.env.API_KEY,
      "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
    },
  });

  const matches = data.response.filter(m => m.fixture.status.short === "FT");

  const punteggi = {}, partite = {}, pareggi = {}, sconfitte = {};

  giocatori.forEach(g => {
    punteggi[g.name] = 0;
    partite[g.name] = 0;
    pareggi[g.name] = 0;
    sconfitte[g.name] = 0;
  });

  for (const match of matches) {
    const home = match.teams.home.name;
    const away = match.teams.away.name;
    const gHome = match.goals.home;
    const gAway = match.goals.away;
    const status = match.score.penalty ? "KO" : "GRUPPI";

    const pHome = trovaProprietario(home);
    const pAway = trovaProprietario(away);

    if (pHome !== "--") partite[pHome]++;
    if (pAway !== "--") partite[pAway]++;

    if (gHome > gAway) {
      punteggi[pHome] += 3;
      sconfitte[pAway]++;
    } else if (gHome < gAway) {
      punteggi[pAway] += 3;
      sconfitte[pHome]++;
    } else {
      punteggi[pHome] += 1;
      punteggi[pAway] += 1;
      pareggi[pHome]++;
      pareggi[pAway]++;
      const vincente = match.teams.winner?.name;
      const pWin = trovaProprietario(vincente);
      if (status === "KO" && pWin !== "--") {
        punteggi[pWin] += 1;
      }
    }
  }

  return Object.entries(punteggi).map(([name, punti]) => ({
    name,
    punti,
    partite: partite[name],
    pareggi: pareggi[name],
    sconfitte: sconfitte[name],
  })).sort((a, b) => b.punti - a.punti);
}
