import express from "express";
import axios from "axios";
import { giocatori } from "../data/giocatori.js";
import { RAPID_API_KEY, RAPID_API_HOST } from "../config.js";

const router = express.Router();

const trovaProprietario = (teamName) => {
  for (const giocatore of giocatori) {
    if (giocatore.teams.includes(teamName)) {
      return giocatore.name;
    }
  }
  return "--";
};

router.get("/", async (req, res) => {
  try {
    const response = await axios.get("https://api-football-v1.p.rapidapi.com/v3/fixtures", {
      params: { league: 15, season: 2025 },
      headers: {
        "X-RapidAPI-Key": RAPID_API_KEY,
        "X-RapidAPI-Host": RAPID_API_HOST,
      },
    });

    const futureMatches = response.data.response
      .filter(match => match.fixture.status.short !== "FT")
      .map(match => ({
        id: match.fixture.id,
        date: match.fixture.date,
        home: match.teams.home.name,
        away: match.teams.away.name,
        homeOwner: trovaProprietario(match.teams.home.name),
        awayOwner: trovaProprietario(match.teams.away.name),
        status: match.fixture.status
      }));

    res.json(futureMatches);
  } catch (error) {
    console.error("Errore nel recupero del calendario:", error.message);
    res.status(500).json({ error: "Errore durante il recupero del calendario." });
  }
});

export default router;