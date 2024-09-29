import React from 'react';
import "./list.css";

const List = ({ mainData, fixturesData, activeGameweek }) => {
    const elements = mainData && Array.isArray(mainData.elements) ? mainData.elements : [];

    const jamesPlayerNames = ["Adingra", "O'Riley", "Verbruggen", "Minteh", "Enciso", "Estupiñan"];
    const lauriePlayerNames = ["João Pedro", "Mitoma", "Baleba", "Van Hecke", "Georginio", "Ferguson"];

    const brightonPlayers = elements.filter(player => player.team === 5);

    const playersForJames = brightonPlayers
        .filter(player => jamesPlayerNames.includes(player.web_name))
        .sort((a, b) => jamesPlayerNames.indexOf(a.web_name) - jamesPlayerNames.indexOf(b.web_name));

    const playersForLaurie = brightonPlayers
        .filter(player => lauriePlayerNames.includes(player.web_name))
        .sort((a, b) => lauriePlayerNames.indexOf(a.web_name) - lauriePlayerNames.indexOf(b.web_name));

    const totalPointsJames = playersForJames.reduce((sum, player) => sum + player.event_points, 0);
    const totalPointsLaurie = playersForLaurie.reduce((sum, player) => sum + player.event_points, 0);

    const calculateOutcome = () => {
        const pointDifference = Math.abs(totalPointsJames - totalPointsLaurie) * 2;
        if (totalPointsJames > totalPointsLaurie) {
            return `Laurie pays James £${pointDifference}`;
        } else if (totalPointsLaurie > totalPointsJames) {
            return `James pays Laurie £${pointDifference}`;
        } else {
            return "It's a draw";
        }
    };

    const getPlayerImage = (playerCode) => {
        const imgUrl = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${playerCode}.png`;
        return imgUrl;  // You can add checks to validate if this image exists based on your requirements
    };

    return (
      <div>
          <p className="gameweek">Active GW: <strong>{activeGameweek}</strong></p>
          <p className="outcome"><strong>{calculateOutcome()}</strong></p>
          
          <div className="player-columns">
            <div className="player-column">
              <p className="column-title">James Players</p>
              <p className="total-points">Total Points: <strong>{totalPointsJames}</strong></p>
              {playersForJames.length > 0 ? (
                <div className="pics-wrapper">
                  {playersForJames.map((player, index) => (
                    <div key={player.code} className="player-pic-container">
                      <img
                        className="player-pic"
                        src={getPlayerImage(player.code)}
                        onError={(e) => { e.target.src = "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_36-110.png"; }}
                        alt={`player-${index + 1}`}
                      />
                      <p className="player-stat-name">{player.web_name}: <strong>{player.event_points}</strong></p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No players found for James.</p>
              )}
            </div>

            <div className="player-column">
              <p className="column-title">Laurie Players</p>
              <p className="total-points">Total Points: <strong>{totalPointsLaurie}</strong></p>
              {playersForLaurie.length > 0 ? (
                <div className="pics-wrapper">
                  {playersForLaurie.map((player, index) => (
                    <div key={player.code} className="player-pic-container">
                      <img
                        className="player-pic"
                        src={getPlayerImage(player.code)}
                        onError={(e) => { e.target.src = "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_36-110.png"; }}
                        alt={`player-${index + 1}`}
                      />
                     <p className="player-stat-name">{player.web_name}: <strong>{player.event_points}</strong></p>
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
