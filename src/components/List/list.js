import React, { useState, useEffect } from 'react';
import "./list.css";

const normalizeString = (str) => {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

const List = ({ mainData, fixturesData, activeGameweek, selectedGameweek, onGameweekChange, jamesPlayerNames, lauriePlayerNames }) => {
    const elements = mainData?.elements || [];
    const [gameweekData, setGameweekData] = useState(null);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [gameweekFixture, setGameweekFixture] = useState(null);

    const brightonPlayers = elements.filter(player => player.team === 6);

    const teams = [
        { id: 0, name: "Blank", initial: "NULL", h_diff: 11, a_diff: 11 },
        { id: 1, name: "Arsenal", initial: "ARS", h_diff: 8, a_diff: 9, code: 3 },
        { id: 2, name: "Aston Villa", initial: "AVL", h_diff: 5, a_diff: 10, code: 7 },
        { id: 3, name: "Burnley", initial: "BUR", h_diff: 2, a_diff: 1 },
        { id: 4, name: "Bournemouth", initial: "BOU", h_diff: 4, a_diff: 4, code: 91 },
        { id: 5, name: "Brentford", initial: "BRE", h_diff: 3, a_diff: 6, code: 94 },
        { id: 6, name: "Brighton", initial: "BHA", h_diff: 5, a_diff: 7, code: 36 },
        { id: 7, name: "Chelsea", initial: "CHE", h_diff: 5, a_diff: 4, code: 8 },
        { id: 8, name: "Crystal Palace", initial: "CRY",  h_diff: 5, a_diff: 2, code: 31 },
        { id: 9, name: "Everton", initial: "EVE", h_diff: 6, a_diff: 3, code: 11 },
        { id: 10, name: "Fulham", initial: "FUL", h_diff: 3, a_diff: 6, code: 54 },
        // { id: 10, name: "Ipswich", initial: "IPS", h_diff: 3, a_diff: 6, code: 40 },
        // { id: 11, name: "Leicester", initial: "LEI", h_diff: 3, a_diff: 6, code: 13 },
        { id: 11, name: "Leeds United", initial: "LEE",},
        { id: 12, name: "Liverpool", initial: "LIV", h_diff: 7, a_diff: 10, code: 14 },
        // { id: 13, name: "Luton", initial: "LUT", h_diff: 2, a_diff: 2 },
        { id: 13, name: "Man City", initial: "MCI", h_diff: 7, a_diff: 9, code: 43 },
        { id: 14, name: "Man United", initial: "MUN", h_diff: 6, a_diff: 6, code: 1 },
        { id: 15, name: "Newcastle", initial: "NEW", h_diff: 3, a_diff: 9, code: 4 },
        { id: 16, name: "Notts Forest", initial: "NFO", h_diff: 2, a_diff: 4, code: 17 },
        { id: 17, name: "Sunderland", initial: "SUN", h_diff: 3, a_diff: 6, code: 20 },
        // { id: 17, name: "Southampton", initial: "SOU", h_diff: 3, a_diff: 6, code: 20 },
        // { id: 17, name: "Sheffield Utd", initial: "SHU", h_diff: 1, a_diff: 4 },
        { id: 18, name: "Spurs", initial: "TOT", h_diff: 7, a_diff: 6, code: 6 },
        { id: 19, name: "West Ham", initial: "WHU", h_diff: 6, a_diff: 5, code: 21 },
        { id: 20, name: "Wolves", initial: "WOL", h_diff: 3, a_diff: 5, code: 39 },
      ];

    useEffect(() => {
        if (Array.isArray(fixturesData)) { 
            const fixture = fixturesData.find(
                (fixture) =>
                    fixture.event === selectedGameweek &&
                    (fixture.team_h === 6 || fixture.team_a === 6)
            );
    
            if (fixture) {
                setGameweekFixture(fixture);
            } else {
                setGameweekFixture(null);
            }
        } else {
            setGameweekFixture(null);
        }
    }, [fixturesData, selectedGameweek]);

    const playersForJames = brightonPlayers
    .filter(player => {
        const matchedPlayers = jamesPlayerNames.filter(jamesPlayer => 
            normalizeString(jamesPlayer.name) === normalizeString(player.web_name)
        );
        return matchedPlayers.some(matchedPlayer =>
            selectedGameweek >= matchedPlayer.startingGameweek && // Check if player is above the starting GW
            selectedGameweek < matchedPlayer.endingGameweek // Check if player is below the ending GW
        );
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
        const matchedPlayers = lauriePlayerNames.filter(lauriePlayer => 
            normalizeString(lauriePlayer.name) === normalizeString(player.web_name)
        );
        return matchedPlayers.some(matchedPlayer =>
            selectedGameweek >= matchedPlayer.startingGameweek && // Check if player is above the starting GW
            selectedGameweek < matchedPlayer.endingGameweek // Check if player is below the ending GW
        );
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

    // const getPlayerPoints = (playerId) => {
    //     if (selectedGameweek === activeGameweek) {
    //         const player = elements.find(player => player.id === playerId);
    //         return player ? player.event_points : 0; 
    //     }

    //     if (gameweekData) {
    //         const playerStats = gameweekData.elements.find(player => player.id === playerId);
    //         return playerStats ? playerStats.stats.total_points : 0;
    //     }

    //     return 0;
    // };

    const getPlayerPoints = (playerId) => {
        if (selectedGameweek === activeGameweek) {
            const player = elements.find(player => player.id === playerId);
            if (player) {
                const minutesPoints = getMinutesPoints(playerId);
                const goalsPoints = getGoalsPoints(playerId);
                const assistsPoints = getAssistsPoints(playerId);
                const cleanSheetPoints = getCleanSheetPoints(playerId);
                const penaltySavesPoints = getPenaltySavesPoints(playerId);
                const savesPoints = getSavesPoints(playerId);
                const ownGoalsPoints = getOwnGoalsPoints(playerId);
                const penaltiesMissedPoints = getPenaltiesMissedPoints(playerId);
                const goalsConcededPoints = getGoalsConcededPoints(playerId);
                const yellowCardsPoints = getYellowCardsPoints(playerId);
                const redCardsPoints = getRedCardsPoints(playerId);
                const bpsPoints = calculateFallbackBonusPoints(playerId, gameweekFixture, elements);
                const defensiveContributionPoints = getDefensiveContributionPoints(playerId);
                
                return minutesPoints + goalsPoints + assistsPoints + cleanSheetPoints + penaltySavesPoints + 
                       savesPoints + ownGoalsPoints + penaltiesMissedPoints + goalsConcededPoints + 
                       yellowCardsPoints + redCardsPoints + bpsPoints + defensiveContributionPoints;
            }
            return 0;
        }
    
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            if (playerStats) {
                const minutesPoints = getMinutesPoints(playerId);
                const goalsPoints = getGoalsPoints(playerId);
                const assistsPoints = getAssistsPoints(playerId);
                const cleanSheetPoints = getCleanSheetPoints(playerId);
                const penaltySavesPoints = getPenaltySavesPoints(playerId);
                const savesPoints = getSavesPoints(playerId);
                const ownGoalsPoints = getOwnGoalsPoints(playerId);
                const penaltiesMissedPoints = getPenaltiesMissedPoints(playerId);
                const goalsConcededPoints = getGoalsConcededPoints(playerId);
                const yellowCardsPoints = getYellowCardsPoints(playerId);
                const redCardsPoints = getRedCardsPoints(playerId);
                const bpsPoints = calculateFallbackBonusPoints(playerId, gameweekFixture, elements);
                const defensiveContributionPoints = getDefensiveContributionPoints(playerId);
                
                return minutesPoints + goalsPoints + assistsPoints + cleanSheetPoints + penaltySavesPoints + 
                       savesPoints + ownGoalsPoints + penaltiesMissedPoints + goalsConcededPoints + 
                       yellowCardsPoints + redCardsPoints + bpsPoints + defensiveContributionPoints;
            }
            return 0;
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
    
        return assists * 3;
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
    
        return penaltySaves * 5;
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

    const getPlayerDefensiveContribution = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.defensive_contribution : 0;
        }
        return 0;
    };

    const getPlayerClearancesBlocksInterceptions = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.clearances_blocks_interceptions : 0;
        }
        return 0;
    };

    const getPlayerTackles = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.tackles : 0;
        }
        return 0;
    };

    const getPlayerBallRecoveries = (playerId) => {
        if (gameweekData) {
            const playerStats = gameweekData.elements.find(player => player.id === playerId);
            return playerStats ? playerStats.stats.ball_recoveries || 0 : 0;
        }
        return 0;
    };

    const getDefensiveContributionPoints = (playerId) => {
        const defensiveContribution = getPlayerDefensiveContribution(playerId);
        return defensiveContribution > 0 ? 2 : 0;
    };

    const getTotalDefensiveActions = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        if (!player) return 0;
        
        const cbi = getPlayerClearancesBlocksInterceptions(playerId);
        const tackles = getPlayerTackles(playerId);
        
        // Defenders (element_type 2): Only need CBIT (10 threshold)
        if (player.element_type === 2) {
            return cbi + tackles;
        }
        
        // Midfielders (3) and Forwards (4): Need CBIT + ball recoveries (12 threshold)
        const ballRecoveries = getPlayerBallRecoveries(playerId);
        return cbi + tackles + ballRecoveries;
    };

    const getDefensiveThreshold = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        if (!player) return 0;
        
        // Defenders need 10, others need 12
        return player.element_type === 2 ? 10 : 12;
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

    function calculateFallbackBonusPoints(playerId, gameweekFixture, elements) {
        // Check if gameweekData.elements exists
        if (!gameweekData || !gameweekData.elements) {
            console.error('gameweekData or gameweekData.elements is null');
            return 0; // Return a default value in case of missing data
        }
    
        const topPlayers = gameweekData.elements
            .filter(player =>
                [gameweekFixture.team_h, gameweekFixture.team_a].includes(
                    elements.find(el => el.id === player.id)?.team
                ) && (player.stats?.bps || 0) > 0 // Only include players with BPS > 0
            )
            .sort((a, b) => (b.stats?.bps || 0) - (a.stats?.bps || 0));
    
        // Group players by rank based on their BPS scores
        const topPlayersWithRank = topPlayers.reduce((acc, player, index) => {
            const currentBps = player.stats?.bps || 0;
            const lastGroup = acc[acc.length - 1];
    
            if (lastGroup && lastGroup.bps === currentBps) {
                lastGroup.players.push(player);
            } else {
                acc.push({ rank: acc.length + 1, bps: currentBps, players: [player] });
            }
    
            return acc;
        }, []);
    
        // Identify the rank group that contains the given player ID
        let playerRank = 0;
        topPlayersWithRank.forEach(group => {
            if (group.players.some(player => player.id === playerId)) {
                playerRank = group.rank;
            }
        });
    
        // Bonus Points allocation based on rank
        if (playerRank === 1) return 3;
        if (playerRank === 2) return 2;
        if (playerRank === 3) return 1;
    
        return 0;
    }

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
                            <PlayerImage player={player} togglePlayer={togglePlayer} index={index} />
                            <p className="player-stat-name">{player.web_name}: <strong>{getPlayerPoints(player.id)}</strong></p>
                            
                            {selectedPlayers.includes(player.id) && (
                                <p className="player-stat-box">
                                    <p>Minutes: {getPlayerMinutes(player.id)} <strong className={getMinutesPoints(player.id) > 0 ? 'positive-stat' : ''}>        [{getMinutesPoints(player.id)}]
                                        </strong>
                                    </p>
                                    {getPlayerGoals(player.id) !== 0 && (
                                        <p>Goals: {getPlayerGoals(player.id)} <strong className = 'positive-stat'>[{getGoalsPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerAssists(player.id) !== 0 && (
                                        <p>Assists: {getPlayerAssists(player.id)} <strong className = 'positive-stat'>[{getAssistsPoints(player.id)}]</strong></p>
                                    )}
                                    {getCleanSheetPoints(player.id) !== 0 && (
                                        <p>Clean Sheets: {getPlayerCleanSheets(player.id)} <strong className = 'positive-stat'>[{getCleanSheetPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerPenaltySaves(player.id) !== 0 && (
                                        <p>Penalty Saves: {getPlayerPenaltySaves(player.id)} <strong className = 'positive-stat'>[{getPenaltySavesPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerSaves(player.id) !== 0 && (
                                        <p>Saves: {getPlayerSaves(player.id)} <strong className = 'positive-stat'>[{getSavesPoints(player.id)}]</strong></p>
                                    )}
                                    {getGoalsConcededPoints(player.id) !== 0 && (
                                        <p>Conceded: {getPlayerGoalsConceded(player.id)} <strong className = 'negative-stat'>[{getGoalsConcededPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerOwnGoals(player.id) !== 0 && (
                                        <p>Own Goals: {getPlayerOwnGoals(player.id)} <strong className = 'negative-stat'>[{getOwnGoalsPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerPenaltiesMissed(player.id) !== 0 && (
                                        <p>Penalties Missed: {getPlayerPenaltiesMissed(player.id)} <strong className = 'negative-stat'>[{getPenaltiesMissedPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerYellowCards(player.id) !== 0 && (
                                        <p>Yellow Cards: {getPlayerYellowCards(player.id)} <strong className = 'negative-stat'>[{getYellowCardsPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerRedCards(player.id) !== 0 && (
                                        <p>Red Cards: {getPlayerRedCards(player.id)} <strong className = 'negative-stat'>[{getRedCardsPoints(player.id)}]</strong></p>
                                    )}
                                    {getPlayerMinutes(player.id) !== 0 && (
                                        <p>
                                            BPS: {getPlayerBPS(player.id)} <strong className={calculateFallbackBonusPoints(player.id, gameweekFixture, elements) > 0 ? 'positive-stat' : ''}>
                                                [{calculateFallbackBonusPoints(player.id, gameweekFixture, elements)}]
                                            </strong>
                                        </p>
                                    )}
                                    {(getTotalDefensiveActions(player.id) > 0 || getPlayerDefensiveContribution(player.id) > 0) && (
                                        <p>
                                            DefCons: {getTotalDefensiveActions(player.id)}/{getDefensiveThreshold(player.id)} <strong className={getDefensiveContributionPoints(player.id) > 0 ? 'positive-stat' : ''}>
                                                [{getDefensiveContributionPoints(player.id)}]
                                            </strong>
                                        </p>
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

            {gameweekFixture ? (
            <div className="fixture-display">
                <p className="fixture-names">
                    {gameweekFixture.team_h_score !== null && gameweekFixture.team_a_score !== null
                        ? `${teams.find(team => team.id === gameweekFixture.team_h)?.name || "Unknown"} (${gameweekFixture.team_h_score}) v ${teams.find(team => team.id === gameweekFixture.team_a)?.name || "Unknown"} (${gameweekFixture.team_a_score})`
                        : `${teams.find(team => team.id === gameweekFixture.team_h)?.name || "Unknown"} v ${teams.find(team => team.id === gameweekFixture.team_a)?.name || "Unknown"}`}
                </p>
                <p className="fixture-names">
                    {new Date(gameweekFixture.kickoff_time).toLocaleDateString()}{" "}
                    {new Date(gameweekFixture.kickoff_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '')}
                </p>

                
                <div className="top-players">
                    <p className = "fixture-names">
                        {gameweekData && gameweekData.elements ? (
                            (() => {
                                const topPlayers = gameweekData.elements
                                    .filter(player =>
                                        [gameweekFixture.team_h, gameweekFixture.team_a].includes(
                                            elements.find(el => el.id === player.id)?.team
                                        )
                                    )
                                    .sort((a, b) => b.stats.bps - a.stats.bps)
                                    .slice(0, 3);

                                const allZeroBPS = topPlayers.every(player => player.stats.bps === 0);

                                if (allZeroBPS) {
                                    return "BPS: No BPS data available yet!";
                                }

                                return (
                                    "BPS: " +
                                    topPlayers
                                        .map(player => {
                                            const playerData = elements.find(el => el.id === player.id);
                                            return playerData
                                                ? `${playerData.web_name} (${player.stats.bps})`
                                                : "Unknown Player";
                                        })
                                        .join(", ")
                                );
                            })()
                        ) : (
                            "No data available"
                        )}
                    </p>
                </div>
            </div>
            ) : (
                <p>No Brighton fixture in GW {selectedGameweek}</p>
            )}

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

const failedPlayerImageCache = new Map();

function PlayerImage({ player, togglePlayer, index }) {
  if (failedPlayerImageCache.has(player.code)) {
    return (
      <img
        className="fallback-pic"
        src={failedPlayerImageCache.get(player.code)}
        alt={`player-${index + 1}`}
        onClick={() => togglePlayer(player.id)}
      />
    );
  }

  return (
    <img
      className="player-pic"
      src={`https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.code}.png`}
      onError={(e) => {
        e.target.src =
          "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_36-110.png";
        e.target.className = "fallback-pic"; // Add a different class for the fallback image
        // remember this image failed so we don't try and load it again
        failedPlayerImageCache.set(
          player.code,
          "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_36-110.png",
        );
      }}
      alt={`player-${index + 1}`}
      onClick={() => togglePlayer(player.id)}
    />
  );
}
