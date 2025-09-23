// Key for localStorage
const LEADERBOARD_KEY = 'puzzleLeaderboard';

// Function to add a new score to the leaderboard
async function addScoreToLeaderboard(level, playerName, moves, time) {
    const newScore = {
        name: playerName,
        moves: moves,
        time: time,
        date: new Date().toISOString()
    };

    let leaderboard = getLeaderboard(level);

    leaderboard.push(newScore);
    
    // Sort scores based on a composite key: fewer moves, then less time
    leaderboard.sort((a, b) => {
        if (a.moves !== b.moves) {
            return a.moves - b.moves;
        }
        return a.time - b.time;
    });

    saveLeaderboard(level, leaderboard.slice(0, 10)); // Keep only top 10 scores
}

// Function to get leaderboard data from localStorage
function getLeaderboard(level) {
    try {
        const key = `${LEADERBOARD_KEY}-${level}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to retrieve leaderboard from localStorage", e);
        return [];
    }
}

// Function to save leaderboard data to localStorage
function saveLeaderboard(level, data) {
    try {
        const key = `${LEADERBOARD_KEY}-${level}`;
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save leaderboard to localStorage", e);
    }
}

// Function to display the leaderboard on the main page
function displayLeaderboard() {
    const leaderboardContainer = document.getElementById('leaderboard');
    if (!leaderboardContainer) {
        return; // Exit if not on a page with a leaderboard container
    }

    const levels = ['easy', 'middle', 'pro'];
    let htmlContent = '';

    levels.forEach(level => {
        const scores = getLeaderboard(level);
        htmlContent += `<h3>Level ${level.charAt(0).toUpperCase() + level.slice(1)}</h3>`;
        
        if (scores.length === 0) {
            htmlContent += '<p>Belum ada skor yang tercatat.</p>';
        } else {
            htmlContent += `
                <ol>
                    ${scores.map(score => `
                        <li>
                            <span>${score.name}</span>
                            <span>(${score.moves} gerakan)</span>
                            <span>- ${formatTime(score.time)}</span>
                        </li>
                    `).join('')}
                </ol>
            `;
        }
    });

    leaderboardContainer.innerHTML = htmlContent;
}

// Run this function when the document is loaded to display the leaderboard
document.addEventListener("DOMContentLoaded", () => {
    displayLeaderboard();
});