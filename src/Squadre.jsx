import React from "react";

const players = [
  {
    name: "ENZO",
    teams: [
      "Paris Saint-Germain (FRA)",
      "Borussia Dortmund (GER)",
      "Wydad AC (MAR)",
      "Urawa Red Diamonds (JPN)"
    ]
  },
  {
    name: "ROB&CLA",
    teams: [
      "SE Palmeiras (BRA)",
      "FC Internazionale Milano (ITA)",
      "Atlético de Madrid (ESP)",
      "Mamelodi Sundowns FC (RSA)"
    ]
  },
  {
    name: "MATTO DI LUSCIANO",
    teams: [
      "Manchester City (ENG)",
      "FC Salzburg (AUT)",
      "Los Angeles Football Club (USA)",
      "Auckland City FC (NZL)"
    ]
  },
  {
    name: "ZIO ALDO",
    teams: [
      "CR Flamengo (BRA)",
      "SL Benfica (POR)",
      "Al Hilal (KSA)",
      "Al Ain FC (UAE)"
    ]
  },
  {
    name: "DANI & CIRO",
    teams: [
      "FC Porto (POR)",
      "Al Ahly FC (EGY)",
      "Inter Miami CF (USA)",
      "Seattle Sounders FC (USA)"
    ]
  },
  {
    name: "MARIO",
    teams: [
      "CA River Plate (ARG)",
      "Fluminense FC (BRA)",
      "Chelsea FC (ENG)",
      "Espérance Sportive de Tunis (TUN)"
    ]
  },
  {
    name: "UMBERTO",
    teams: [
      "FC Bayern München (GER)",
      "Atlético Nacional (COL)",
      "Botafogo (BRA)",
      "Auckland City FC (NZL)"
    ]
  },
  {
    name: "BENNY",
    teams: [
      "CA Boca Juniors (ARG)",
      "SL Benfica (POR)",
      "Real Madrid C. F. (ESP)",
      "Manchester City (ENG)"
    ]
  }
];

export default function Squadre() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Squadre dei Giocatori</h1>
      <div className="grid gap-4">
        {players.map((player, index) => (
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
