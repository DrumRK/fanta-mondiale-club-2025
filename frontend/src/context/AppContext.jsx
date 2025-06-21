import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AppContext = createContext();

export const useAppData = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppData must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Stati per i dati
  const [data, setData] = useState({
    classifica: null,
    calendario: null,
    incontri: null,
    risultati: null,
    squadre: null,
  });
  
  // Stati di caricamento
  const [loading, setLoading] = useState({
    classifica: false,
    calendario: false,
    incontri: false,
    risultati: false,
    squadre: false,
  });
  
  // Timestamp ultimo fetch
  const [lastFetch, setLastFetch] = useState({
    classifica: null,
    calendario: null,
    incontri: null,
    risultati: null,
    squadre: null,
  });

  // Durata cache (in millisecondi)
  const CACHE_DURATION = {
    classifica: 5 * 60 * 1000,   // 5 minuti
    calendario: 30 * 60 * 1000,  // 30 minuti
    incontri: 2 * 60 * 1000,     // 2 minuti
    risultati: 10 * 60 * 1000,   // 10 minuti
    squadre: 60 * 60 * 1000,     // 1 ora
  };

  // Controlla se i dati sono freschi
  const isDataFresh = (type) => {
    if (!lastFetch[type]) return false;
    return Date.now() - lastFetch[type] < CACHE_DURATION[type];
  };

  // Funzione principale per fetchare dati
  const fetchData = async (type) => {
    // Se i dati sono freschi, usali
    if (isDataFresh(type) && data[type]) {
      console.log(`✅ Using cached data for ${type}`);
      return data[type];
    }

    // Se già in caricamento, aspetta
    if (loading[type]) {
      console.log(`⏳ Already loading ${type}`);
      return data[type];
    }

    setLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      console.log(`🔄 Fetching fresh data for ${type}`);
      let result;
      
      switch (type) {
        case 'classifica':
          result = await apiService.getClassifica();
          break;
        case 'calendario':
          result = await apiService.getCalendario();
          break;
        case 'incontri':
          result = await apiService.getIncontriOggi();
          break;
        case 'risultati':
          result = await apiService.getRisultati();
          break;
        case 'squadre':
          result = await apiService.getSquadre();
          break;
        default:
          throw new Error(`Unknown data type: ${type}`);
      }

      setData(prev => ({ ...prev, [type]: result }));
      setLastFetch(prev => ({ ...prev, [type]: Date.now() }));
      
      return result;
    } catch (error) {
      console.error(`❌ Error fetching ${type}:`, error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  // Funzione per forzare refresh
  const refreshData = async (type) => {
    setLastFetch(prev => ({ ...prev, [type]: null }));
    return await fetchData(type);
  };

  // Auto-refresh ogni 60 minuti per dati critici
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing critical data...');
      if (data.classifica) fetchData('classifica');
      if (data.incontri) fetchData('incontri');
    }, 60 * 60 * 1000); // 60 minuti

    return () => clearInterval(interval);
  }, [data.classifica, data.incontri]);

  const value = {
    data,
    loading,
    lastFetch,
    fetchData,
    refreshData,
    isDataFresh,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};