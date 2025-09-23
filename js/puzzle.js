class PuzzleGame {
    constructor(level, gridSize) {
        this.level = level;
        this.gridSize = gridSize;
        this.imagePaths = this.getImagesForLevel(level); // Daftar 20 gambar per level
        this.imageIndex = 0; // Index gambar yang sedang dimainkan
        this.board = [];
        this.tiles = [];
        this.moves = 0;
        this.timer = 0;
        this.intervalId = null;
        this.isGameActive = false;
        this.hasStarted = false;
        this.firstClick = null;
        this.secondClick = null;
        this.completedPuzzles = new Set(JSON.parse(localStorage.getItem(`completedPuzzles_${level}`)) || []); // Memuat dari localStorage

        this.puzzleBoardElement = document.getElementById('puzzle-board');
        this.moveCountElement = document.getElementById('move-count');
        this.timerElement = document.getElementById('timer');
        this.progressTextElement = document.getElementById('progress-text');
        this.progressBarElement = document.getElementById('progress-bar');
        this.skipButton = document.getElementById('skip-button');
        this.nextButton = document.getElementById('next-button'); // Tombol "Next" baru

        this.initGame();
        this.addEventListeners();
        this.updateProgress(); // Pastikan progress bar terupdate saat inisialisasi
    }

    getImagesForLevel(level) {
        const images = [];
        for (let i = 1; i <= 20; i++) {
            images.push(`assets/${level}/${i}.jpg`);
        }
        return images;
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

        let imageToPlay = this.getAvailableImage();
        if (!imageToPlay) {
            showPopup("Hebat! Kamu sudah menyelesaikan semua 20 puzzle di level ini!", this.level, null, null, () => {
                // Hapus data completed puzzles untuk level ini agar bisa dimainkan lagi
                localStorage.removeItem(`completedPuzzles_${this.level}`);
                window.location.href = 'index.html'; 
            });
            return;
        }

        this.imagePath = imageToPlay;
        
        const img = new Image();
        console.log(this.imagePath);
        img.src = this.imagePath;
        await new Promise(resolve => {
            img.onload = () => {
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    resolve();
                } else {
                    console.error('Failed to load image or image has invalid dimensions:', this.imagePath);
                    // Coba muat gambar berikutnya jika gagal
                    this.skipPuzzle(); 
                }
            };
            img.onerror = () => {
                console.error('Error loading image:', this.imagePath);
                // Coba muat gambar berikutnya jika error
                this.skipPuzzle(); 
            };
        });

        const numTiles = this.gridSize * this.gridSize;
        this.tiles = Array.from({ length: numTiles }, (_, i) => i);

        this.shuffleTiles();
        this.createTiles(img);
        this.isGameActive = true; // Set game ke aktif setelah puzzle dibuat
    }
    
    getAvailableImage() {
        // Shuffle imagePaths agar urutan gambar acak setiap kali game diinisialisasi ulang
        const shuffledImagePaths = [...this.imagePaths].sort(() => Math.random() - 0.5);
        
        for (const path of shuffledImagePaths) {
            if (!this.completedPuzzles.has(path)) {
                return path;
            }
        }
        return null; // Semua puzzle sudah selesai
    }

    createTiles(image) {
        this.puzzleBoardElement.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        this.puzzleBoardElement.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`; // Tambahkan ini
        
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
        // Pastikan puzzle dapat dipecahkan
        do {
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
        } while (!this.isSolvable(shuffled));
        
        this.tiles = shuffled;
    }

    // Fungsi untuk memeriksa apakah puzzle dapat dipecahkan (untuk NxN grid)
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
        return inversions % 2 === 0; // Puzzle NxN selalu solvable jika inversions genap
    }

    addEventListeners() {
        if (this.skipButton) {
            this.skipButton.addEventListener('click', () => this.skipPuzzle());
        }
        if (this.nextButton) { // Event listener untuk tombol "Next"
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
            // Update this.tiles array based on the visual swap
            [this.tiles[this.firstClick.index], this.tiles[this.secondClick.index]] = 
            [this.tiles[this.secondClick.index], this.tiles[this.firstClick.index]];


            // Hapus seleksi
            this.firstClick.tile.classList.remove('selected');
            this.firstClick = null;
            this.secondClick = null;

            this.moves++;
            this.updateUI();

            if (this.checkWin()) {
                this.stopTimer();
                this.isGameActive = false;
                this.completedPuzzles.add(this.imagePath); // Tandai gambar sudah selesai
                localStorage.setItem(`completedPuzzles_${this.level}`, JSON.stringify(Array.from(this.completedPuzzles))); // Simpan ke localStorage
                this.updateProgress(); // Perbarui progress bar
                
                // Panggil showPopup dengan fungsi callback untuk memuat puzzle berikutnya
                showPopup("Alhamdulillah!", this.level, this.moves, this.timer, () => {
                    this.initGame(); // Muat game berikutnya
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
    
        // Tukar posisi di array board agar sesuai dengan DOM
        [this.board[index1], this.board[index2]] = [this.board[index2], this.board[index1]];
    }

    checkWin() {
        for (let i = 0; i < this.tiles.length; i++) {
            // Membandingkan nilai dataset (yang merepresentasikan posisi asli) 
            // dari ubin yang saat ini ada di posisi 'i' dengan nilai 'i' itu sendiri.
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
        if (this.isGameActive && confirm("Anda yakin ingin melewati puzzle ini?")) {
            this.initGame();
        } else if (!this.isGameActive) { // Jika game belum aktif (misal setelah menang)
            this.initGame();
        }
    }

    reset() {
        this.stopTimer();
        this.moves = 0;
        this.timer = 0;
        this.isGameActive = false;
        this.hasStarted = false;
        // Tidak perlu clear completedPuzzles di sini, hanya saat semua level selesai
        this.initGame();
        this.updateUI();
    }
}