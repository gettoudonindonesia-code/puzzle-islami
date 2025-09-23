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
        this.completedPuzzles = new Set(); // Menggunakan Set untuk menyimpan gambar yang sudah selesai

        this.puzzleBoardElement = document.getElementById('puzzle-board');
        this.moveCountElement = document.getElementById('move-count');
        this.timerElement = document.getElementById('timer');
        this.progressTextElement = document.getElementById('progress-text');
        this.progressBarElement = document.getElementById('progress-bar');
        this.skipButton = document.getElementById('skip-button');

        this.initGame();
        this.addEventListeners();
    }

    getImagesForLevel(level) {
        // Asumsi folder assets berisi subfolder untuk setiap level (misal: easy, medium, hard)
        // dan di dalamnya ada 20 gambar dengan nama 1.jpg, 2.jpg, dst.
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
            // Jika semua puzzle sudah selesai, bisa tampilkan pesan atau kembali ke menu
            showPopup("Hebat! Kamu sudah menyelesaikan semua 20 puzzle di level ini!", this.level, null, null, () => {
                // Contoh: Kembali ke menu utama
                window.location.href = 'index.html'; 
            });
            return;
        }

        this.imagePath = imageToPlay;
        
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
    }
    
    getAvailableImage() {
        const availableImages = this.imagePaths.filter(path => !this.completedPuzzles.has(path));
        if (availableImages.length === 0) {
            return null; // Semua puzzle sudah selesai
        }
        const randomIndex = Math.floor(Math.random() * availableImages.length);
        return availableImages[randomIndex];
    }

    // Fungsi lainnya tetap sama
    // ...
    // ... (Fungsi createTiles, shuffleTiles, swapTiles, handleTileClick, startTimer, stopTimer, updateUI)
    // ...

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
            [this.tiles[this.firstClick.index], this.tiles[this.secondClick.index]] = [this.tiles[this.secondClick.index], this.tiles[this.firstClick.index]];

            this.firstClick.tile.classList.remove('selected');
            this.firstClick = null;
            this.secondClick = null;

            this.moves++;
            this.updateUI();

            if (this.checkWin()) {
                this.stopTimer();
                this.isGameActive = false;
                this.completedPuzzles.add(this.imagePath); // Tambahkan gambar ke daftar yang sudah selesai
                this.updateProgress(); // Perbarui progress bar
                showPopup(`Selamat! Anda berhasil menyelesaikan puzzle dalam ${formatTime(this.timer)} dengan ${this.moves} gerakan!`, this.level, this.moves, this.timer, () => {
                    this.initGame(); // Muat puzzle berikutnya
                });
            }
        }
    }

    // Fungsi untuk menukar ubin secara visual
    swapTiles(index1, index2) {
        const tile1 = this.board[index1];
        const tile2 = this.board[index2];
        const parent = this.puzzleBoardElement;
    
        const tile1Rect = tile1.getBoundingClientRect();
        const tile2Rect = tile2.getBoundingClientRect();
    
        const distanceX = tile2Rect.left - tile1Rect.left;
        const distanceY = tile2Rect.top - tile1Rect.top;
    
        // Animasi perpindahan
        const duration = 200; // milliseconds
        tile1.style.transition = `transform ${duration}ms ease-in-out`;
        tile2.style.transition = `transform ${duration}ms ease-in-out`;
        tile1.style.transform = `translate(${distanceX}px, ${distanceY}px)`;
        tile2.style.transform = `translate(${-distanceX}px, ${-distanceY}px)`;
    
        // Tukar di DOM setelah animasi selesai
        setTimeout(() => {
            if (parent.children[index1] && parent.children[index2]) {
                parent.insertBefore(tile2, parent.children[index1]);
                parent.insertBefore(tile1, parent.children[index2]);
                
                // Hapus transisi untuk menghindari masalah di klik berikutnya
                tile1.style.transition = '';
                tile2.style.transition = '';
                tile1.style.transform = '';
                tile2.style.transform = '';
            }
        }, duration);
    
        // Tukar posisi di array board
        [this.board[index1], this.board[index2]] = [this.board[index2], this.board[index1]];
    }

    checkWin() {
        for (let i = 0; i < this.tiles.length; i++) {
            if (this.board[i].dataset.value !== `${i}`) { // Periksa nilai dataset
                return false;
            }
        }
        return true;
    }
    
    // ... (Fungsi startTimer, stopTimer, updateUI)
    updateUI() {
        if (this.moveCountElement) {
            this.moveCountElement.textContent = this.moves;
        }
        if (this.timerElement) {
            this.timerElement.textContent = formatTime(this.timer);
        }
    }

    // Fungsi baru untuk memperbarui progress bar
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

    // Event listeners baru untuk tombol skip
    addEventListeners() {
        if (this.skipButton) {
            this.skipButton.addEventListener('click', () => this.skipPuzzle());
        }
        // Pastikan event listener untuk puzzle board hanya ditambahkan sekali
        this.puzzleBoardElement.addEventListener('click', this.handleTileClick.bind(this));
    }
    
    // Fungsi untuk melompati puzzle saat ini
    skipPuzzle() {
        if (confirm("Anda yakin ingin melewati puzzle ini?")) {
            this.initGame(); // Muat puzzle baru
        }
    }

    reset() {
        this.stopTimer();
        this.moves = 0;
        this.timer = 0;
        this.isGameActive = false;
        this.hasStarted = false;
        this.completedPuzzles.clear(); // Reset data puzzle yang selesai
        this.updateProgress();
        this.puzzleBoardElement.innerHTML = '';
        this.initGame();
        this.updateUI();
    }
}