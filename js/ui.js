const popup = document.getElementById('popup');
const popupContent = document.getElementById('popup-content');

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

function showPopup(message, level, moves, time, onNextClick) {
    popupContent.innerHTML = ''; // Kosongkan konten sebelumnya

    const title = document.createElement('h2');
    title.classList.add('popup-title');
    title.textContent = message; // Misal "Alhamdulillah!" atau "Hebat!"

    popupContent.appendChild(title);

    if (moves !== null && time !== null) {
        const evalDiv = document.createElement('div');
        evalDiv.classList.add('popup-eval');
        evalDiv.innerHTML = `
            <p>Gerakan: <strong>${moves}</strong></p>
            <p>Waktu: <strong>${formatTime(time)}</strong></p>
        `;
        popupContent.appendChild(evalDiv);

        // Tambahkan formulir nama pemain dan tombol simpan skor HANYA jika ini adalah kemenangan puzzle tunggal
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'player-name';
        nameInput.placeholder = 'Masukkan Nama Anda';
        nameInput.maxLength = 15;
        popupContent.appendChild(nameInput);

        const saveButton = document.createElement('button');
        saveButton.classList.add('game-button');
        saveButton.textContent = 'Simpan Skor';
        saveButton.onclick = () => {
            const playerName = nameInput.value.trim();
            if (playerName) {
                saveScore(level, { name: playerName, moves: moves, time: time });
                hidePopup();
                if (onNextClick) onNextClick(); // Panggil callback untuk puzzle berikutnya
            } else {
                alert('Nama tidak boleh kosong!');
            }
        };
        popupContent.appendChild(saveButton);

        const nextPuzzleButton = document.createElement('button'); // Tombol "Lanjut"
        nextPuzzleButton.classList.add('game-button', 'next-puzzle-button');
        nextPuzzleButton.textContent = 'Lanjut';
        nextPuzzleButton.onclick = () => {
            hidePopup();
            if (onNextClick) onNextClick(); // Panggil callback
        };
        popupContent.appendChild(nextPuzzleButton);


    } else {
        // Jika semua 20 puzzle selesai (moves dan time adalah null)
        const allDoneMessage = document.createElement('p');
        allDoneMessage.textContent = "Kamu sudah menyelesaikan semua puzzle di level ini!";
        popupContent.appendChild(allDoneMessage);

        const okButton = document.createElement('button');
        okButton.classList.add('game-button');
        okButton.textContent = 'OK';
        okButton.onclick = () => {
            hidePopup();
            if (onNextClick) onNextClick(); // Panggil callback (biasanya kembali ke menu)
        };
        popupContent.appendChild(okButton);
    }
    
    popup.classList.add('show', 'bounce-in');
}


function hidePopup() {
    popup.classList.remove('show', 'bounce-in');
    // Hapus animasi agar bisa dimainkan lagi
    popupContent.style.animation = ''; 
}