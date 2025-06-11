import React from "react";
import giocatori from "../backend/data/giocatori";

export default function Squadre() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Squadre dei Giocatori</h1>
      <div className="grid gap-4">
        {giocatori.map((player, index) => (
          <div
            key={index}
            className="bg-white shadow-md rounded-xl p-4 border border-gray-200"
          >
            <h2 className="text-lg font-semibold mb-2">{player.name}</h2>
            <ul className="list-disc list-inside">
              {player.teams.map((team, idx) => (
                <li key={idx}>{team}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
