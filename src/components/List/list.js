import React, { useState, useEffect } from 'react';
import "./list.css";

const List = ({ mainData, activeGameweek, selectedGameweek, onGameweekChange }) => {
    const elements = mainData?.elements || [];
    const [gameweekData, setGameweekData] = useState(null);
    
    const jamesPlayerNames = ["Adingra", "O'Riley", "Verbruggen", "Minteh", "Enciso", "Estupiñan"];
    const lauriePlayerNames = ["João Pedro", "Mitoma", "Baleba", "Van Hecke", "Georginio", "Ferguson"];

    const brightonPlayers = elements.filter(player => player.team === 5);

    const playersForJames = brightonPlayers
        .filter(player => jamesPlayerNames.includes(player.web_name))
        .sort((a, b) => jamesPlayerNames.indexOf(a.web_name) - jamesPlayerNames.indexOf(b.web_name));

    const playersForLaurie = brightonPlayers
        .filter(player => lauriePlayerNames.includes(player.web_name))
        .sort((a, b) => lauriePlayerNames.indexOf(a.web_name) - lauriePlayerNames.indexOf(b.web_name));

    // State for the multiplier
    const [multiplier, setMultiplier] = useState(2); // Default multiplier

    // Fetch gameweek data based on selectedGameweek
    useEffect(() => {
        const fetchGameweekData = async () => {
            try {
                const response = await fetch(`https://fpl-server-nine.vercel.app/api?endpoint=event/${selectedGameweek}/live/`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const gameweekStats = await response.json();
                setGameweekData(gameweekStats);
            } catch (error) {
                console.error("Failed to fetch gameweek data:", error);
            }
        };

        if (selectedGameweek) {
            fetchGameweekData();
        }
    }, [selectedGameweek]);

    const getPlayerPoints = (playerId) => {
        if (selectedGameweek === activeGameweek) {
            const player = elements.find(player => player.id === playerId);
            return player ? player.event_points : 0; // Current event points
        }

        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.total_points : 0; // Total points for the selected GW
        }

        return 0; // Default to 0 if no data available
    };

    const handleGameweekInputChange = (e) => {
        const value = Number(e.target.value);
        if (value >= 1 && value <= 38) {
            onGameweekChange(e); // Call the parent handler to set the gameweek
        }
    };

    const totalPointsJames = playersForJames.reduce((sum, player) => sum + getPlayerPoints(player.id), 0);
    const totalPointsLaurie = playersForLaurie.reduce((sum, player) => sum + getPlayerPoints(player.id), 0);

    const calculateOutcome = () => {
        const pointDifference = Math.abs(totalPointsJames - totalPointsLaurie) * multiplier;
        if (totalPointsJames > totalPointsLaurie) {
            return `Laurie pays James £${pointDifference}`;
        } else if (totalPointsLaurie > totalPointsJames) {
            return `James pays Laurie £${pointDifference}`;
        } else {
            return "It's a draw";
        }
    };

    return (
        <div>
            <p className="outcome"><strong>{calculateOutcome()}</strong></p>
            {/* <p className="gameweek">Active GW: <strong>{activeGameweek}</strong></p> */}
            
            <div className="input-container">
                <label htmlFor="gameweek">Current Gameweek: </label>
                <input
                    id="gameweek"
                    type="number"
                    min="1"
                    max="38"
                    value={selectedGameweek || activeGameweek}
                    onChange={handleGameweekInputChange}
                />
            </div>

            <div className="input-container">
                <label htmlFor="multiplier">Points Multiplier (£): </label>
                <input
                    type="number"
                    id="multiplier"
                    value={multiplier}
                    onChange={(e) => setMultiplier(Number(e.target.value))}
                    min="0"
                />
            </div>

            <div className="player-columns">
                <div className="player-column">
                    <p className="column-title"><strong>James Players</strong></p>
                    <p className="total-points">Total Points: <strong>{totalPointsJames}</strong></p>
                    {playersForJames.length > 0 ? (
                        <div className="pics-wrapper">
                            {playersForJames.map((player, index) => (
                                <div key={player.code} className="player-pic-container">
                                    <img
                                        className="player-pic"
                                        src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`}
                                        onError={(e) => { e.target.src = "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_36-110.png"; }}
                                        alt={`player-${index + 1}`}
                                    />
                                    <p className="player-stat-name">{player.web_name}: <strong>{getPlayerPoints(player.id)}</strong></p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No players found for James.</p>
                    )}
                </div>

                <div className="player-column">
                    <p className="column-title"><strong>Laurie Players</strong></p>
                    <p className="total-points">Total Points: <strong>{totalPointsLaurie}</strong></p>
                    {playersForLaurie.length > 0 ? (
                        <div className="pics-wrapper">
                            {playersForLaurie.map((player, index) => (
                                <div key={player.code} className="player-pic-container">
                                    <img
                                        className="player-pic"
                                        src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`}
                                        onError={(e) => { e.target.src = "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_36-110.png"; }}
                                        alt={`player-${index + 1}`}
                                    />
                                    <p className="player-stat-name">{player.web_name}: <strong>{getPlayerPoints(player.id)}</strong></p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No players found for Laurie.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default List;
