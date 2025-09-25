// Function to get the best scores from localStorage
function getBestScores() {
    try {
        const scores = localStorage.getItem('bestScores');
        return scores ? JSON.parse(scores) : {};
    } catch (e) {
        console.error("Failed to retrieve best scores from localStorage", e);
        return {};
    }
}

// Function to save the best scores to localStorage
function saveBestScores(data) {
    try {
        localStorage.setItem('bestScores', JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save best scores to localStorage", e);
    }
}

// Function to display the simplified leaderboard
function displayLeaderboard() {
    const leaderboardContainer = document.getElementById('leaderboard');
    if (!leaderboardContainer) return; // Exit if the element doesn't exist

    const bestScores = getBestScores();
    leaderboardContainer.innerHTML = ''; // Clear existing content

    const levels = [
        { id: 'easy', name: 'Level Easy (2x2)' },
        { id: 'middle', name: 'Level Middle (3x3)' },
        { id: 'pro', name: 'Level Pro (4x4)' },
        { id: 'super', name: 'Level Super (5x5)' }
    ];

    levels.forEach(level => {
        const bestScore = bestScores[level.id];
        const leaderboardItem = document.createElement('div');
        leaderboardItem.className = 'leaderboard-item';

        let scoreContent = `
            <h3>${level.name}</h3>
            <p>Belum ada top skor.</p>
        `;

        if (bestScore) {
            scoreContent = `
                <h3>${level.name}</h3>
                <p>Top Skor: <strong>${bestScore.moves}</strong> Gerakan</p>
            `;
        }

        leaderboardItem.innerHTML = scoreContent;
        leaderboardContainer.appendChild(leaderboardItem);
    });
}

// Function to reset all best scores
function resetLeaderboard() {
    if (confirm("Apakah Anda yakin ingin menghapus semua top skor?")) {
        localStorage.removeItem('bestScores');
        displayLeaderboard(); // Update the display after clearing
        alert("Semua top skor telah dihapus!");
    }
}

// Ensure functions are globally accessible
window.displayLeaderboard = displayLeaderboard;
window.resetLeaderboard = resetLeaderboard;

// Run on page load
document.addEventListener("DOMContentLoaded", () => {
    displayLeaderboard();

    // Add event listener to the reset button
    const resetButton = document.getElementById('reset-leaderboard-button');
    if (resetButton) {
        resetButton.addEventListener('click', resetLeaderboard);
    }
});