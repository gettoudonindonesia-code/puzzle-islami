// Function to show the popup with a message
function showPopup(message, level, moves, time) {
    const popup = document.getElementById('popup');
    const popupMsg = document.getElementById('popup-msg');
    popupMsg.textContent = message;
    popup.style.display = 'flex';
}

// Function to close the popup
function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
    const playerNameInput = document.getElementById('player-name');
    if (playerNameInput) {
        playerNameInput.value = ''; // Clear input field
    }
}

// Helper function to format time in mm:ss
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
    return `${formattedMinutes}:${formattedSeconds}`;
}