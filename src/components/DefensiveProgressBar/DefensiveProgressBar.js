import React from 'react';
import './DefensiveProgressBar.css';

const DefensiveProgressBar = ({ player, defensiveContribution, defensiveThreshold }) => {
    if (player.element_type === 1) {
        return <div className="progress-bar-container goalkeeper-bar"></div>;
    }

    const progress = (defensiveContribution / defensiveThreshold) * 100;
    let color = 'red';
    if (progress >= 100) {
        color = 'green';
    } else if (progress >= 50) {
        color = 'yellow';
    }

    const totalBars = defensiveThreshold;
    const filledBars = Math.min(defensiveContribution, totalBars);

    return (
        <div className="progress-bar-container">
            {[...Array(totalBars)].map((_, i) => (
                <div
                    key={i}
                    className={`progress-bar-chunk ${i < filledBars ? color : ''}`}>
                </div>
            ))}
        </div>
    );
};

export default DefensiveProgressBar;
