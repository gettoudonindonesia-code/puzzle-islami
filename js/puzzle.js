class PuzzleGame {
    constructor(level, gridSize) {
        this.level = level;
        this.gridSize = gridSize;
        this.imagePaths = this.getImagesForLevel(level);
        this.imageIndex = 0;
        this.board = [];
        this.tiles = [];
        this.moves = 0;
        this.timer = 0;
        this.intervalId = null;
        this.isGameActive = false;
        this.hasStarted = false;
        this.firstClick = null;
        this.secondClick = null;
        this.completedPuzzles = new Set(JSON.parse(localStorage.getItem(`completedPuzzles_${level}`)) || []);

        // Pastikan elemen-elemen ini ada di HTML Anda
        this.puzzleBoardElement = document.getElementById('puzzle-board');
        this.moveCountElement = document.getElementById('move-count');
        this.timerElement = document.getElementById('timer');
        this.progressTextElement = document.getElementById('progress-text');
        this.progressBarElement = document.getElementById('progress-bar');
        this.skipButton = document.getElementById('skip-button'); // ID untuk tombol "Lewati"
        this.nextButton = document.getElementById('next-button');

        this.initGame();
        this.addEventListeners();
        this.updateProgress();
    }

    getImagesForLevel(level) {
        const images = [];
        for (let i = 1; i <= 20; i++) {
            images.push(`assets/${level}/${i}.jpg`);
        }
        return images;
    }

    async initGame() {
        // Periksa apakah puzzleBoardElement ada
        if (!this.puzzleBoardElement) {
            console.error("Error: puzzle-board element not found.");
            return;
        }
        this.puzzleBoardElement.innerHTML = '';
        this.moves = 0;
        this.timer = 0;
        this.updateUI();
        this.stopTimer();
        this.isGameActive = false;
        this.hasStarted = false;
        this.firstClick = null;
        this.secondClick = null;

        let imageToPlay = this.getAvailableImage();
        if (!imageToPlay) {
            showPopup("Hebat! Kamu sudah menyelesaikan semua 20 puzzle di level ini!", this.level, null, null, () => {
                localStorage.removeItem(`completedPuzzles_${this.level}`);
                window.location.href = 'index.html'; 
            });
            return;
        }

        this.imagePath = imageToPlay;
        
        const img = new Image();
        console.log(this.imagePath);
        img.src = this.imagePath;

        // Tidak memerlukan `await new Promise` jika Anda memanggil `initGame` lagi di dalam handler
        // Ini adalah kode yang lebih bersih dan modern
        img.onload = () => {
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                this.setupTiles(img);
            } else {
                console.error('Failed to load image or image has invalid dimensions:', this.imagePath);
                this.skipPuzzle(); 
            }
        };
        img.onerror = () => {
            console.error('Error loading image:', this.imagePath);
            this.skipPuzzle(); 
        };
    }

    // Pisahkan logika pembuatan tile ke fungsi terpisah
    setupTiles(image) {
        const numTiles = this.gridSize * this.gridSize;
        this.tiles = Array.from({ length: numTiles }, (_, i) => i);
        this.shuffleTiles();
        this.createTiles(image);
        this.isGameActive = true;
    }
    
    getAvailableImage() {
        const shuffledImagePaths = [...this.imagePaths].sort(() => Math.random() - 0.5);
        for (const path of shuffledImagePaths) {
            if (!this.completedPuzzles.has(path)) {
                return path;
            }
        }
        return null;
    }

    createTiles(image) {
        this.puzzleBoardElement.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        this.puzzleBoardElement.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`;
        
        this.tiles.forEach((tileValue) => {
            const tile = document.createElement('div');
            tile.classList.add('puzzle-tile');
            tile.dataset.value = tileValue;
            tile.style.backgroundImage = `url('${this.imagePath}')`;
            tile.style.backgroundSize = `${this.gridSize * 100}% ${this.gridSize * 100}%`;
            const row = Math.floor(tileValue / this.gridSize);
            const col = tileValue % this.gridSize;
            tile.style.backgroundPosition = `-${col * 100}% -${row * 100}%`;
            this.puzzleBoardElement.appendChild(tile);
        });
        this.board = Array.from(this.puzzleBoardElement.children);
    }

    // Pindahkan logika shuffleTiles dan isSolvable ke dalam class, 
    // dan pastikan kurung kurawal tertutup dengan benar.
    shuffleTiles() {
        let tiles = this.tiles;
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }
        this.tiles = tiles;
    }

    // isSolvable() harus berada di dalam class, bukan di dalam shuffleTiles()
    isSolvable(tiles) {
        let inversions = 0;
        const n = this.gridSize;
        for (let i = 0; i < tiles.length - 1; i++) {
            for (let j = i + 1; j < tiles.length; j++) {
                if (tiles[i] > tiles[j]) {
                    inversions++;
                }
            }
        }
        return inversions % 2 === 0;
    }
    
    addEventListeners() {
        if (this.skipButton) {
            this.skipButton.addEventListener('click', () => this.skipPuzzle());
        }
        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => this.skipPuzzle());
        }
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

            this.swapTiles(this.firstClick.index, this.secondClick.index);
            [this.tiles[this.firstClick.index], this.tiles[this.secondClick.index]] = 
            [this.tiles[this.secondClick.index], this.tiles[this.firstClick.index]];

            this.firstClick.tile.classList.remove('selected');
            this.firstClick = null;
            this.secondClick = null;

            this.moves++;
            this.updateUI();

            if (this.checkWin()) {
                this.stopTimer();
                this.isGameActive = false;
                this.completedPuzzles.add(this.imagePath);
                localStorage.setItem(`completedPuzzles_${this.level}`, JSON.stringify(Array.from(this.completedPuzzles)));
                this.updateProgress();
                
                showPopup("Alhamdulillah!", this.level, this.moves, this.timer, () => {
                    this.initGame();
                });
            }
        }
    }

    swapTiles(index1, index2) {
        const tile1 = this.board[index1];
        const tile2 = this.board[index2];
        const parent = this.puzzleBoardElement;
    
        const tile1Rect = tile1.getBoundingClientRect();
        const tile2Rect = tile2.getBoundingClientRect();
    
        const distanceX = tile2Rect.left - tile1Rect.left;
        const distanceY = tile2Rect.top - tile1Rect.top;
    
        const duration = 200;
        tile1.style.transition = `transform ${duration}ms ease-in-out`;
        tile2.style.transition = `transform ${duration}ms ease-in-out`;
        tile1.style.transform = `translate(${distanceX}px, ${distanceY}px)`;
        tile2.style.transform = `translate(${-distanceX}px, ${-distanceY}px)`;
    
        setTimeout(() => {
            if (parent.children[index1] && parent.children[index2]) {
                parent.insertBefore(tile2, parent.children[index1]);
                parent.insertBefore(tile1, parent.children[index2]);
                
                tile1.style.transition = '';
                tile2.style.transition = '';
                tile1.style.transform = '';
                tile2.style.transform = '';
            }
        }, duration);
    
        [this.board[index1], this.board[index2]] = [this.board[index2], this.board[index1]];
    }

    checkWin() {
        for (let i = 0; i < this.tiles.length; i++) {
            if (parseInt(this.board[i].dataset.value) !== i) {
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

    updateProgress() {
        const completedCount = this.completedPuzzles.size;
        const totalCount = this.imagePaths.length;
        if (this.progressTextElement) {
            this.progressTextElement.textContent = `${completedCount}/${totalCount}`;
        }
        if (this.progressBarElement) {
            const percentage = (completedCount / totalCount) * 100;
            this.progressBarElement.style.width = `${percentage}%`;
        }
    }

    skipPuzzle() {
        if (this.isGameActive) {
            this.initGame(); 
        }
    }

    reset() {
        this.moveCount = 0; // Perbaiki: `this.moveCount` seharusnya `this.moves`
        this.timer = 0;
        this.isSolved = false;
        this.moves = 0; // Perbaiki: `this.moves = [];` seharusnya `this.moves = 0;`
        
        this.shuffleTiles(); 
        this.renderTiles(); // Tambahkan fungsi untuk merender ulang ubin setelah diacak
    
        this.updateUI();
    }

    // Tambahkan fungsi baru untuk merender ulang ubin
    renderTiles() {
        // Kosongkan papan puzzle
        this.puzzleBoardElement.innerHTML = '';
        // Buat ulang ubin dengan susunan yang sudah diacak
        this.createTiles(new Image()); // Buat instance Image baru untuk digunakan
    }
}