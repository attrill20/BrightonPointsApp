import React, { useState, useEffect } from "react";
import "./App.css";
import List from "../List/list";
import axios from 'axios';

export default function App() {
  const [data, setData] = useState(null);
  const [mainData, setMainData] = useState(null);
  const [fixturesData, setFixturesData] = useState(null);
  const [activeGameweek, setActiveGameweek] = useState(null);
  const [playerHistory, setPlayerHistory] = useState({});
  const [selectedGameweek, setSelectedGameweek] = useState(null);
  const [jamesPlayerNames, setJamesPlayerNames] = useState([]);
  const [lauriePlayerNames, setLauriePlayerNames] = useState([]);

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

  return (
    <div className="app" style={appStyle}>
      <List
        mainData={mainData}
        fixturesData={fixturesData}
        activeGameweek={activeGameweek}
        playerHistory={playerHistory}
        selectedGameweek={selectedGameweek}
        onGameweekChange={handleGameweekChange}
        jamesPlayerNames={jamesPlayerNames}
        lauriePlayerNames={lauriePlayerNames}
      />
    </div>
  );
}