// backend/routes/classifica.js
import express from "express";
import axios from "axios";
import { calcolaClassifica } from "../services/calcoloClassifica.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const response = await axios.get("https://api-football-v1.p.rapidapi.com/v3/fixtures", {
      params: { league: 15, season: 2025 },
      headers: {
        "X-RapidAPI-Key": "ea94cfdf4bmshf69bdb973c12389p1c0c6fjsn29f022cc6533",
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
      },
    });

    const matches = response.data.response.filter(
      (match) => match.fixture.status.short === "FT"
    );

    const classifica = calcolaClassifica(matches);

    res.json(classifica);
  } catch (error) {
    console.error("Errore nel recupero dei dati per la classifica:", error.message);
    res.status(500).json({ error: "Errore durante il calcolo della classifica." });
  }
});

export default router;
