import express from "express";
import cors from "cors";
import classificaRouter from "./routes/classifica.js";
import incontriRouter from "./routes/incontri.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use("/classifica", classificaRouter);
app.use("/incontri", incontriRouter);

app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});
