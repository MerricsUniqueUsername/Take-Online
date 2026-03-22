const { createApp } = Vue;

createApp({
  delimiters: ['[[', ']]'],
  data() {
    return {
      gameId: window.location.pathname.split('/').pop(),
      history: [],
      currentIndex: 0,
      isPlaying: false,
      playInterval: null,
      redName: 'RED',
      blueName: 'BLUE'
    }
  },
  computed: {
    maxIndex() {
      return Math.max(0, this.history.length - 1);
    },
    currentState() {
      if (this.history.length === 0) return null;
      return this.history[parseInt(this.currentIndex)];
    },
    currentBoard() {
      return this.currentState ? this.currentState.board : [];
    },
    currentRedScore() {
      return this.currentState ? this.currentState.red_score : [];
    },
    currentBlueScore() {
      return this.currentState ? this.currentState.blue_score : [];
    },
    redTotal() {
      return this.currentRedScore.reduce((a, b) => a + b, 0);
    },
    blueTotal() {
      return this.currentBlueScore.reduce((a, b) => a + b, 0);
    }
  },
  mounted() {
    this.fetchGameData();
  },
  methods: {
    async fetchGameData() {
      try {
        const response = await fetch(`/gamedata/${this.gameId}`);
        const result = await response.json();
        const data = result.data;

        this.redName = data.red_name || 'RED';
        this.blueName = data.blue_name || 'BLUE';

        const gridSize = data.board.length;
        const scoreSize = data.red_score.length;
        
        const initialBoard = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
        const initialRedScore = Array(scoreSize).fill(0);
        const initialBlueScore = Array(scoreSize).fill(0);
        
        const initialState = {
          board: initialBoard,
          red_score: initialRedScore,
          blue_score: initialBlueScore
        };

        this.history = [initialState, ...(data.move_history || [])];
        
        this.currentIndex = 0;

      } catch (error) {
        console.error("Failed to load replay data", error);
      }
    },
    nextMove() {
      if (this.currentIndex < this.maxIndex) {
        this.currentIndex++;
      } else {
        this.pause();
      }
    },
    prevMove() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
      }
    },
    togglePlay() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },
    play() {
      if (this.currentIndex >= this.maxIndex) {
        this.currentIndex = 0;
      }
      
      this.isPlaying = true;
      this.playInterval = setInterval(() => {
        if (this.currentIndex < this.maxIndex) {
          this.currentIndex++;
        } else {
          this.pause();
        }
      }, 1000);
    },
    pause() {
      this.isPlaying = false;
      if (this.playInterval) {
        clearInterval(this.playInterval);
        this.playInterval = null;
      }
    }
  }
}).mount('#app');