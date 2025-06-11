import express from "express";
import { giocatori } from "../data/giocatori.js";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    res.json(giocatori);
  } catch (error) {
    console.error("Errore nel recupero delle squadre:", error.message);
    res.status(500).json({ error: "Errore durante il recupero delle squadre." });
  }
});

export default router;