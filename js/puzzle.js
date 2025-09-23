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
        this.hasStarted = false;
        this.firstClick = null; // Tambahkan ini
        this.secondClick = null; // Tambahkan ini

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
        this.firstClick = null;
        this.secondClick = null;

        const img = new Image();
        img.src = this.imagePath;
        await new Promise(resolve => {
            img.onload = () => {
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    resolve();
                } else {
                    console.error('Failed to load image or image has invalid dimensions:', this.imagePath);
                }
            };
            img.onerror = () => {
                console.error('Error loading image:', this.imagePath);
            };
        });

        const numTiles = this.gridSize * this.gridSize;
        this.tiles = Array.from({ length: numTiles }, (_, i) => i);

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

    addEventListeners() {
        this.puzzleBoardElement.addEventListener('click', this.handleTileClick.bind(this));
    }

    handleTileClick(event) {
        const clickedTile = event.target.closest('.puzzle-tile');
        if (!clickedTile) {
            return;
        }

        if (!this.hasStarted) {
            this.startTimer();
            this.hasStarted = true;
            this.isGameActive = true;
        }

        const clickedIndex = this.board.indexOf(clickedTile);

        if (!this.firstClick) {
            clickedTile.classList.add('selected');
            this.firstClick = { tile: clickedTile, index: clickedIndex };
        } else {
            this.secondClick = { tile: clickedTile, index: clickedIndex };

            if (this.firstClick.tile === this.secondClick.tile) {
                this.firstClick.tile.classList.remove('selected');
                this.firstClick = null;
                this.secondClick = null;
                return;
            }

            // Tukar posisi di array DOM
            this.swapTiles(this.firstClick.index, this.secondClick.index);
            // Tukar nilai di array internal (this.tiles)
            [this.tiles[this.firstClick.index], this.tiles[this.secondClick.index]] = [this.tiles[this.secondClick.index], this.tiles[this.firstClick.index]];

            // Hapus seleksi
            this.firstClick.tile.classList.remove('selected');
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

    // Fungsi untuk menukar ubin secara visual
    swapTiles(index1, index2) {
        const tile1 = this.board[index1];
        const tile2 = this.board[index2];

        // Tukar posisi di DOM
        const temp = document.createElement('div');
        tile1.parentNode.insertBefore(temp, tile1);
        tile2.parentNode.insertBefore(tile1, tile2);
        temp.parentNode.insertBefore(tile2, temp);
        temp.parentNode.removeChild(temp);
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
        this.stopTimer();
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
    }

    async submitScoreAndClosePopup() {
        const playerNameInput = document.getElementById('player-name');
        const playerName = playerNameInput ? playerNameInput.value.trim() : 'Anonim';

        if (playerName) {
            await addScoreToLeaderboard(this.level, playerName, this.moves, this.timer);
            closePopup();
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
        this.puzzleBoardElement.innerHTML = '';
        this.initGame();
        this.updateUI();
    }
}