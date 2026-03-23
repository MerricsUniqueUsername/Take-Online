// Creates application
const App = Vue.createApp({

  // Use [[ ]] to store Vue variables
  delimiters: ['[[', ']]'],

  // Global vue variables
  data() {
    return {

    // Grid variables
      size: 8,
      highlightedCell: null,
      turn: 'blue',
      grid: [],

      // Scores
      redScore: ['', '', '', '', '', '', '', '', '', ''],
      blueScore: ['', '', '', '', '', '', '', '', '', ''],
      redFull: false,
      blueFull: false,
      redFinal: 0,
      blueFinal: 0,
      game_id: '',
      isSendingMove: false,
      me: '', // Which player you are
      password: '', // Password to making moves
      winner: '',
      username: '',

    }
  },

  // Methods
  methods: {

    switchTurn() {

      var turn = document.querySelector('.turn');

      // Iterate through whole array to determine if full
      var gridFull = true;
      for(var i = 1; i < this.size+1; i++) {
        for(var j = 1; j < this.size+1; j++) {
          if(document.querySelector(`[x="${i}"][y="${j}"]`).getAttribute('owner') == 'vacant') {
            gridFull = false;
          }
        }
      }

      // Iterate through redScore to determine if full
      var redFull = true;
      for(var i = 0; i < this.redScore.length; i++) {
        if(this.redScore[i] == '') {
          redFull = false;
        }
      }
      this.redFull = redFull;

      // Iterate through blueScore to determine if full
      var blueFull = true;
      for(var i = 0; i < this.blueScore.length; i++) {
        if(this.blueScore[i] == '') {
          blueFull = false;
        }
      }
      this.blueFull = blueFull;

      // If red is done and grid is full, the it is blue's turn
      if(gridFull && redFull) {
        this.turn = 'blue';
        turn.style.color = 'blue';
        return;
      }

      // If blue is done and grid is full, the it is red's turn
      else if(gridFull && blueFull) {
        this.turn ='red';
        turn.style.color ='red';
        return;
      }

      // If red and blue are done, then game is over
      else if(redFull && blueFull) {
        this.determineWinner();
        return;
      }

      // If blue passes red
      else if(redFull && this.blueFinal > this.redFinal) {
        this.determineWinner();
      }

      // If red passes blue
      else if(blueFull && this.redFinal > this.blueFinal) {
        this.determineWinner();
      }

      // Switch turn if grid not full
      else {
        this.turn = this.turn == 'red' ? 'blue' : 'red';
        turn.style.color = this.turn == 'red' ?'red' : 'blue';
      }

    },

    clearCell(cell) {
      cell.innerHTML = `<div class="owner"></div>`;
      cell.setAttribute('owner', 'vacant');
      this.grid[parseInt(cell.getAttribute('y')) - 1][parseInt(cell.getAttribute('x')) - 1] = '';
    },

    takeHorizontally() {
      var score = -1;
      if(this.highlightedCell != null) {
        score = 0;

        // Get x value of the cell
        var x = parseInt(this.highlightedCell.getAttribute('x'));
        var y = parseInt(this.highlightedCell.getAttribute('y'));

        // Clear cell of the right cells
        let i = x;
        while(document.querySelector(`[x="${i}"][y="${y}"]`)) {
          var target = document.querySelector(`[x="${i}"][y="${y}"]`);
          if(target.getAttribute('owner') == this.turn) {
            this.clearCell(target);
          }
          else break;
          i++;
          score++;
        }

        // Clear the cells to the left
        i = x-1;
        while(document.querySelector(`[x="${i}"][y="${y}"]`)) {
          var target = document.querySelector(`[x="${i}"][y="${y}"]`);
          if(target.getAttribute('owner') == this.turn) {
            this.clearCell(target);
          }
          else break;
          i--;
          score++;
        }
      }

      this.sendMove(`h${y-1}${x-1}`)
      return score;
    },

    takeVertically() {
      var score = -1;
      if(this.highlightedCell != null) {
        score = 0;

        // Get x value of the cell
        var x = parseInt(this.highlightedCell.getAttribute('x'));
        var y = parseInt(this.highlightedCell.getAttribute('y'));

        // Clear cell of the below cells
        let i = y;
        while(document.querySelector(`[x="${x}"][y="${i}"]`)) {
          var target = document.querySelector(`[x="${x}"][y="${i}"]`);
          if(target.getAttribute('owner') == this.turn) {
            this.clearCell(target);
          }
          else break;
          i++;
          score++;
        }

        // Clear the cells above
        i = y-1;
        while(document.querySelector(`[x="${x}"][y="${i}"]`)) {
          var target = document.querySelector(`[x="${x}"][y="${i}"]`);
          if(target.getAttribute('owner') == this.turn) {
            this.clearCell(target);
          }
          else break;
          i--;
          score++;
        }
      }

      this.sendMove(`v${y-1}${x-1}`)
      return score;
    },

    place(cell) {

      if (this.turn != this.me) return;


      // Make sure cell is selected and not the owner HTML element
      if(cell.className == 'owner')
        cell = cell.parentNode;

      // Take ownership of cell
      if(cell.getAttribute('owner') == 'vacant') {
        if(this.turn == 'red') {
          cell.children[0].style.backgroundColor = 'red';
          cell.setAttribute('owner', 'red');
          this.grid[parseInt(cell.getAttribute('y')) - 1][parseInt(cell.getAttribute('x')) - 1] = 'R';
        }
        else {
          cell.children[0].style.backgroundColor = 'blue';
          cell.setAttribute('owner', 'blue');
          this.grid[parseInt(cell.getAttribute('y')) - 1][parseInt(cell.getAttribute('x')) - 1] = 'B';
        }

        this.sendMove(`p${parseInt(cell.getAttribute('y')-1)}${parseInt(cell.getAttribute('x')-1)}`)


        // Make all cells white
        var cells = document.querySelectorAll('.cell');
        for(let i = 0; i < cells.length; i++) {
          cells[i].style.backgroundColor = '';
        }
      }

      // Highlight cell
      else if(cell.getAttribute('owner') == this.turn) {
        var cells = document.querySelectorAll('.cell');
        for(let i = 0; i < cells.length; i++) {
          cells[i].style.backgroundColor = '';
        }
        cell.style.backgroundColor = `var(--light${this.turn})`;
        this.highlightedCell = cell;
        return;
      }

      for(let i = 0; i < cells.length; i++) {
        cells[i].style.backgroundColor = '';
      }

      this.switchTurn();
      this.highlightedCell = null;
    },

    take(event) {

      if(this.turn != this.me) return;

      if((this.turn == 'red' && !this.redFull) || this.turn == 'blue' && !this.blueFull) {
        var scoreGain;

        if (event.key === 'h' || event.key === 'H') {
          scoreGain = this.takeHorizontally();
        } 
        else if (event.key === 'v' || event.key === 'V') {
          scoreGain = this.takeVertically();
        }

        if(scoreGain > 0) {

          // Update score
          if(this.turn == 'blue') {

            this.blueFinal += scoreGain;

            // Set score
            for(let i = 0; i < this.blueScore.length; i++) {
              if(this.blueScore[i] == '') {
                this.blueScore[i] = scoreGain;
                break;
              }
            }
          }
          else {

            this.redFinal += scoreGain;

            // Set score
            for(let i = 0; i < this.redScore.length; i++) {
              if(this.redScore[i] == '') {
                this.redScore[i] = scoreGain;
                break;
              }
            }
          }
          this.switchTurn();
          this.highlightedCell = null
        }
      }
    },

    async refreshGameData() {

      // If we are currently waiting for a move response, don't refresh
      if (this.isSendingMove) return;

      try {
        const response = await fetch(`/ingamedata/${this.game_id}`);
        const result = await response.json();
        const serverData = result.data;

        // Sync board, scores, and turn
        if (this.isSendingMove) return;
        this.turn = serverData.turn;
        this.redScore = serverData.red_score;
        this.blueScore = serverData.blue_score;
        this.winner = serverData.winner;

        // Update red and blue final
        this.redFinal = 0
        this.blueFinal = 0
        for(let i = 0; i < this.blueScore.length; i++) {
          this.redFinal += this.redScore[i];
          this.blueFinal += this.blueScore[i];
        }
        
        this.updateVisualBoard(serverData.board);
        
      } catch (error) {
        console.error("Error refreshing game data:", error);
      }
    },

    updateVisualBoard(boardArray) {
       boardArray.forEach((row, rowIndex) => {
         row.forEach((cell, colIndex) => {
           const x = colIndex + 1;
           const y = rowIndex + 1;
           const target = document.querySelector(`[x="${x}"][y="${y}"]`);
           
           if (target) {
             const ownerDiv = target.children[0];
             if (cell === 1) {
               target.setAttribute('owner', 'blue');
               ownerDiv.style.backgroundColor = 'blue';
             } else if (cell === 2) {
               target.setAttribute('owner', 'red');
               ownerDiv.style.backgroundColor = 'red';
             } else {
               target.setAttribute('owner', 'vacant');
               ownerDiv.style.backgroundColor = '';
             }
           }
         });
       });

       if(this.winner && !this.winnerDeclared) {
        alert(`GAME OVER! Winner: ${this.winner}`)
        window.location.href = "/";
       }
    },

    async sendMove(moveData) {
      this.isSendingMove = true;
      console.log(moveData)
      try {
        const response = await fetch(`/move/${this.game_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            password: this.password,
            move: moveData,
            username: this.username
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Move failed:", errorData.error);
          return;
        }

        const result = await response.json();
        
        // Update the local state with the returned game data
        const serverData = result.game;
        this.turn = serverData.turn;
        this.redScore = serverData.red_score;
        this.blueScore = serverData.blue_score;
        this.updateVisualBoard(serverData.board);

      } catch (error) {
        console.error("Network error sending move:", error);
      } finally {
        this.isSendingMove = false;
      }
    },
    
    addListeners() {
      document.addEventListener('keydown', this.take);
    },

  },

  async created() {
    this.addListeners();

    // Get game ID from URL
    const path = window.location.pathname;
    const parts = path.split('/');
    const id = parts[parts.length - 1];

    if (id && id !== 'game') {
      this.game_id = id;
      
      // Join game
      try {
        const response = await fetch(`/join/${this.game_id}`);
        const data = await response.json();

        if (data.password === "no_access") {
          alert("Two players already joined. You are spectating.");
        } else {
          this.me = data.player;
          this.password = data.password;
          console.log(`Joined as ${this.me}. Password stored.`);
          this.refreshGameData();
        }
      } catch (error) {
        console.error("Error joining game:", error);
        return;
      }
    }

    this.refreshInterval = setInterval(() => {
      this.refreshGameData();
    }, 1500);

    for(let i = 0; i < this.size; i++) {
      this.grid[i] = [];
      for(let j = 0; j < this.size; j++) {
        this.grid[i][j] = '';
      }
    }
  }
})

// Mount app to HTML element with ID of app
App.mount('#app');