import React, { useState, useEffect } from "react";
import Classifica from "./components/Classifica";
import Calendario from "./components/Calendario";
import ProssimiIncontri from "./components/ProssimiIncontri";
import Squadre from "./components/Squadre";
import Regolamento from "./components/Regolamento";
import Risultati from "./components/Risultati"; // 🎯 NUOVO IMPORT!

export default function FantaMondialeApp() {
  const [activeTab, setActiveTab] = useState("classifica");
  const [darkMode, setDarkMode] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  const tabs = [
    { id: "classifica", label: "Classifica", icon: "🏆" },
    { id: "calendario", label: "Calendario", icon: "📅" },
    { id: "prossimi", label: "Live", icon: "⚡" },
    { id: "risultati", label: "Risultati", icon: "🎯" }, // 🎯 NUOVA TAB!
    { id: "squadre", label: "Squadre", icon: "👥" },
    { id: "regolamento", label: "Regole", icon: "📋" }
  ];

  const renderContent = () => {
    switch(activeTab) {
      case "classifica": return <Classifica />;
      case "calendario": return <Calendario />;
      case "prossimi": return <ProssimiIncontri />;
      case "risultati": return <Risultati />; // 🎯 NUOVO CASO!
      case "squadre": return <Squadre />;
      case "regolamento": return <Regolamento />;
      default: return <Classifica />;
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-opacity-80 border-b border-opacity-20 border-gray-200">
        <div className={`${darkMode ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-md`}>
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">⚽</div>
                <div>
                  <h1 className={`text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent`}>
                    Fanta Mondiale 2025
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isConnected ? 'Sistema attivo' : 'Sistema offline'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                } hover:scale-110`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                activeTab === tab.id
                  ? darkMode 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : darkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="animate-fadeIn">
          <div className={darkMode ? 'text-white' : 'text-gray-900'}>
            {renderContent()}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}