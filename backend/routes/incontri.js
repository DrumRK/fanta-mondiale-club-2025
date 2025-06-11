import express from "express";
import axios from "axios";
import { giocatori } from "../data/giocatori.js";

const router = express.Router();

const trovaProprietario = (team) => {
  for (const g of giocatori) {
    if (g.teams.includes(team)) return g.name;
  }
  return "--";
};

router.get("/", async (req, res) => {
  try {
    const { data } = await axios.get("https://api-football-v1.p.rapidapi.com/v3/fixtures", {
      params: { league: 15, season: 2025 },
      headers: {
        "X-RapidAPI-Key": process.env.API_KEY,
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
      },
    });

    const oggi = new Date().toISOString().slice(0, 10);

    const incontriOggi = data.response.filter(match =>
      match.fixture.date.slice(0, 10) === oggi
    ).map(match => ({
      data: match.fixture.date,
      home: match.teams.home.name,
      away: match.teams.away.name,
      homeOwner: trovaProprietario(match.teams.home.name),
      awayOwner: trovaProprietario(match.teams.away.name),
    }));

    res.json(incontriOggi);
  } catch (err) {
    console.error("Errore incontri:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
