import React, { useState, useEffect } from "react";
import "./App.css";
import List from "../List/list";
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllCaptains,
  setCaptain as setCaptainDB,
  getAllMultiplierOverrides,
  setMultiplierOverride as setMultiplierOverrideDB,
  clearMultiplierOverride as clearMultiplierOverrideDB,
  getAllQualifyingGames,
  setQualifyingGame as setQualifyingGameDB,
  getAllGameweekResults,
  saveGameweekResult as saveGameweekResultDB,
  getUserByUsername
} from '../../supabase/queries';

export default function App() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [mainData, setMainData] = useState(null);
  const [fixturesData, setFixturesData] = useState(null);
  const [activeGameweek, setActiveGameweek] = useState(null);
  const [playerHistory, setPlayerHistory] = useState({});
  const [selectedGameweek, setSelectedGameweek] = useState(null);
  const [jamesPlayerNames, setJamesPlayerNames] = useState([]);
  const [lauriePlayerNames, setLauriePlayerNames] = useState([]);
  const [captainSelections, setCaptainSelections] = useState({});
  const [multiplierOverrides, setMultiplierOverrides] = useState({});
  const [qualifyingGames, setQualifyingGames] = useState({});
  const [gameweekResults, setGameweekResults] = useState({});
  const [userIds, setUserIds] = useState({ james: null, laurie: null });

  // Fetch user IDs from Supabase on mount
  useEffect(() => {
    async function fetchUserIds() {
      try {
        const james = await getUserByUsername('james');
        const laurie = await getUserByUsername('laurie');

        setUserIds({
          james: james?.id || null,
          laurie: laurie?.id || null
        });
      } catch (error) {
        console.error('Error fetching user IDs:', error);
      }
    }
    fetchUserIds();
  }, []);

  // Load all data from Supabase when user IDs are available
  useEffect(() => {
    async function loadSupabaseData() {
      if (!userIds.james || !userIds.laurie) return;

      try {
        // Load all captains for both users
        const jamesCaptains = await getAllCaptains(userIds.james);
        const laurieCaptains = await getAllCaptains(userIds.laurie);

        // Merge captain selections
        const mergedCaptains = {};
        Object.keys(jamesCaptains).forEach(gw => {
          mergedCaptains[gw] = {
            ...mergedCaptains[gw],
            james: jamesCaptains[gw]
          };
        });
        Object.keys(laurieCaptains).forEach(gw => {
          mergedCaptains[gw] = {
            ...mergedCaptains[gw],
            laurie: laurieCaptains[gw]
          };
        });
        setCaptainSelections(mergedCaptains);

        // Load multiplier overrides
        const multipliers = await getAllMultiplierOverrides();
        setMultiplierOverrides(multipliers);

        // Load qualifying games
        const qualifying = await getAllQualifyingGames();
        setQualifyingGames(qualifying);

        // Load gameweek results
        const results = await getAllGameweekResults();
        setGameweekResults(results);
      } catch (error) {
        console.error('Error loading Supabase data:', error);
      }
    }

    loadSupabaseData();
  }, [userIds]);

  useEffect(() => {
    async function fetchFPL() {
      try {
        const bootstrapResponse = await fetch("https://fpl-server-nine.vercel.app/api?endpoint=bootstrap-static");
        if (!bootstrapResponse.ok) {
          throw new Error(`HTTP error! Status: ${bootstrapResponse.status}`);
        }
        const bootstrapData = await bootstrapResponse.json();

        const fixturesResponse = await fetch("https://fpl-server-nine.vercel.app/api?endpoint=fixtures");
        if (!fixturesResponse.ok) {
          throw new Error(`HTTP error! Status: ${fixturesResponse.status}`);
        }
        const fixturesData = await fixturesResponse.json();

        setMainData(bootstrapData);
        setFixturesData(fixturesData);

        const activeEvent = bootstrapData.events.find(event => !event.finished);
        if (activeEvent) {
          setActiveGameweek(activeEvent.id);
          setSelectedGameweek(activeEvent.id);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }

    fetchFPL();
  }, []);

  const fetchPlayerHistory = async (gameweek) => {
    try {
      // Fetch player history from your server instead of directly from the API
      const response = await fetch(`https://fpl-server-nine.vercel.app/api?endpoint=event/${gameweek}/live/`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const historyData = await response.json();
      // Check the fetched data structure
      console.log('Fetched history data:', historyData);
      
      const formattedHistory = {};
      historyData.elements.forEach(player => {
        formattedHistory[player.id] = player.stats;
      });
      setPlayerHistory(formattedHistory);
    } catch (error) {
      console.error("Failed to fetch player history:", error);
    }
  };

  useEffect(() => {
    if (selectedGameweek) {
      fetchPlayerHistory(selectedGameweek);
    }
  }, [selectedGameweek]);

  const handleGameweekChange = (e) => {
    const value = e.target.value;

    // Check for empty input
    if (value === "") {
      setSelectedGameweek(null); // Allow empty input
    } else {
      const numberValue = Number(value);
      if (numberValue >= 1 && numberValue <= 38) {
        setSelectedGameweek(numberValue); // Set valid gameweek
      }
    }
  };

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const appStyle = {
    backgroundImage: `url('${isMobile ? "/seagulls_mobile.png" : "/seagulls.jpg"}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    height: "100vh",
    width: "100%",
    position: "relative",
    overflow: "auto",
  };

  const fetchDataFromGoogleSheets = async () => {
    try {
        const spreadsheetId = process.env.REACT_APP_SPREADSHEET_ID;
        const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
        const sheetName = process.env.REACT_APP_SHEET_NAME;
  
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;
  
        const response = await axios.get(url);
        const data = response.data.values;
  
        const jamesPlayerNames = [];
        const lauriePlayerNames = [];
  
        for (let i = 2; i < data.length; i++) {
            const jamesPlayer = data[i][3]; 
            const lauriePlayer = data[i][4];
            const startingGameweek = data[i][1]; 
            const endingGameweek = data[i][2];
  
            if (jamesPlayer) {
                jamesPlayerNames.push({ name: jamesPlayer.trim(), startingGameweek: Number(startingGameweek), endingGameweek: Number(endingGameweek) });
            }
            if (lauriePlayer) {
                lauriePlayerNames.push({ name: lauriePlayer.trim(), startingGameweek: Number(startingGameweek), endingGameweek: Number(endingGameweek) });
            }
        }
  
        setJamesPlayerNames(jamesPlayerNames);
        setLauriePlayerNames(lauriePlayerNames);
  
    } catch (error) {
        console.error('Error fetching data from Google Sheets:', error);
    }
};
  
  useEffect(() => {
    fetchDataFromGoogleSheets();
  }, [mainData]);

  const setCaptain = async (gameweek, username, playerId) => {
    // Only allow captain selection for GW22 onwards
    if (gameweek < 22) return;

    const userId = userIds[username];
    if (!userId) {
      console.error(`User ID not found for ${username}`);
      return;
    }

    // Update local state optimistically
    setCaptainSelections(prev => ({
      ...prev,
      [`gw${gameweek}`]: {
        ...prev[`gw${gameweek}`],
        [username]: playerId,
        [`${username}Timestamp`]: new Date().toISOString()
      }
    }));

    // Sync to Supabase
    await setCaptainDB(userId, gameweek, playerId);
  };

  const getCaptain = (gameweek, user) => {
    // If captain exists for this gameweek, return it
    if (captainSelections[`gw${gameweek}`]?.[user]) {
      return captainSelections[`gw${gameweek}`][user];
    }
    
    // Otherwise, find the most recent captain selection before this gameweek
    let previousCaptain = null;
    for (let gw = gameweek - 1; gw >= 22; gw--) {
      if (captainSelections[`gw${gw}`]?.[user]) {
        previousCaptain = captainSelections[`gw${gw}`][user];
        break;
      }
    }
    
    return previousCaptain;
  };

  const setMultiplierOverride = async (gameweek, multiplier) => {
    // Update local state optimistically
    setMultiplierOverrides(prev => ({
      ...prev,
      [`gw${gameweek}`]: multiplier
    }));

    // Sync to Supabase
    await setMultiplierOverrideDB(gameweek, multiplier);
  };

  const getMultiplierOverride = (gameweek) => {
    return multiplierOverrides[`gw${gameweek}`] || null;
  };

  const clearMultiplierOverride = async (gameweek) => {
    // Update local state optimistically
    setMultiplierOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[`gw${gameweek}`];
      return newOverrides;
    });

    // Sync to Supabase
    await clearMultiplierOverrideDB(gameweek);
  };

  const setQualifyingGame = async (gameweek, isQualifying) => {
    // Update local state optimistically
    setQualifyingGames(prev => ({
      ...prev,
      [`gw${gameweek}`]: isQualifying
    }));

    // Sync to Supabase
    await setQualifyingGameDB(gameweek, isQualifying);
  };

  const isQualifyingGame = (gameweek) => {
    return qualifyingGames[`gw${gameweek}`] || false;
  };

  const saveGameweekResult = async (gameweek, jamesPoints, lauriePoints, multiplier) => {
    const resultData = {
      jamesPoints,
      lauriePoints,
      multiplier,
      difference: Math.abs(jamesPoints - lauriePoints) * multiplier,
      jamesPaid: jamesPoints < lauriePoints ? Math.abs(jamesPoints - lauriePoints) * multiplier : 0,
      lauriePaid: lauriePoints < jamesPoints ? Math.abs(jamesPoints - lauriePoints) * multiplier : 0
    };

    // Update local state optimistically
    setGameweekResults(prev => ({
      ...prev,
      [`gw${gameweek}`]: resultData
    }));

    // Sync to Supabase
    await saveGameweekResultDB(gameweek, jamesPoints, lauriePoints, multiplier);
  };

  const getGameweekResult = (gameweek) => {
    return gameweekResults[`gw${gameweek}`] || null;
  };

  return (
    <div className="app" style={appStyle}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '#005daa',
        color: 'white',
        borderBottom: '2px solid #004a8a'
      }}>
        <span style={{ fontSize: '16px', fontWeight: '500' }}>
          Logged in as: {user?.displayName}
        </span>
        <button
          onClick={logout}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            color: '#005daa',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          Logout
        </button>
      </div>
      <List
        mainData={mainData}
        fixturesData={fixturesData}
        activeGameweek={activeGameweek}
        playerHistory={playerHistory}
        selectedGameweek={selectedGameweek}
        onGameweekChange={handleGameweekChange}
        jamesPlayerNames={jamesPlayerNames}
        lauriePlayerNames={lauriePlayerNames}
        setCaptain={setCaptain}
        getCaptain={getCaptain}
        captainSelections={captainSelections}
        setMultiplierOverride={setMultiplierOverride}
        getMultiplierOverride={getMultiplierOverride}
        clearMultiplierOverride={clearMultiplierOverride}
        setQualifyingGame={setQualifyingGame}
        isQualifyingGame={isQualifyingGame}
        qualifyingGames={qualifyingGames}
        saveGameweekResult={saveGameweekResult}
        getGameweekResult={getGameweekResult}
        gameweekResults={gameweekResults}
      />
    </div>
  );
}