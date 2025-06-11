import React, { useState } from "react";
import Classifica from "./Classifica";
import Calendario from "./Calendario";
import ProssimiIncontri from "./ProssimiIncontri";
import Squadre from "./Squadre";
import Regolamento from "./Regolamento";

export default function FantaMondialeApp() {
  const [view, setView] = useState("classifica");

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Fanta Mondiale per Club 2025</h1>
      <div className="flex justify-center flex-wrap gap-4 mb-6">
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setView("classifica")}>Classifica</button>
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setView("calendario")}>Calendario</button>
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setView("prossimi")}>Prossimi Incontri</button>
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setView("squadre")}>Squadre</button>
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setView("regolamento")}>Regolamento</button>
      </div>

      {view === "classifica" && <Classifica />}
      {view === "calendario" && <Calendario />}
      {view === "prossimi" && <ProssimiIncontri />}
      {view === "squadre" && <Squadre />}
      {view === "regolamento" && <Regolamento />}
    </div>
  );
}
