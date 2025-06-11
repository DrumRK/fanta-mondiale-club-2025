import React, { useState, useRef, useEffect } from "react";

export default function Inni() {
  const [currentPlaying, setCurrentPlaying] = useState(null); // { player: "ROB&CLA", track: 0 }
  const [volume, setVolume] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // Lista giocatori con numero personalizzato di inni
  const giocatori = [
    { 
      name: "ENZO", 
      tracks: [
        { title: "Inno Vittoria", file: "/audio/enzo-1.mp3" },
        { title: "Inno Celebrazione", file: "/audio/enzo-2.mp3" },
        { title: "Inno Leggendario", file: "/audio/enzo-3.mp3" }
      ],
      color: "from-blue-500 to-cyan-500",
      emoji: "🎵"
    },
    { 
      name: "ROB&CLA", 
      tracks: [
        { title: "Inno Duo", file: "/audio/rob-cla-1.mp3" },
        { title: "Inno Potenza", file: "/audio/rob-cla-2.mp3" },
        { title: "Inno Speciale", file: "/audio/rob-cla-3.mp3" },
        { title: "Inno Supremo", file: "/audio/rob-cla-4.mp3" },
        { title: "Inno Immortale", file: "/audio/rob-cla-5.mp3" }
      ],
      color: "from-green-500 to-emerald-500",
      emoji: "🎶"
    },
    { 
      name: "MATTO DI LUSCIANO", 
      tracks: [
        { title: "Inno Casa", file: "/audio/matto-di-lusciano-1.mp3" },
        { title: "Inno Trasferta", file: "/audio/matto-di-lusciano-2.mp3" },
        { title: "Inno Epico", file: "/audio/matto-di-lusciano-3.mp3" }
      ],
      color: "from-purple-500 to-pink-500",
      emoji: "🎤"
    },
    { 
      name: "ZIO ALDO", 
      tracks: [
        { title: "Inno Unico", file: "/audio/zio-aldo-1.mp3" }
      ],
      color: "from-orange-500 to-red-500",
      emoji: "🎺"
    },
    { 
      name: "DANI & CIRO", 
      tracks: [
        { title: "Inno Fratelli", file: "/audio/dani-ciro-1.mp3" },
        { title: "Inno Battaglia", file: "/audio/dani-ciro-2.mp3" },
        { title: "Inno Trionfo", file: "/audio/dani-ciro-3.mp3" }
      ],
      color: "from-yellow-500 to-orange-500",
      emoji: "🎸"
    },
    { 
      name: "MARIO", 
      tracks: [
        { title: "Inno Mario", file: "/audio/mario-1.mp3" }
      ],
      color: "from-indigo-500 to-purple-500",
      emoji: "🥁"
    },
    { 
      name: "UMBERTO", 
      tracks: [
        { title: "Inno Elegante", file: "/audio/umberto-1.mp3" },
        { title: "Inno Potente", file: "/audio/umberto-2.mp3" },
        { title: "Inno Maestoso", file: "/audio/umberto-3.mp3" },
        { title: "Inno Regale", file: "/audio/umberto-4.mp3" },
        { title: "Inno Divino", file: "/audio/umberto-5.mp3" }
      ],
      color: "from-teal-500 to-blue-500",
      emoji: "🎻"
    },
    { 
      name: "BENNY", 
      tracks: [
        { title: "Inno Champion", file: "/audio/benny-1.mp3" },
        { title: "Inno Leggenda", file: "/audio/benny-2.mp3" },
        { title: "Inno Immortale", file: "/audio/benny-3.mp3" }
      ],
      color: "from-pink-500 to-rose-500",
      emoji: "🎹"
    }
  ];

  // Effect per aggiornare il tempo corrente
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentPlaying(null);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentPlaying]);

  // Funzione per riprodurre audio specifico
  const playAudio = (playerName, trackIndex, trackFile) => {
    const audio = audioRef.current;
    const trackId = `${playerName}-${trackIndex}`;
    const currentTrackId = currentPlaying ? `${currentPlaying.player}-${currentPlaying.track}` : null;
    
    if (currentTrackId === trackId && isPlaying) {
      // Pausa se sta già riproducendo lo stesso audio
      audio.pause();
      setIsPlaying(false);
    } else {
      // Ferma l'audio corrente e riproduci quello nuovo
      audio.pause();
      audio.src = trackFile;
      audio.volume = volume;
      
      setCurrentPlaying({ player: playerName, track: trackIndex });
      setCurrentTime(0);
      
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('Errore nella riproduzione audio:', error);
          alert(`Impossibile riprodurre l'inno. Verifica che il file audio esista.`);
        });
    }
  };

  // Funzione per fermare tutto
  const stopAll = () => {
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentPlaying(null);
    setCurrentTime(0);
  };

  // Funzione per cambiare volume
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Formatta il tempo in mm:ss
  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Trova il giocatore e track correnti
  const getCurrentTrack = () => {
    if (!currentPlaying) return null;
    const player = giocatori.find(g => g.name === currentPlaying.player);
    const track = player?.tracks[currentPlaying.track];
    return { player: player?.name, track: track?.title };
  };

  const currentTrackInfo = getCurrentTrack();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
          <span className="mr-4">🎵</span>
          Inni dei Giocatori
        </h2>
        <p className="text-gray-400 text-lg">Ogni giocatore ha la sua collezione personalizzata di inni</p>
      </div>

      {/* Audio Controls */}
      {currentPlaying && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="text-2xl animate-pulse">🎵</div>
              <div>
                <div className="text-lg font-bold text-white">
                  {currentTrackInfo?.player} - {currentTrackInfo?.track}
                </div>
                <div className="text-sm text-gray-400">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
            </div>
            
            <button
              onClick={stopAll}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105"
            >
              ⏹️ Stop
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-200"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            ></div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-400">🔊 Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-400 w-12">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Griglia Giocatori */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {giocatori.map((giocatore, playerIndex) => {
          const hasActiveTrack = currentPlaying?.player === giocatore.name;
          
          return (
            <div 
              key={giocatore.name}
              className={`bg-gray-800/50 border-2 rounded-2xl backdrop-blur-sm overflow-hidden transition-all duration-300 ${
                hasActiveTrack 
                  ? `border-purple-500 shadow-lg shadow-purple-500/25` 
                  : 'border-gray-700'
              }`}
            >
              {/* Player Header */}
              <div className={`p-6 bg-gradient-to-r ${giocatore.color} bg-opacity-20 border-b border-gray-700`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${giocatore.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                    {giocatore.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white">
                      {giocatore.name}
                    </h3>
                    <p className="text-gray-400">
                      {giocatore.tracks.length} inni disponibili
                    </p>
                  </div>
                  <div className="text-4xl">
                    {giocatore.emoji}
                  </div>
                </div>
              </div>

              {/* Track List */}
              <div className="p-6">
                <div className="space-y-3">
                  {giocatore.tracks.map((track, trackIndex) => {
                    const isActiveTrack = currentPlaying?.player === giocatore.name && currentPlaying?.track === trackIndex;
                    
                    return (
                      <button
                        key={trackIndex}
                        onClick={() => playAudio(giocatore.name, trackIndex, track.file)}
                        className={`w-full p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] group ${
                          isActiveTrack
                            ? `bg-gradient-to-r ${giocatore.color} bg-opacity-30 border-2 border-opacity-50 shadow-lg`
                            : 'bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              isActiveTrack 
                                ? `bg-gradient-to-r ${giocatore.color}`
                                : 'bg-gray-600 group-hover:bg-gray-500'
                            }`}>
                              {trackIndex + 1}
                            </div>
                            <div className="text-left">
                              <div className={`font-medium transition-colors duration-200 ${
                                isActiveTrack ? 'text-white' : 'text-gray-300 group-hover:text-white'
                              }`}>
                                {track.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                Traccia {trackIndex + 1}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {isActiveTrack && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-green-300">
                                  {isPlaying ? 'PLAYING' : 'PAUSED'}
                                </span>
                              </div>
                            )}
                            <div className={`text-2xl transition-transform duration-200 ${
                              isActiveTrack ? 'scale-110' : 'group-hover:scale-110'
                            }`}>
                              {isActiveTrack && isPlaying ? '⏸️' : '▶️'}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-8 text-center backdrop-blur-sm">
        <div className="text-6xl mb-4">🎼</div>
        <h3 className="text-2xl font-bold text-white mb-2">Collezioni Musicali</h3>
        <p className="text-gray-400 text-lg mb-4">
          Ogni giocatore ha curato una playlist personalizzata per ogni occasione!
        </p>
        <div className="flex justify-center space-x-4">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse delay-100"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-200"></div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        preload="none"
        style={{ display: 'none' }}
      />
    </div>
  );
}