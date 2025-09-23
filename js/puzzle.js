class PuzzleGame {
    constructor(level, gridSize, imagePath) {
        this.level = level;
        this.gridSize = gridSize;
        this.imagePath = imagePath;
        this.board = [];
        this.tiles = [];
        this.emptyTileIndex = 0;
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
            img.onload = resolve;
        });

        const numTiles = this.gridSize * this.gridSize;
        this.tiles = Array.from({ length: numTiles }, (_, i) => i);
        this.emptyTileIndex = numTiles - 1;

        // Shuffle until solvable
        this.shuffleTiles();

        this.createTiles(img);
        this.addEventListeners();
    }

    createTiles(image) {
        this.puzzleBoardElement.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        const tileSize = image.width / this.gridSize;

        this.tiles.forEach((tileValue, index) => {
            const tile = document.createElement('div');
            tile.classList.add('puzzle-tile');
            tile.dataset.value = tileValue;

            if (tileValue === this.emptyTileIndex) {
                tile.classList.add('empty-tile');
                tile.textContent = ''; // Atau ikon kosong
            } else {
                const row = Math.floor(tileValue / this.gridSize);
                const col = tileValue % this.gridSize;
                tile.style.backgroundImage = `url('${this.imagePath}')`;
                tile.style.backgroundSize = `${this.gridSize * 100}% ${this.gridSize * 100}%`;
                tile.style.backgroundPosition = `-${col * 100}% -${row * 100}%`;
            }
            this.puzzleBoardElement.appendChild(tile);
        });
        this.board = Array.from(this.puzzleBoardElement.children);
    }

    shuffleTiles() {
        let shuffled = [...this.tiles];
        const numTiles = this.gridSize * this.gridSize;
        do {
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
        } while (!this.isSolvable(shuffled));
        this.tiles = shuffled;
    }

    isSolvable(currentTiles) {
        const flatTiles = currentTiles.filter(val => val !== this.emptyTileIndex);
        let inversions = 0;
        for (let i = 0; i < flatTiles.length - 1; i++) {
            for (let j = i + 1; j < flatTiles.length; j++) {
                if (flatTiles[i] > flatTiles[j]) {
                    inversions++;
                }
            }
        }

        const emptyRow = Math.floor(currentTiles.indexOf(this.emptyTileIndex) / this.gridSize);
        if (this.gridSize % 2 === 1) { // Odd grid (3x3, 5x5)
            return inversions % 2 === 0;
        } else { // Even grid (2x2, 4x4, 6x6)
            // From bottom, 1-indexed
            const emptyRowFromBottom = this.gridSize - emptyRow;
            if (emptyRowFromBottom % 2 === 1) { // Empty tile on odd row from bottom
                return inversions % 2 === 0;
            } else { // Empty tile on even row from bottom
                return inversions % 2 === 1;
            }
        }
    }


    addEventListeners() {
        this.puzzleBoardElement.addEventListener('click', this.handleTileClick.bind(this));
    }

    handleTileClick(event) {
        const clickedTile = event.target.closest('.puzzle-tile');
        if (!clickedTile || clickedTile.classList.contains('empty-tile') || !this.isGameActive) {
            return;
        }

        if (!this.hasStarted) {
            this.startTimer();
            this.hasStarted = true;
            this.isGameActive = true; // Pastikan game aktif saat klik pertama
        }

        const clickedValue = parseInt(clickedTile.dataset.value);
        const clickedIndex = this.tiles.indexOf(clickedValue);

        if (this.canMove(clickedIndex)) {
            this.moveTile(clickedIndex);
            this.moves++;
            this.updateUI();

            clickedTile.classList.add('clicked');
            setTimeout(() => {
                clickedTile.classList.remove('clicked');
            }, 200); // Durasi animasi CSS

            if (this.checkWin()) {
                this.stopTimer();
                this.isGameActive = false;
                showPopup(`Selamat! Anda berhasil menyelesaikan puzzle dalam ${formatTime(this.timer)} dengan ${this.moves} gerakan!`, this.level, this.moves, this.timer);
            }
        }
    }

    canMove(clickedIndex) {
        const [clickedRow, clickedCol] = [Math.floor(clickedIndex / this.gridSize), clickedIndex % this.gridSize];
        const [emptyRow, emptyCol] = [Math.floor(this.tiles.indexOf(this.emptyTileIndex) / this.gridSize), this.tiles.indexOf(this.emptyTileIndex) % this.gridSize];

        const isAdjacentRow = Math.abs(clickedRow - emptyRow) === 1 && clickedCol === emptyCol;
        const isAdjacentCol = Math.abs(clickedCol - emptyCol) === 1 && clickedRow === emptyRow;

        return isAdjacentRow || isAdjacentCol;
    }

    moveTile(clickedIndex) {
        const emptyIndex = this.tiles.indexOf(this.emptyTileIndex);

        // Swap values in the internal tiles array
        [this.tiles[clickedIndex], this.tiles[emptyIndex]] = [this.tiles[emptyIndex], this.tiles[clickedIndex]];

        // Update DOM elements
        const clickedElement = this.board[clickedIndex];
        const emptyElement = this.board[emptyIndex];

        // Animate the move (optional, can be done with CSS transitions)
        const tempInnerHTML = clickedElement.innerHTML;
        const tempClasses = clickedElement.classList;
        const tempStyle = clickedElement.style.cssText;

        clickedElement.innerHTML = emptyElement.innerHTML;
        clickedElement.className = emptyElement.className;
        clickedElement.style.cssText = emptyElement.style.cssText;
        clickedElement.dataset.value = emptyElement.dataset.value;

        emptyElement.innerHTML = tempInnerHTML;
        emptyElement.className = tempClasses;
        emptyElement.style.cssText = tempStyle;
        emptyElement.dataset.value = clickedElement.dataset.value; // Update dataset for empty tile

        // Visually swap classes for empty tile
        clickedElement.classList.remove('empty-tile');
        emptyElement.classList.add('empty-tile');
        emptyElement.dataset.value = this.emptyTileIndex;
        emptyElement.textContent = ''; // Pastikan kosong
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