import React, { useState, useEffect } from "react";
import "./App.css";
import List from "../List/list";

export default function App() {
  const [data, setData] = useState(null);
  const [mainData, setMainData] = useState(null);
  const [fixturesData, setFixturesData] = useState(null);
  const [activeGameweek, setActiveGameweek] = useState(null);

  useEffect(() => {
    async function fetchFPL() {
      try {
        const response = await fetch("https://fpl-server-nine.vercel.app/api");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setData(data);

        if (data.bootstrapData) {
          setMainData(data.bootstrapData);
          setFixturesData(data.fixturesData);

          const activeEvent = data.bootstrapData.events.find(
            (event) => !event.finished
          );
          if (activeEvent) {
            setActiveGameweek(activeEvent.id);
          }
        } else {
          console.error("bootstrapData is undefined in API response.");
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }

    fetchFPL();
  }, []);

  const isMobile = window.matchMedia("(max-width: 768px)").matches; // Adjust the max-width as needed
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

  return (
    <div className="app" style={appStyle}>
      <List
        mainData={mainData}
        fixturesData={fixturesData}
        activeGameweek={activeGameweek}
      />
    </div>
  );
}
