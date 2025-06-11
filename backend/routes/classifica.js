import express from "express";
import { calcolaClassifica } from "../services/calcoloClassifica.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const classifica = await calcolaClassifica();
    res.json(classifica);
  } catch (err) {
    console.error("Errore classifica:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
