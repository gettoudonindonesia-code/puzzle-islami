class PuzzleGame {
    constructor(level, gridSize, imagePath) {
        this.level = level;
        this.gridSize = gridSize;
        this.imagePath = imagePath;
        this.board = [];
        this.tiles = [];
        this.moves = 0;
        this.timer = 0;
        this.intervalId = null;
        this.isGameActive = false;
        this.hasStarted = false; // Untuk melacak apakah game sudah dimulai
        this.puzzleBoardElement = document.getElementById('puzzle-board');
        this.moveCountElement = document.getElementById('move-count');
        this.timerElement = document.getElementById('timer');

        this.initGame();
    }

    async initGame() {
        this.puzzleBoardElement.innerHTML = '';
        this.moves = 0;
        this.timer = 0;
        this.updateUI();
        this.stopTimer();
        this.isGameActive = false;
        this.hasStarted = false;

        const img = new Image();
        img.src = this.imagePath;
        await new Promise(resolve => {
            img.onload = () => {
                // Pastikan gambar memiliki dimensi yang valid sebelum melanjutkan
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    resolve();
                } else {
                    console.error('Failed to load image or image has invalid dimensions:', this.imagePath);
                    // Handle error, mungkin dengan menampilkan pesan atau gambar placeholder
                }
            };
            img.onerror = () => {
                console.error('Error loading image:', this.imagePath);
                // Handle error
            };
        });

        const numTiles = this.gridSize * this.gridSize;
        this.tiles = Array.from({ length: numTiles }, (_, i) => i);

        // Shuffle until solvable
        this.shuffleTiles();

        this.createTiles(img);
        this.addEventListeners();
    }

    createTiles(image) {
    this.puzzleBoardElement.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
    this.tiles.forEach((tileValue, index) => {
        const tile = document.createElement('div');
        tile.classList.add('puzzle-tile');
        tile.dataset.value = tileValue;

        const row = Math.floor(tileValue / this.gridSize);
        const col = tileValue % this.gridSize;
        tile.style.backgroundImage = `url('${this.imagePath}')`;
        tile.style.backgroundSize = `${this.gridSize * 100}% ${this.gridSize * 100}%`;
        tile.style.backgroundPosition = `-${col * 100}% -${row * 100}%`;

        this.puzzleBoardElement.appendChild(tile);
    });
    this.board = Array.from(this.puzzleBoardElement.children);
}

    shuffleTiles() {
    let shuffled = [...this.tiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    this.tiles = shuffled;
}

  isSolvable() {
    let inversions = 0;
    for (let i = 0; i < this.tiles.length - 1; i++) {
        for (let j = i + 1; j < this.tiles.length; j++) {
            if (this.tiles[i] > this.tiles[j]) {
                inversions++;
            }
        }
    }
    return inversions % 2 === 0;
}

    addEventListeners() {
        this.puzzleBoardElement.addEventListener('click', this.handleTileClick.bind(this));
    }

    handleTileClick(event) {
        const clickedTile = event.target.closest('.puzzle-tile');
        if (!clickedTile || !this.isGameActive) {
            return;
        }

        if (!this.hasStarted) {
            this.startTimer();
            this.hasStarted = true;
            this.isGameActive = true; 
        }

          const clickedIndex = this.board.indexOf(clickedTile);

          if (!this.firstClick) {
            // Tandai potongan yang diklik
             clickedTile.classList.add('selected');
             this.firstClick = { tile: clickedTile, index: clickedIndex };
    } else {
        this.secondClick = { tile: clickedTile, index: clickedIndex };
        this.swapTiles(this.firstClick.index, this.secondClick.index);

        // Hapus seleksi
        this.firstClick.tile.classList.remove('selected');
        this.secondClick.tile.classList.remove('selected');
        this.firstClick = null;
        this.secondClick = null;

        this.moves++;
        this.updateUI();

        if (this.checkWin()) {
            this.stopTimer();
            this.isGameActive = false;
            showPopup(`Selamat! Anda berhasil menyelesaikan puzzle dalam ${formatTime(this.timer)} dengan ${this.moves} gerakan!`, this.level, this.moves, this.timer);
        }
    }
}

        // Fungsi baru untuk menukar ubin secara visual
    swapTiles(index1, index2) {
    const tile1 = this.board[index1];
    const tile2 = this.board[index2];

    // Tukar posisi di array internal
    [this.tiles[index1], this.tiles[index2]] = [this.tiles[index2], this.tiles[index1]];

    // Tukar properti DOM
    const tempInnerHTML = tile1.innerHTML;
    const tempClasses = tile1.className;
    const tempStyle = tile1.style.cssText;
    const tempDatasetValue = tile1.dataset.value;

    tile1.innerHTML = tile2.innerHTML;
    tile1.className = tile2.className;
    tile1.style.cssText = tile2.style.cssText;
    tile1.dataset.value = tile2.dataset.value;

    tile2.innerHTML = tempInnerHTML;
    tile2.className = tempClasses;
    tile2.style.cssText = tempStyle;
    tile2.dataset.value = tempDatasetValue;
}

    checkWin() {
        for (let i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i] !== i) {
                return false;
            }
        }
        return true;
    }

    startTimer() {
        this.stopTimer(); // Pastikan tidak ada timer ganda
        this.intervalId = setInterval(() => {
            this.timer++;
            this.updateUI();
        }, 1000);
    }

    stopTimer() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    updateUI() {
        if (this.moveCountElement) {
            this.moveCountElement.textContent = this.moves;
        }
        if (this.timerElement) {
            this.timerElement.textContent = formatTime(this.timer);
        }

        // Update tile positions
        this.board.forEach((tileElement, index) => {
            const tileValue = this.tiles[index]; // Get the value that should be at this position
            const originalTile = this.board.find(t => parseInt(t.dataset.value) === tileValue);

            if (originalTile) {
                // Ensure originalTile is not the current element
                if (originalTile !== tileElement) {
                    // Temporarily store current element's properties
                    const currentInnerHTML = tileElement.innerHTML;
                    const currentClassName = tileElement.className;
                    const currentStyle = tileElement.style.cssText;
                    const currentDatasetValue = tileElement.dataset.value;

                    // Copy properties from the actual tile to its new display position
                    tileElement.innerHTML = originalTile.innerHTML;
                    tileElement.className = originalTile.className;
                    tileElement.style.cssText = originalTile.style.cssText;
                    tileElement.dataset.value = originalTile.dataset.value;

                    // Restore properties for the originalTile (now at the other position)
                    originalTile.innerHTML = currentInnerHTML;
                    originalTile.className = currentClassName;
                    originalTile.style.cssText = currentStyle;
                    originalTile.dataset.value = currentDatasetValue;
                }
            }

            // Reapply empty tile class based on current internal state
            if (tileValue === this.emptyTileIndex) {
                tileElement.classList.add('empty-tile');
                tileElement.textContent = '';
            } else {
                tileElement.classList.remove('empty-tile');
            }
        });
    }


    async submitScoreAndClosePopup() {
        const playerNameInput = document.getElementById('player-name');
        const playerName = playerNameInput ? playerNameInput.value.trim() : 'Anonim';

        if (playerName) {
            await addScoreToLeaderboard(this.level, playerName, this.moves, this.timer);
            closePopup();
            // Setelah menyimpan, reset game atau kembali ke menu
            // this.reset(); // Bisa diaktifkan jika ingin otomatis reset
        } else {
            alert('Nama pemain tidak boleh kosong!');
        }
    }

    reset() {
        this.stopTimer();
        this.moves = 0;
        this.timer = 0;
        this.isGameActive = false;
        this.hasStarted = false;
        this.puzzleBoardElement.innerHTML = ''; // Kosongkan papan
        this.initGame(); // Inisialisasi ulang game
        this.updateUI(); // Perbarui UI setelah reset
    }
}