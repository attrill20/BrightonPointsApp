import React, { useState, useEffect, useRef, useCallback } from 'react';
import "./list.css";
import DefensiveProgressBar from '../DefensiveProgressBar/DefensiveProgressBar';

const normalizeString = (str) => {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

const List = ({ mainData, fixturesData, activeGameweek, selectedGameweek, onGameweekChange, jamesPlayerNames, lauriePlayerNames, setCaptain, getCaptain, captainSelections, setMultiplierOverride, getMultiplierOverride, clearMultiplierOverride, setQualifyingGame, isQualifyingGame, qualifyingGames, saveGameweekResult, getGameweekResult, gameweekResults, addPlayer, removePlayer }) => {
    const elements = React.useMemo(() => mainData?.elements || [], [mainData]);
    const brightonTeamId = mainData?.teams?.find(t => t.short_name === 'BHA')?.id || 6;
    const [gameweekData, setGameweekData] = useState(null);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [gameweekFixtures, setGameweekFixtures] = useState([]);
    const [allPlayersCollapsed, setAllPlayersCollapsed] = useState(true);
    const [showTotals, setShowTotals] = useState(false);
    const [playerHistories, setPlayerHistories] = useState({});
    const [selectedFixtureIndex, setSelectedFixtureIndex] = useState(0);
    const fetchedHistoryKeys = useRef(new Set());

    // For DGWs, use the fixture ID as the storage key so 33a and 33b are tracked independently.
    // Fixture IDs (300+) never collide with GW numbers (1-38).
    const selectedGwKey = (gameweekFixtures.length > 1 && gameweekFixtures[selectedFixtureIndex])
        ? gameweekFixtures[selectedFixtureIndex].id
        : selectedGameweek;

    const brightonPlayers = elements.filter(player => player.team === brightonTeamId);

    // Removal modal state
    const [removeModal, setRemoveModal] = useState(null); // { playerName, user }
    const longPressTimer = useRef(null);

    const isCurrentGameweek = selectedGameweek === activeGameweek;

    const handleLongPressStart = useCallback((playerName, user) => {
        if (!isCurrentGameweek) return;
        longPressTimer.current = setTimeout(() => {
            setRemoveModal({ playerName, user });
        }, 600);
    }, [isCurrentGameweek]);

    const handleLongPressEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleConfirmRemove = () => {
        if (removeModal) {
            removePlayer(removeModal.user, removeModal.playerName);
            setRemoveModal(null);
        }
    };

    const getAvailablePlayers = () => {
        const jamesNames = jamesPlayerNames
            .filter(p => selectedGameweek >= p.startingGameweek && selectedGameweek < p.endingGameweek)
            .map(p => normalizeString(p.name));
        const laurieNames = lauriePlayerNames
            .filter(p => selectedGameweek >= p.startingGameweek && selectedGameweek < p.endingGameweek)
            .map(p => normalizeString(p.name));
        const takenNames = [...jamesNames, ...laurieNames];
        return brightonPlayers
            .filter(p => !takenNames.includes(normalizeString(p.web_name)))
            .sort((a, b) => b.total_points - a.total_points);
    };

    const handleAddPlayer = (user, e) => {
        const playerName = e.target.value;
        if (playerName) {
            addPlayer(user, playerName);
            e.target.value = '';
        }
    };

    // State declarations must come before useEffect that uses them
    const [multiplier, setMultiplier] = useState(() => {
        // Check if there's a saved override for the current gameweek
        const savedOverride = getMultiplierOverride ? getMultiplierOverride(selectedGameweek) : null;
        return savedOverride || 2;
    });
    const [hasLocalOverride, setHasLocalOverride] = useState(false);

    const teams = mainData?.teams || [];

    useEffect(() => {
        setSelectedFixtureIndex(0);
    }, [selectedGameweek]);

    useEffect(() => {
        if (Array.isArray(fixturesData)) {
            const fixtures = fixturesData.filter(
                (fixture) =>
                    fixture.event === selectedGameweek &&
                    (fixture.team_h === brightonTeamId || fixture.team_a === brightonTeamId)
            );
            setGameweekFixtures(fixtures);
        } else {
            setGameweekFixtures([]);
        }
    }, [fixturesData, selectedGameweek, brightonTeamId]);

    // Load saved multiplier override when gameweek or fixture tab changes
    useEffect(() => {
        if (selectedGwKey && getMultiplierOverride) {
            const savedOverride = getMultiplierOverride(selectedGwKey);
            if (savedOverride) {
                setMultiplier(savedOverride);
                setHasLocalOverride(false);
            } else {
                setHasLocalOverride(false);
            }
        }
    }, [selectedGwKey, getMultiplierOverride]);

    // Auto-set multiplier based on whether Brighton is home or away in the selected fixture
    useEffect(() => {
        const savedOverride = getMultiplierOverride ? getMultiplierOverride(selectedGwKey) : null;
        const fixture = gameweekFixtures[selectedFixtureIndex];

        if (fixture && !hasLocalOverride && !savedOverride) {
            if (fixture.team_h === brightonTeamId) {
                setMultiplier(2);
            } else if (fixture.team_a === brightonTeamId) {
                setMultiplier(3);
            }
        }
    }, [gameweekFixtures, selectedFixtureIndex, hasLocalOverride, selectedGameweek, selectedGwKey, getMultiplierOverride, brightonTeamId]);

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

    // Fetch per-fixture element-summary data for past gameweeks
    useEffect(() => {
        if (!selectedGameweek || selectedGameweek === activeGameweek || !elements.length) return;

        const allAssignments = [
            ...jamesPlayerNames.filter(p => selectedGameweek >= p.startingGameweek && selectedGameweek < p.endingGameweek),
            ...lauriePlayerNames.filter(p => selectedGameweek >= p.startingGameweek && selectedGameweek < p.endingGameweek)
        ];

        const playerIds = [...new Set(
            allAssignments
                .map(a => elements.find(el => normalizeString(el.web_name) === normalizeString(a.name))?.id)
                .filter(Boolean)
        )];

        playerIds.forEach(playerId => {
            const cacheKey = `${playerId}_${selectedGameweek}`;
            if (fetchedHistoryKeys.current.has(cacheKey)) return;
            fetchedHistoryKeys.current.add(cacheKey);

            fetch(`https://fpl-server-nine.vercel.app/api?endpoint=element-summary/${playerId}/`)
                .then(r => r.json())
                .then(data => {
                    const fixtureHistory = data.history.filter(h => h.round === selectedGameweek);
                    setPlayerHistories(prev => ({ ...prev, [cacheKey]: fixtureHistory }));
                })
                .catch(error => {
                    console.error(`Failed to fetch history for player ${playerId}:`, error);
                    setPlayerHistories(prev => ({ ...prev, [cacheKey]: [] }));
                });
        });
    }, [selectedGameweek, activeGameweek, jamesPlayerNames, lauriePlayerNames, elements]);

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

    // Returns summed stats across all fixtures for a past GW player, or falls back to gameweekData
    const getEffectivePlayerStats = (playerId) => {
        if (selectedGameweek !== activeGameweek) {
            const histories = playerHistories[`${playerId}_${selectedGameweek}`];
            if (histories && histories.length > 0) {
                const targetFixture = gameweekFixtures[selectedFixtureIndex];
                const relevant = targetFixture
                    ? histories.filter(h => h.fixture === targetFixture.id)
                    : histories;
                if (relevant.length === 0) return { stats: { minutes: 0, goals_scored: 0, assists: 0, clean_sheets: 0, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus: 0, bps: 0, defensive_contribution: 0 } };
                const summed = relevant.reduce((acc, h) => ({
                    minutes: acc.minutes + h.minutes,
                    goals_scored: acc.goals_scored + h.goals_scored,
                    assists: acc.assists + h.assists,
                    clean_sheets: acc.clean_sheets + h.clean_sheets,
                    goals_conceded: acc.goals_conceded + h.goals_conceded,
                    own_goals: acc.own_goals + h.own_goals,
                    penalties_saved: acc.penalties_saved + h.penalties_saved,
                    penalties_missed: acc.penalties_missed + h.penalties_missed,
                    yellow_cards: acc.yellow_cards + h.yellow_cards,
                    red_cards: acc.red_cards + h.red_cards,
                    saves: acc.saves + h.saves,
                    bonus: acc.bonus + h.bonus,
                    bps: acc.bps + h.bps,
                    defensive_contribution: acc.defensive_contribution + h.defensive_contribution,
                }), {
                    minutes: 0, goals_scored: 0, assists: 0, clean_sheets: 0, goals_conceded: 0,
                    own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0,
                    red_cards: 0, saves: 0, bonus: 0, bps: 0, defensive_contribution: 0
                });
                return { stats: summed };
            }
        }
        if (gameweekData) {
            return gameweekData.elements.find(p => p.id === playerId) || null;
        }
        return null;
    };

    // Calculates points for a single fixture's stats (used for per-fixture accuracy in DGWs)
    const calcPointsFromFixtureStats = (player, stats) => {
        const minutes = stats.minutes;
        const minutesPoints = minutes === 0 ? 0 : minutes < 60 ? 1 : 2;

        let goalsPoints = 0;
        if (stats.goals_scored > 0) {
            const pts = player.element_type <= 2 ? 6 : player.element_type === 3 ? 5 : 4;
            goalsPoints = stats.goals_scored * pts;
        }

        const assistsPoints = stats.assists * 3;

        let cleanSheetPoints = 0;
        if (stats.clean_sheets > 0) {
            if (player.element_type <= 2) cleanSheetPoints = 4;
            else if (player.element_type === 3) cleanSheetPoints = 1;
        }

        const penaltySavesPoints = stats.penalties_saved * 5;
        const savesPoints = Math.floor(stats.saves / 3);
        const ownGoalsPoints = stats.own_goals * -2;
        const penaltiesMissedPoints = stats.penalties_missed * -2;

        const goalsConcededPoints = player.element_type <= 2
            ? -Math.floor(stats.goals_conceded / 2)
            : 0;

        const yellowCardsPoints = stats.yellow_cards * -1;
        const redCardsPoints = stats.red_cards * -3;
        const bonusPoints = stats.bonus;

        const defensiveContributionPoints = player.element_type !== 1 && minutes > 0
            ? (stats.defensive_contribution >= (player.element_type === 2 ? 10 : 12) ? 2 : 0)
            : 0;

        return minutesPoints + goalsPoints + assistsPoints + cleanSheetPoints + penaltySavesPoints +
               savesPoints + ownGoalsPoints + penaltiesMissedPoints + goalsConcededPoints +
               yellowCardsPoints + redCardsPoints + bonusPoints + defensiveContributionPoints;
    };

    const getPlayerPoints = (playerId) => {
        // Past GW with element-summary data — calculate for the selected fixture only
        if (selectedGameweek !== activeGameweek) {
            const histories = playerHistories[`${playerId}_${selectedGameweek}`];
            if (histories && histories.length > 0) {
                const player = elements.find(p => p.id === playerId);
                if (!player) return 0;
                const targetFixture = gameweekFixtures[selectedFixtureIndex];
                const relevant = targetFixture
                    ? histories.filter(h => h.fixture === targetFixture.id)
                    : histories;
                return relevant.reduce((sum, stats) => sum + calcPointsFromFixtureStats(player, stats), 0);
            }
        }

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
                const bpsPoints = gameweekFixtures.reduce((sum, fix) => sum + calculateFallbackBonusPoints(playerId, fix, elements), 0);
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
                const bpsPoints = gameweekFixtures.reduce((sum, fix) => sum + calculateFallbackBonusPoints(playerId, fix, elements), 0);
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
        const ps = getEffectivePlayerStats(playerId);
        return ps ? ps.stats.minutes : 0;
    };

    const getMinutesPoints = (playerId) => {
        const minutes = getPlayerMinutes(playerId);
        
        if (minutes === 0) return 0;
        if (minutes >= 1 && minutes <= 59) return 1;
        if (minutes >= 60) return 2;
    };

    const getPlayerGoals = (playerId) => {
        const ps = getEffectivePlayerStats(playerId);
        return ps ? ps.stats.goals_scored : 0;
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
        const ps = getEffectivePlayerStats(playerId);
        return ps ? ps.stats.assists : 0;
    };

    const getAssistsPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const assists = getPlayerAssists(playerId);
    
        if (!player || assists === 0) return 0;
    
        return assists * 3;
    };

    const getPlayerCleanSheets = (playerId) => {
        const ps = getEffectivePlayerStats(playerId);
        return ps ? ps.stats.clean_sheets : 0;
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
        const ps = getEffectivePlayerStats(playerId);
        return ps ? ps.stats.penalties_saved : 0;
    };

    const getPenaltySavesPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const penaltySaves = getPlayerPenaltySaves(playerId);
    
        if (!player || penaltySaves === 0) return 0;
    
        return penaltySaves * 5;
    };

    const getPlayerSaves = (playerId) => {
        const ps = getEffectivePlayerStats(playerId);
        return ps ? ps.stats.saves : 0;
    };

    const getSavesPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const saves = getPlayerSaves(playerId);
    
        if (!player || saves === 0) return 0;
    
        const savesPoints = Math.floor(saves / 3);

        return savesPoints;
    };

    const getPlayerOwnGoals = (playerId) => {
        const ps = getEffectivePlayerStats(playerId);
        return ps ? ps.stats.own_goals : 0;
    };

    const getOwnGoalsPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const ownGoals = getPlayerOwnGoals(playerId);
    
        if (!player || ownGoals === 0) return 0;
    
        return ownGoals * -2;
    };

    const getPlayerPenaltiesMissed = (playerId) => {
        const ps = getEffectivePlayerStats(playerId);
        return ps ? ps.stats.penalties_missed : 0;
    };

    const getPenaltiesMissedPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const penaltiesMissed = getPlayerPenaltiesMissed(playerId);
    
        if (!player || penaltiesMissed === 0) return 0;
    
        return penaltiesMissed * -2;
    };

    const getPlayerGoalsConceded = (playerId) => {
        const ps = getEffectivePlayerStats(playerId);
        return ps ? ps.stats.goals_conceded : 0;
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
        const ps = getEffectivePlayerStats(playerId);
        return ps ? ps.stats.yellow_cards : 0;
    };

    const getYellowCardsPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        const yellowCards = getPlayerYellowCards(playerId);
    
        if (!player || yellowCards === 0) return 0;
    
        return yellowCards * -1;
    };

    const getPlayerRedCards = (playerId) => {
        const ps = getEffectivePlayerStats(playerId);
        return ps ? ps.stats.red_cards : 0;
    };

    const getPlayerDefensiveContribution = (playerId) => {
        const ps = getEffectivePlayerStats(playerId);
        return ps ? ps.stats.defensive_contribution : 0;
    };

    const getDefensiveContributionPoints = (playerId) => {
        const player = elements.find(player => player.id === playerId);
        if (player.element_type === 1) return 0;

        const defensiveContribution = getPlayerDefensiveContribution(playerId);
        const defensiveThreshold = getDefensiveThreshold(playerId);
        return defensiveContribution >= defensiveThreshold ? 2 : 0;
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
        const ps = getEffectivePlayerStats(playerId);
        return ps ? ps.stats.bps : 0;
    };

    function calculateFallbackBonusPoints(playerId, gameweekFixture, elements) {
        // Check if gameweekData.elements exists
        if (!gameweekData || !gameweekData.elements) {
            console.error('gameweekData or gameweekData.elements is null');
            return 0; // Return a default value in case of missing data
        }

        if (!gameweekFixture) {
            return 0;
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
            setHasLocalOverride(false); // Reset local override when changing gameweek
        } else {
            const numberValue = Number(value);
            if (numberValue >= 1 && numberValue <= 38) {
                onGameweekChange(e);
                setHasLocalOverride(false); // Reset local override when changing gameweek
            }
        }
    };

    const handleMultiplierChange = (e) => {
        const value = e.target.value;

        // Allow empty input
        if (value === "") {
            setMultiplier(null);
            if (clearMultiplierOverride) {
                clearMultiplierOverride(selectedGwKey);
            }
        } else {
            const numberValue = Number(value);
            if (numberValue > 0) {
                setMultiplier(numberValue);
                setHasLocalOverride(true);
                if (setMultiplierOverride) {
                    setMultiplierOverride(selectedGwKey, numberValue);
                }
            }
        }
    };

    const handleIncrement = (setter, value, max = 38) => {
        const newValue = Math.min(value + 1, max);
        setter({ target: { value: newValue } });
        if (setter === onGameweekChange) {
            setHasLocalOverride(false); // Reset local override when changing gameweek
        }
    };
    
    const handleDecrement = (setter, value, min = 1) => {
        const newValue = Math.max(value - 1, min);
        setter({ target: { value: newValue } });
        if (setter === onGameweekChange) {
            setHasLocalOverride(false); // Reset local override when changing gameweek
        }
    };

    const handleMultiplierIncrement = () => {
        const newValue = Math.min(multiplier + 1, 10);
        setMultiplier(newValue);
        setHasLocalOverride(true);
        if (setMultiplierOverride) {
            setMultiplierOverride(selectedGwKey, newValue);
        }
    };

    const handleMultiplierDecrement = () => {
        const newValue = Math.max(multiplier - 1, 1);
        setMultiplier(newValue);
        setHasLocalOverride(true);
        if (setMultiplierOverride) {
            setMultiplierOverride(selectedGwKey, newValue);
        }
    };

    const canSelectCaptain = (gameweek) => {
        if (gameweek < 22) return false;
        
        // Check if first fixture has started
        if (gameweekFixtures.length > 0) {
            const kickoffTime = new Date(gameweekFixtures[0].kickoff_time);
            const now = new Date();
            return now < kickoffTime;
        }
        
        return true; // Allow if no fixture data yet
    };

    const handleCaptainSelect = (user, playerId) => {
        if (canSelectCaptain(selectedGameweek)) {
            setCaptain(selectedGameweek, user, playerId);
        }
    };

    // Check if a player is captained
    const isCaptain = (user, playerId) => {
        return getCaptain(selectedGameweek, user) === playerId;
    };
    
    // Calculate points with captain bonus
    const getPlayerPointsWithCaptain = (playerId, user) => {
        const basePoints = getPlayerPoints(playerId);
        if (selectedGameweek >= 22 && isCaptain(user, playerId)) {
            return basePoints * 2;
        }
        return basePoints;
    };
    
    const totalPointsJames = playersForJames.reduce((sum, player) => sum + getPlayerPointsWithCaptain(player.id, 'james'), 0);
    const totalPointsLaurie = playersForLaurie.reduce((sum, player) => sum + getPlayerPointsWithCaptain(player.id, 'laurie'), 0);

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

    // Auto-save gameweek results when fixture is finished
    useEffect(() => {
        if (gameweekFixtures.length === 1 && gameweekFixtures[0].finished && saveGameweekResult) {
            // Save the results (only if they don't exist or have changed)
            const existingResult = getGameweekResult ? getGameweekResult(selectedGwKey) : null;
            if (!existingResult ||
                existingResult.jamesPoints !== totalPointsJames ||
                existingResult.lauriePoints !== totalPointsLaurie ||
                existingResult.multiplier !== multiplier) {
                saveGameweekResult(selectedGwKey, totalPointsJames, totalPointsLaurie, multiplier);
            }
        }
    }, [gameweekFixtures, selectedGameweek, selectedGwKey, totalPointsJames, totalPointsLaurie, multiplier, getGameweekResult, saveGameweekResult]);

    const togglePlayer = (playerId) => {
        setSelectedPlayers(prev => 
            prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId] // Toggle player selection
        );
    };

    const toggleAllPlayers = () => {
        if (allPlayersCollapsed) {
            const allPlayerIds = [...playersForJames, ...playersForLaurie].map(p => p.id);
            setSelectedPlayers(allPlayerIds);
        } else {
            setSelectedPlayers([]);
        }
        setAllPlayersCollapsed(!allPlayersCollapsed);
    };

    const handleQualifyingChange = () => {
        if (setQualifyingGame) {
            setQualifyingGame(selectedGwKey, !isQualifyingGame(selectedGwKey));
        }
    };

    const calculateSeasonTotals = () => {
        let totalJamesPaid = 0;
        let totalLauriePaid = 0;
        let jamesWins = 0;
        let laurieWins = 0;

        // Calculate for all gameweeks/fixtures that are marked as qualifying UP TO the selected gameweek
        Object.keys(qualifyingGames || {}).forEach(gwKey => {
            if (qualifyingGames[gwKey]) {
                const key = parseInt(gwKey.replace('gw', ''));

                // Keys > 38 are fixture IDs (DGW sub-fixtures) — resolve to their GW event number
                const gwEvent = key <= 38
                    ? key
                    : (Array.isArray(fixturesData) ? fixturesData.find(f => f.id === key)?.event : null) || 0;

                // Only include gameweeks up to and including the selected gameweek
                if (gwEvent > 0 && gwEvent <= selectedGameweek) {
                    // Get the gameweek result for this gameweek
                    const result = gameweekResults?.[gwKey];

                    if (result) {
                        // Add the amounts paid for this gameweek
                        totalJamesPaid += result.jamesPaid || 0;
                        totalLauriePaid += result.lauriePaid || 0;

                        // Count wins (whoever didn't pay won)
                        if (result.jamesPoints > result.lauriePoints) {
                            jamesWins++;
                        } else if (result.lauriePoints > result.jamesPoints) {
                            laurieWins++;
                        }
                    }
                }
            }
        });

        return { totalJamesPaid, totalLauriePaid, jamesWins, laurieWins };
    };

    const PlayerColumn = ({ title, players, totalPoints, user }) => (
        <div className="player-column">
            <p className="column-title"><strong>{title} Players</strong></p>
            <p className="total-points">Total Points: <strong>{totalPoints}</strong></p>
            {players.length > 0 ? (
                <div className="pics-wrapper">
                    {players.map((player, index) => (
                        <div
                            key={player.code}
                            className="player-pic-container"
                            onMouseDown={() => handleLongPressStart(player.web_name, user)}
                            onMouseUp={handleLongPressEnd}
                            onMouseLeave={handleLongPressEnd}
                            onTouchStart={() => handleLongPressStart(player.web_name, user)}
                            onTouchEnd={handleLongPressEnd}
                        >
                            {selectedGameweek >= 22 && isCaptain(user, player.id) && (
                                <div className="captain-badge">C</div>
                            )}
                            <PlayerImage player={player} togglePlayer={togglePlayer} index={index} />
                            <p className="player-stat-name">
                                {player.web_name}: <strong>{getPlayerPointsWithCaptain(player.id, user)}</strong>
                                {selectedGameweek >= 22 && isCaptain(user, player.id) && (
                                    <span className="captain-multiplier"> (x2)</span>
                                )}
                            </p>
                            {selectedGameweek >= 22 && canSelectCaptain(selectedGameweek) && (
                                <button 
                                    className="captain-button"
                                    onClick={() => handleCaptainSelect(user, player.id)}
                                    disabled={isCaptain(user, player.id)}
                                >
                                    {isCaptain(user, player.id) ? 'Captain' : 'Make Captain'}
                                </button>
                            )}
                            <DefensiveProgressBar player={player} defensiveContribution={getPlayerDefensiveContribution(player.id)} defensiveThreshold={getDefensiveThreshold(player.id)} />
                            
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
                                            BPS: {getPlayerBPS(player.id)} <strong className={
                                                (selectedGameweek !== activeGameweek
                                                    ? (getEffectivePlayerStats(player.id)?.stats.bonus || 0)
                                                    : gameweekFixtures.reduce((sum, fix) => sum + calculateFallbackBonusPoints(player.id, fix, elements), 0)
                                                ) > 0 ? 'positive-stat' : ''
                                            }>
                                                [{selectedGameweek !== activeGameweek
                                                    ? (getEffectivePlayerStats(player.id)?.stats.bonus || 0)
                                                    : gameweekFixtures.reduce((sum, fix) => sum + calculateFallbackBonusPoints(player.id, fix, elements), 0)
                                                }]
                                            </strong>
                                        </p>
                                    )}
                                    {player.element_type !== 1 && getPlayerMinutes(player.id) > 0 && (
                                        <p>
                                            DefCons: {getPlayerDefensiveContribution(player.id)}/{getDefensiveThreshold(player.id)} <strong className={getDefensiveContributionPoints(player.id) > 0 ? 'positive-stat' : ''}>
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
            {isCurrentGameweek && (
                <div className="add-player-dropdown">
                    <select onChange={(e) => handleAddPlayer(user, e)} defaultValue="">
                        <option value="" disabled>+ Add Player</option>
                        {getAvailablePlayers().map(p => (
                            <option key={p.id} value={p.web_name}>
                                {p.web_name} ({p.total_points}pts)
                            </option>
                        ))}
                    </select>
                </div>
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

            <div className="input-container button-row">
                <button onClick={toggleAllPlayers}>
                    {allPlayersCollapsed ? 'Expand All' : 'Collapse All'}
                </button>
                <label className="qualifying-checkbox">
                    <input
                        type="checkbox"
                        checked={isQualifyingGame ? isQualifyingGame(selectedGwKey) : false}
                        onChange={handleQualifyingChange}
                        style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            accentColor: (isQualifyingGame && isQualifyingGame(selectedGwKey)) ? '#28a745' : '#dc3545'
                        }}
                    />
                    <span style={{
                        color: (isQualifyingGame && isQualifyingGame(selectedGwKey)) ? '#28a745' : '#dc3545',
                        fontWeight: 'bold'
                    }}>
                        Qualifying Game
                    </span>
                </label>
                <button onClick={() => setShowTotals(!showTotals)}>
                    {showTotals ? 'Hide Totals' : 'Show Totals'}
                </button>
            </div>

            {showTotals && (
                <div className="season-totals">
                    <h3>Season Totals So Far (Qualifying Games)</h3>
                    {(() => {
                        const { totalJamesPaid, totalLauriePaid, jamesWins, laurieWins } = calculateSeasonTotals();
                        const netAmount = Math.abs(totalJamesPaid - totalLauriePaid);
                        let message = '';

                        if (totalJamesPaid > totalLauriePaid) {
                            message = `James has paid Laurie £${netAmount} so far`;
                        } else if (totalLauriePaid > totalJamesPaid) {
                            message = `Laurie has paid James £${netAmount} so far`;
                        } else {
                            message = "Even Stevens so far!";
                        }

                        return (
                            <>
                                <p>Total James has paid: £{totalJamesPaid} ({jamesWins} GW wins)</p>
                                <p>Total Laurie has paid: £{totalLauriePaid} ({laurieWins} GW wins)</p>
                                <p className="net-total"><strong>{message}</strong></p>
                            </>
                        );
                    })()}
                </div>
            )}

            {gameweekFixtures.length > 0 ? (
            <div className="fixture-display">
                {gameweekFixtures.length > 1 && (
                    <div className="fixture-selector">
                        {gameweekFixtures.map((_, i) => (
                            <button
                                key={i}
                                className={`fixture-tab${selectedFixtureIndex === i ? ' active' : ''}`}
                                onClick={() => { setSelectedFixtureIndex(i); setHasLocalOverride(false); }}
                            >
                                GW{selectedGameweek}{i === 0 ? 'a' : 'b'}
                            </button>
                        ))}
                    </div>
                )}
                {(() => {
                    const fixture = gameweekFixtures[selectedFixtureIndex];
                    if (!fixture) return null;
                    return (
                        <>
                            <p className="fixture-names">
                                {fixture.team_h_score !== null && fixture.team_a_score !== null
                                    ? `${teams.find(t => t.id === fixture.team_h)?.name || "Unknown"} (${fixture.team_h_score}) v ${teams.find(t => t.id === fixture.team_a)?.name || "Unknown"} (${fixture.team_a_score})`
                                    : `${teams.find(t => t.id === fixture.team_h)?.name || "Unknown"} v ${teams.find(t => t.id === fixture.team_a)?.name || "Unknown"}`}
                            </p>
                            <p className="fixture-names">
                                {new Date(fixture.kickoff_time).toLocaleDateString()}{" "}
                                {new Date(fixture.kickoff_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '')}
                            </p>
                            <div className="top-players">
                                <p className="fixture-names">
                                    {gameweekData && gameweekData.elements ? (
                                        (() => {
                                            const topPlayers = gameweekData.elements
                                                .filter(player =>
                                                    [fixture.team_h, fixture.team_a].includes(
                                                        elements.find(el => el.id === player.id)?.team
                                                    )
                                                )
                                                .sort((a, b) => b.stats.bps - a.stats.bps)
                                                .slice(0, 3);
                                            const allZeroBPS = topPlayers.every(player => player.stats.bps === 0);
                                            if (allZeroBPS) return "BPS: No BPS data available yet!";
                                            return "BPS: " + topPlayers
                                                .map(player => {
                                                    const playerData = elements.find(el => el.id === player.id);
                                                    return playerData ? `${playerData.web_name} (${player.stats.bps})` : "Unknown Player";
                                                })
                                                .join(", ");
                                        })()
                                    ) : "No data available"}
                                </p>
                            </div>
                        </>
                    );
                })()}
                {selectedGameweek >= 22 && (
                    <p className="captain-summary">
                        Captains: James - {getCaptain(selectedGameweek, 'james') ?
                            brightonPlayers.find(p => p.id === getCaptain(selectedGameweek, 'james'))?.web_name || 'Unknown'
                            : 'Not selected'}
                        {' | '}
                        Laurie - {getCaptain(selectedGameweek, 'laurie') ?
                            brightonPlayers.find(p => p.id === getCaptain(selectedGameweek, 'laurie'))?.web_name || 'Unknown'
                            : 'Not selected'}
                        {gameweekFixtures.length > 0 && !canSelectCaptain(selectedGameweek) && ' (Locked)'}
                    </p>
                )}
            </div>
            ) : (
                <div className="fixture-display">
                    <p className="fixture-names">No Brighton fixture in GW {selectedGameweek}</p>
                </div>
            )}

            <div className="player-columns">
                <PlayerColumn
                    title="James"
                    players={playersForJames}
                    totalPoints={totalPointsJames}
                    user="james"
                />

                <PlayerColumn
                    title="Laurie"
                    players={playersForLaurie}
                    totalPoints={totalPointsLaurie}
                    user="laurie"
                />
            </div>

            {removeModal && (
                <div className="remove-modal-overlay" onClick={() => setRemoveModal(null)}>
                    <div className="remove-modal" onClick={(e) => e.stopPropagation()}>
                        <p>Remove <strong>{removeModal.playerName}</strong> from <strong>{removeModal.user}'s</strong> team?</p>
                        <p className="remove-modal-note">Player will be removed from GW{activeGameweek} onwards</p>
                        <div className="remove-modal-buttons">
                            <button className="remove-confirm-btn" onClick={handleConfirmRemove}>Remove</button>
                            <button className="remove-cancel-btn" onClick={() => setRemoveModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
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
      src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
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
