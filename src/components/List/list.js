import React, { useState, useEffect } from 'react';
import "./list.css";

const normalizeString = (str) => {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

const List = ({ mainData, activeGameweek, selectedGameweek, onGameweekChange, jamesPlayerNames, lauriePlayerNames }) => {
    const elements = mainData?.elements || [];
    const [gameweekData, setGameweekData] = useState(null);

    const brightonPlayers = elements.filter(player => player.team === 5);

    const playersForJames = brightonPlayers
    .filter(player => {
        const matchedPlayer = jamesPlayerNames.find(jamesPlayer => 
            normalizeString(jamesPlayer.name) === normalizeString(player.web_name)
        );
        return matchedPlayer && selectedGameweek >= matchedPlayer.startingGameweek; // Check if the selected gameweek is after the starting gameweek
    })
    .sort((a, b) => {
        const aIndex = jamesPlayerNames.findIndex(jamesPlayer => 
            normalizeString(jamesPlayer.name) === normalizeString(a.web_name)
        );
        const bIndex = jamesPlayerNames.findIndex(jamesPlayer => 
            normalizeString(jamesPlayer.name) === normalizeString(b.web_name)
        );
        return aIndex - bIndex;
    });

    const playersForLaurie = brightonPlayers
    .filter(player => {
        const matchedPlayer = lauriePlayerNames.find(lauriePlayer => 
            normalizeString(lauriePlayer.name) === normalizeString(player.web_name)
        );
        return matchedPlayer && selectedGameweek >= matchedPlayer.startingGameweek;
    })
    .sort((a, b) => {
        const aIndex = lauriePlayerNames.findIndex(lauriePlayer => 
            normalizeString(lauriePlayer.name) === normalizeString(a.web_name)
        );
        const bIndex = lauriePlayerNames.findIndex(lauriePlayer => 
            normalizeString(lauriePlayer.name) === normalizeString(b.web_name)
        );
        return aIndex - bIndex;
    });

    const [multiplier, setMultiplier] = useState(2);

    // Fetch gameweek data based on selectedGameweek
    useEffect(() => {
        const fetchGameweekData = async () => {
            if (selectedGameweek) {
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
            }
        };

        fetchGameweekData();
    }, [selectedGameweek]);

    const getPlayerPoints = (playerId) => {
        if (selectedGameweek === activeGameweek) {
            const player = elements.find(player => player.id === playerId);
            return player ? player.event_points : 0; 
        }

        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.total_points : 0;
        }

        return 0;
    };

    const handleGameweekInputChange = (e) => {
        const value = e.target.value;

        // Allow empty input
        if (value === "") {
            onGameweekChange(e);
        } else {
            const numberValue = Number(value);
            if (numberValue >= 1 && numberValue <= 38) {
                onGameweekChange(e);
            }
        }
    };

    const handleMultiplierChange = (e) => {
        const value = e.target.value;

        // Allow empty input
        if (value === "") {
            setMultiplier(null);
        } else {
            const numberValue = Number(value);
            if (numberValue > 0) {
                setMultiplier(numberValue);
            }
        }
    };

    const handleIncrement = (setter, value, max = 38) => {
        const newValue = Math.min(value + 1, max);
        setter({ target: { value: newValue } });
    };
    
    const handleDecrement = (setter, value, min = 1) => {
        const newValue = Math.max(value - 1, min);
        setter({ target: { value: newValue } });
    };

    const handleMultiplierIncrement = () => {
        setMultiplier((prevMultiplier) => Math.min(prevMultiplier + 1, 10));
    };
    
    const handleMultiplierDecrement = () => {
        setMultiplier((prevMultiplier) => Math.max(prevMultiplier - 1, 0));
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
            return "It's a draw!";
        }
    };

    return (
        <div>
            <p className="outcome"><strong>{calculateOutcome()}</strong></p>
            
            <div className="input-container">
                <label htmlFor="gameweek">Current Gameweek: </label>
                <div className="input-wrapper">
                    <button className="minus-button" onClick={() => handleDecrement(onGameweekChange, selectedGameweek)}> - </button>
                    <input
                        id="gameweek"
                        type="number"
                        min="1"
                        max="38"
                        value={selectedGameweek !== null ? selectedGameweek : ""}
                        onChange={handleGameweekInputChange}
                    />
                    <button className="plus-button" onClick={() => handleIncrement(onGameweekChange, selectedGameweek)}> + </button>
                </div>
            </div>

            <div className="input-container">
                <label htmlFor="multiplier">Points Multiplier (£): </label>
                <div className="input-wrapper">
                    <button className="minus-button" onClick={handleMultiplierDecrement}> - </button>
                    <input
                        id="multiplier"
                        type="number"
                        min="0"
                        value={multiplier !== null ? multiplier : ""}
                        onChange={handleMultiplierChange}
                    />
                    <button className="plus-button" onClick={handleMultiplierIncrement}> + </button>
                </div>
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
                        <p>No players found for James</p>
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
                        <p>No players found for Laurie</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default List;
