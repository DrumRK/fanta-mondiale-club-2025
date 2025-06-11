// backend/services/calcoloClassifica.js
import giocatori from "../data/giocatori.js";

const trovaProprietario = (teamName) => {
  for (const giocatore of giocatori) {
    if (giocatore.teams.includes(teamName)) {
      return giocatore.name;
    }
  }
  return null;
};

export const calcolaClassifica = (matches) => {
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

  matches.forEach((match) => {
    const homeTeam = match.teams.home.name;
    const awayTeam = match.teams.away.name;
    const homeGoals = match.goals.home;
    const awayGoals = match.goals.away;
    const faseKO = match.score.penalty !== null;

    const homeOwner = trovaProprietario(homeTeam);
    const awayOwner = trovaProprietario(awayTeam);

    if (homeOwner) partiteGiocate[homeOwner]++;
    if (awayOwner) partiteGiocate[awayOwner]++;

    if (homeGoals > awayGoals) {
      if (homeOwner) punteggi[homeOwner] += 3;
      if (awayOwner) sconfitte[awayOwner]++;
    } else if (homeGoals < awayGoals) {
      if (awayOwner) punteggi[awayOwner] += 3;
      if (homeOwner) sconfitte[homeOwner]++;
    } else {
      // Pareggio nei 90'
      if (homeOwner) {
        punteggi[homeOwner] += 1;
        pareggi[homeOwner]++;
      }
      if (awayOwner) {
        punteggi[awayOwner] += 1;
        pareggi[awayOwner]++;
      }

      // +1 punto extra a chi ha vinto nel KO
      const winnerTeam = match.teams.winner?.name;
      const winnerOwner = trovaProprietario(winnerTeam);
      if (faseKO && winnerOwner) {
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
  }));

  return classificaFinale.sort((a, b) => b.punti - a.punti);
};
