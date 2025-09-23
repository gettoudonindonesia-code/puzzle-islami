// Function to show the popup with a message
function showPopup(message, level, moves, time, onNextClick) {
    const popup = document.getElementById('popup');
    const popupContent = document.getElementById('popup-content');

    // Buat konten pop-up baru
    popupContent.innerHTML = `
        <h2 class="popup-title">Alhamdulillah!</h2>
        <div class="popup-eval">
            <p>Gerakan: <strong>${moves}</strong></p>
            <p>Waktu: <strong>${formatTime(time)}</strong></p>
        </div>
        <button id="next-button" class="game-button">Lanjut</button>
    `;

    // Tambahkan event listener untuk tombol "Lanjut"
    const nextButton = document.getElementById('next-button');
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            closePopup();
            if (onNextClick && typeof onNextClick === 'function') {
                onNextClick();
            }
        });
    }

    // Tampilkan pop-up dan tambahkan class untuk efek bounce
    popup.style.display = 'flex';
    popup.classList.add('bounce-in');
}

// Function to close the popup
function closePopup() {
    const popup = document.getElementById('popup');
    popup.classList.remove('bounce-in'); // Hapus class efek bounce
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