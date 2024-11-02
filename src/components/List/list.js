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
    const [selectedPlayers, setSelectedPlayers] = useState([]);

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

    const getPlayerMinutes = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.minutes : 0;
        }
    };

    const getMinutesPoints = (playerId) => {
        const minutes = getPlayerMinutes(playerId);
        
        if (minutes === 0) return 0;
        if (minutes >= 1 && minutes <= 59) return 1;
        if (minutes >= 60) return 2;
    };

    const getPlayerGoals = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.goals_scored : 0;
        }
    };

    const getGoalsPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const goals = getPlayerGoals(playerId);
    
        if (!player || goals === 0) return 0;
    
        let goalPointsPerGoal;
        switch (player.element_type) {
            case 1: // Goalkeepers
            case 2: // Defenders
                goalPointsPerGoal = 6;
                break;
            case 3: // Midfielders
                goalPointsPerGoal = 5;
                break;
            case 4: // Forwards
                goalPointsPerGoal = 4;
                break;
            default:
                goalPointsPerGoal = 0;
                break;
        }
    
        return goals * goalPointsPerGoal;
    };
    
    const getPlayerAssists = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.assists : 0;
        }
    };

    const getAssistsPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const assists = getPlayerAssists(playerId);
    
        if (!player || assists === 0) return 0;
    
        let assistsPoints = 3;
    
        return assists * assistsPoints;
    };

    const getPlayerCleanSheets = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.clean_sheets : 0;
        }
    };

    const getCleanSheetPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const cleanSheets = getPlayerCleanSheets(playerId);
    
        if (!player || cleanSheets === 0) return 0;
    
        let cleanSheetPointsPerCleanSheet;
        switch (player.element_type) {
            case 1: // Goalkeepers
            case 2: // Defenders
                cleanSheetPointsPerCleanSheet = 4;
                break;
            case 3: // Midfielders
                cleanSheetPointsPerCleanSheet = 1;
                break;
            default:
                cleanSheetPointsPerCleanSheet = 0;
                break;
        }
    
        return cleanSheets * cleanSheetPointsPerCleanSheet;
    };

    const getPlayerPenaltySaves = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.penalties_saved : 0;
        }
    };

    const getPenaltySavesPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const penaltySaves = getPlayerPenaltySaves(playerId);
    
        if (!player || penaltySaves === 0) return 0;
    
        let penaltySavesPoints = 5;
    
        return penaltySaves * penaltySavesPoints;
    };

    const getPlayerSaves = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.saves : 0;
        }
    };

    const getSavesPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const saves = getPlayerSaves(playerId);
    
        if (!player || saves === 0) return 0;
    
        const savesPoints = Math.floor(saves / 3);

        return savesPoints;
    };

    const getPlayerOwnGoals = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.own_goals : 0;
        }
    };

    const getOwnGoalsPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const ownGoals = getPlayerOwnGoals(playerId);
    
        if (!player || ownGoals === 0) return 0;
    
        return ownGoals * -2;
    };

    const getPlayerPenaltiesMissed = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.penalties_missed : 0;
        }
    };

    const getPenaltiesMissedPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const penaltiesMissed = getPlayerPenaltiesMissed(playerId);
    
        if (!player || penaltiesMissed === 0) return 0;
    
        return penaltiesMissed * -2;
    };

    const getPlayerGoalsConceded = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.goals_conceded : 0;
        }
    };

    const getGoalsConcededPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const goalsConceded = getPlayerGoalsConceded(playerId);
    
        if (!player || goalsConceded === 0) return 0;
    
        let goalsConcededPoints;
        switch (player.element_type) {
            case 1: // Goalkeepers
            case 2: // Defenders
                goalsConcededPoints = -Math.floor(goalsConceded / 2);
                break;
            default:
                goalsConcededPoints = 0;
                break;
        }
    
        return goalsConcededPoints;
    };

    const getPlayerYellowCards = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.yellow_cards : 0;
        }
    };

    const getYellowCardsPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const yellowCards = getPlayerYellowCards(playerId);
    
        if (!player || yellowCards === 0) return 0;
    
        return yellowCards * -1;
    };

    const getPlayerRedCards = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.red_cards : 0;
        }
    };

    const getRedCardsPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const redCards = getPlayerRedCards(playerId);
    
        if (!player || redCards === 0) return 0;
    
        return redCards * -3;
    };

    const getPlayerBPS = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.bps : 0;
        }
    };

    const getBPSPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const bps = getPlayerBPS(playerId);
    
        if (!player || bps === 0) return 0;
    
        return bps;
    };

    const getPlayerBonus = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.bonus : 0;
        }
    };

    const getBonusPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const bonus = getPlayerBonus(playerId);
    
        if (!player || bonus === 0) return 0;
    
        return bonus;
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

    const togglePlayer = (playerId) => {
        setSelectedPlayers(prev => 
            prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId] // Toggle player selection
        );
    };

    const PlayerColumn = ({ title, players, totalPoints, getPlayerPoints, getPlayerMinutes, getMinutesPoints, getPlayerGoals, getGoalsPoints, getPlayerAssists, getAssistsPoints }) => (
        <div className="player-column">
            <p className="column-title"><strong>{title} Players</strong></p>
            <p className="total-points">Total Points: <strong>{totalPoints}</strong></p>
            {players.length > 0 ? (
                <div className="pics-wrapper">
                    {players.map((player, index) => (
                        <div key={player.code} className="player-pic-container">
                            <img
                                className="player-pic"
                                src={`https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.code}.png`}
                                onError={(e) => {
                                    e.target.src = "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_36-110.png";
                                    e.target.className = "fallback-pic"; // Add a different class for the fallback image
                                }}
                                alt={`player-${index + 1}`}
                                onClick={() => togglePlayer(player.id)}
                            />
                            <p className="player-stat-name">{player.web_name}: <strong>{getPlayerPoints(player.id)}</strong></p>
                            
                            {selectedPlayers.includes(player.id) && (
                                <p className="player-stat-box">
                                    <p>Minutes: {getPlayerMinutes(player.id)} <strong>[{getMinutesPoints(player.id)}]</strong></p>
                                    {getPlayerGoals(player.id) !== 0 && (
                                        <p>Goals: {getPlayerGoals(player.id)} <strong>[{getGoalsPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerAssists(player.id) !== 0 && (
                                        <p>Assists: {getPlayerAssists(player.id)} <strong>[{getAssistsPoints(player.id)}]</strong></p>
                                    )}
                                    {getCleanSheetPoints(player.id) !== 0 && (
                                        <p>Clean Sheets: {getPlayerCleanSheets(player.id)} <strong>[{getCleanSheetPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerPenaltySaves(player.id) !== 0 && (
                                        <p>Penalty Saves: {getPlayerPenaltySaves(player.id)} <strong>[{getPenaltySavesPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerSaves(player.id) !== 0 && (
                                        <p>Saves: {getPlayerSaves(player.id)} <strong>[{getSavesPoints(player.id)}]</strong></p>
                                    )}
                                    {getGoalsConcededPoints(player.id) !== 0 && (
                                        <p>Conceded: {getPlayerGoalsConceded(player.id)} <strong>[{getGoalsConcededPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerOwnGoals(player.id) !== 0 && (
                                        <p>Own Goals: {getPlayerOwnGoals(player.id)} <strong>[{getOwnGoalsPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerPenaltiesMissed(player.id) !== 0 && (
                                        <p>Penalties Missed: {getPlayerPenaltiesMissed(player.id)} <strong>[{getPenaltiesMissedPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerYellowCards(player.id) !== 0 && (
                                        <p>Yellow Cards: {getPlayerYellowCards(player.id)} <strong>[{getYellowCardsPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerRedCards(player.id) !== 0 && (
                                        <p>Red Cards: {getPlayerRedCards(player.id)} <strong>[{getRedCardsPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerBPS(player.id) !== 0 && (
                                        <p>BPS: {getPlayerBPS(player.id)} <strong>[{getBonusPoints(player.id)}]</strong></p>
                                    )}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p>No players found for {title}</p>
            )}
        </div>
    );

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
                <label htmlFor="multiplier">Points Multiplier(£): </label>
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
                <PlayerColumn
                    title="James"
                    players={playersForJames}
                    totalPoints={totalPointsJames}
                    getPlayerPoints={getPlayerPoints}
                    getPlayerMinutes={getPlayerMinutes}
                    getMinutesPoints={getMinutesPoints}
                    getPlayerGoals={getPlayerGoals}
                    getGoalsPoints={getGoalsPoints}
                    getPlayerAssists={getPlayerAssists}
                    getAssistsPoints={getAssistsPoints}
                    getPlayerCleanSheets={getPlayerCleanSheets}
                    getCleanSheetPoints={getCleanSheetPoints}
                    getPlayerSaves={getPlayerSaves}
                    getSavesPoints={getSavesPoints}
                    getPlayerGoalsConceded={getPlayerGoalsConceded}
                    getGoalsConcededPoints={getGoalsConcededPoints}
                />

                <PlayerColumn
                    title="Laurie"
                    players={playersForLaurie}
                    totalPoints={totalPointsLaurie}
                    getPlayerPoints={getPlayerPoints}
                    getPlayerMinutes={getPlayerMinutes}
                    getMinutesPoints={getMinutesPoints}
                    getPlayerGoals={getPlayerGoals}
                    getGoalsPoints={getGoalsPoints}
                    getPlayerAssists={getPlayerAssists}
                    getAssistsPoints={getAssistsPoints}
                    getPlayerCleanSheets={getPlayerCleanSheets}
                    getCleanSheetPoints={getCleanSheetPoints}
                    getPlayerSaves={getPlayerSaves}
                    getSavesPoints={getSavesPoints}
                    getPlayerGoalsConceded={getPlayerGoalsConceded}
                    getGoalsConcededPoints={getGoalsConcededPoints}
                />
            </div>
        </div>
    );
};

export default List;
