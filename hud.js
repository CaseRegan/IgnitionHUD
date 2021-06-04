class Game {
  constructor(doc, id) {
    this.verbose = false;
    this.logMessage(`Initializing ${this.max}max game`);

    this.doc = doc;
    this.gameID = id;
    this.max = this.getMax();
    this.street = 0;
    this.toCall = 0;
    this.betCounter = 0;

    /** Creates DOM element/observer combos for important events. */
    this.root = this.getRootDOM();
    this.community = this.getCommunityDOM();
    this.flop = this.community.children[0];
    this.turn = this.community.children[3];
    this.river = this.community.children[4];
    let comObsConfig = {
      attributes: true,
      childList: true,
      subtree: true
    };
    new MutationObserver(this.makeStreetCallback(1).bind(this)).observe(
      this.flop, comObsConfig);
    new MutationObserver(this.makeStreetCallback(2).bind(this)).observe(
      this.turn, comObsConfig);
    new MutationObserver(this.makeStreetCallback(3).bind(this)).observe(
      this.river, comObsConfig);

    /** Populates a list of players in the game. */
    this.players = [];
    for (var i = 0; i < this.max; i++) {
      this.players.push(new Player(this, i));
      let btnObsConfig = {
        attributes: true,
        attributeFilter: ['style'],
        attributeOldValue: true
      };
      new MutationObserver(this.makeBTNCallback(i).bind(this)).observe(
        this.players[i].btn, btnObsConfig);
    }
  }

  /** If the verbose flag was set, log the passed 
   * message in the Chrome console */
  logMessage(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  /** The four methods below select corresponding DOM elements that the 
   * game uses to keep track of events.*/
  getMax() {
    return this.doc.querySelector(".f1so0fyt").childNodes.length-2;
  }

  getRootDOM() {
    return this.doc.querySelector(".f1qy5s7k");
  }

  getCommunityDOM() {
    return this.doc.querySelector(".f34l2e8");
  }

  getZoom() {
    return Number(this.doc.querySelector(".f1so0fyt").style.zoom);
  }

  /** Makes a callback function for the button moving. Each player will 
   * trigger their "onBTNMove function (same name, different function -- 
   * maybe fix that)" when this happens, effectively telling them to 
   * reset for the next hand. */
  makeBTNCallback(seat) {
    function onBTNMove(mlist, obs) {
      let state1 = mlist[0].oldValue.split(';')[0].split(' ')[1];
      let state2 = mlist[0].target.style.visibility;

      if (state1 === 'hidden' && state2 === 'visible') {
        this.logMessage(`Button moved to player ${seat}`);

        for (var i = 0; i < this.max; i++) {
          this.players[i].onBTNMove();
        }

        this.street = 0;
        this.toCall = 0;
        this.betCounter = 0;
      }
    }
    return onBTNMove;
  }

  /** Makes a callback function for the street being changed. */
  /** TODO: currently only being used for verbose logging, but will
   * be important again when I add flop, turn, and river statistics. */
  makeStreetCallback(street) {
    const streetNames = ['Hole cards', 'Flop', 'Turn', 'River'];

    function onStreet(mlist, obs) {
      this.logMessage(streetNames[street] + " dealt");

      this.street = street;
      this.toCall = 0;
      this.betCounter = 0;
    }

    return onStreet;
  }
}

class Player {
  constructor(game, seatID) {
    this.game = game;
    this.seatID = seatID;

    this.popup = this.generateStatsPopup();
    this.game.root.appendChild(this.popup);

    this.seat = this.getSeatDOM();
    this.hole = this.getHoleDOM();
    this.btn = this.getBTNDOM();
    this.bet = null;

    this.nhands = 0;
    this.nvpip  = 0;
    this.npfr   = 0;
    this.n3bet  = 0;
    this.dealtIn = 0;
    this._vpip  = 0;
    this._pfr   = 0;
    this._3bet  = 0;
    this.lastBet = 0;
    this.status = 0;
  }

  /** Creates and returns a DOM element to be used as a popup, 
   * complete with draggability and CSS. */
  generateStatsPopup() {
    let popup = this.game.doc.createElement("div");
    popup.class = "hud-stats-display";
    popup.style.position = "absolute";
    popup.style.visibility = "hidden";
    popup.style.backgroundColor = "white";
    popup.style.border = "1px solid black";
    popup.style.zIndex = 10000;

    let x1 = 0;
    let y1 = 0;
    let x2 = 0;
    let y2 = 0;

    function dragMouseDown(e) {
      e = e || this.game.doc.defaultView.event;
      e.preventDefault();

      x2 = e.clientX;
      y2 = e.clientY;
      this.game.doc.onmouseup = closeDrag.bind(this);
      this.game.doc.onmousemove = mouseDrag.bind(this);
    }

    function mouseDrag(e) {
      e = e || this.game.doc.defaultView.event;
      e.preventDefault();

      x1 = x2 - e.clientX;
      y1 = y2 - e.clientY;
      x2 = e.clientX;
      y2 = e.clientY;

      popup.style.left = (popup.offsetLeft-x1)+"px";
      popup.style.top = (popup.offsetTop-y1)+"px";
    }

    function closeDrag() {
      this.game.doc.onmouseup = null;
      this.game.doc.onmousemove = null;
    }

    popup.onmousedown = dragMouseDown.bind(this);

    return popup
  }

  /** The four methods below select corresponding DOM elements that the 
   * player uses to keep track of events.*/
  /** TODO: I need to decide if I want to rely only on these methods 
  * or only on class fields. It's difficult because the references in 
  * the fields need to be updated occasionally, but I want to be able
  * to easily access them from everywhere. */

  getSeatDOM() {
    return this.game.doc.querySelector(
      `[data-qa="playerContainer-${this.seatID}"]`);
  }

  getHoleDOM() {
    return this.getSeatDOM().querySelector("[data-qa='holeCards']");
  }

  getBTNDOM() {
    return this.getSeatDOM().querySelector(".fm87pe9.Desktop");
  }

  getBetDOM() {
    return this.getSeatDOM().querySelector(".f1p6pf8a.Desktop");
  }

  /** Resets the location of the popup to be at the center of 
   * their "playerContainer" DOM element. */
  resetPopupPosition() {
    let seatRect = this.getSeatDOM().getBoundingClientRect();
    let verticalMiddle = Math.round((seatRect.top+(seatRect.bottom-seatRect.top)/2)*this.game.getZoom()).toString() + "px";
    let horizontalMiddle = Math.round((seatRect.left+(seatRect.right-seatRect.left)/2)*this.game.getZoom()).toString() + "px";
    this.popup.style.top = verticalMiddle;
    this.popup.style.left = horizontalMiddle;
  }

  /** Processes events that happen when the button moves (meaning 
   * that the next hand is about to start). */
  onBTNMove() {
    this.updateStats();
    this.dealtIn = 0;
    this.updatePopup();
    this.reinitialize();
  }

  /** Checks the player's status and initializes them accordingly */
  reinitialize() {
    this.bet = this.getBetDOM();

    /** The player is active but hasn't been recognized by the HUD 
     * yet (in other words, they need to be initialized). */
    if (this.bet && this.status === 0) {
      this.logMessage("initialized");

      this.hole = this.getHoleDOM();
      let holeObsConfig = {
        attributes: true,
        attributeFilter: ['style'],
        attributeOldValue: true
      };
      this.holeObs = new MutationObserver(this.onHoleChange.bind(this)).observe(this.hole, holeObsConfig);

      let betObsConfig = {
        characterData: true,
        childList: true,
        attributes: true,
        subtree: true
      };
      this.betObs = new MutationObserver(this.onBetChange.bind(this)).observe(this.bet, betObsConfig);

      this.resetPopupPosition();
      this.popup.style.visibility = "visible";

      this.status = 1;
    }
    /** The player is recognized by the HUD but no longer is part 
     * of the game (they need to be uninitialized). */
    else if (!this.bet && this.status === 1) {
      this.logMessage("is no longer sitting here, uninitialized");

      this.popup.style.visibility = "hidden";

      this.status = 0;
      this.bet = null;
      this.betObs = null;
      this.holeObs = null;
    }
    /** If neither of these conditions trigger, the 
     * player is correctly initialized. */
  }

  /** Processes events related to the bet in front of the player changing. */
  onBetChange(mlist, obs) {
    let newBet = Number(this.bet.innerHTML.replace(/\D/, '')).toFixed(2);
    let amtBet = (newBet - this.lastBet).toFixed(2);

    let toCall = this.game.toCall;
    let amtCall = toCall - this.lastBet;

    if (this.game.street === 0) {
      /** Detects checks, zeroing out of bets when a 
       * player continues to the next street, and folds. */
      if (newBet === 0 || amtBet < 0) {
        if (this.lastBet >= toCall) {
          this.logMessage("continues");
        } 
        else {
          this.logMessage("folds");
        }
      } 

      /** Detects raises */
      else if (amtBet > amtCall) {
        /** The bet counter is used to track how many raises 
         * have occured. This lets us classify a raise as a 
         * blind (0th or 1st), RFI, 3bet, 4bet, etc... */
        /** TODO: bet detection system fails when a blind is 
         * skipped (sometimes happens when people leave/join. */
        if (this.game.betCounter === 0) {
          this.logMessage("posts small blind");
          this.game.betCounter += 1;
        } 
        else if (this.game.betCounter === 1) {
          this.logMessage("posts big blind");
          this.game.betCounter += 1;
        }
        else {
          if (this.game.betCounter === 2) {
            this.logMessage(`has ${amtCall} to call, raises first in to ${newBet}`);
          } 
          else if (this.game.betCounter === 3) {
            /** TODO fix issues involving "your" seat being involved in 3bet
             *  hands (need to identify the specifics of the issues first). */
            this.logMessage(`has ${amtCall} to call, 3bets to ${newBet}`);
            this._3bet = 1;
          } 
          else {
            this.logMessage(`has ${amtCall} to call, reraises to ${newBet}`);
          }
          this.game.betCounter += 1;
          this._vpip = 1;
          this._pfr = 1;
        }
        this.game.toCall = newBet;
      }

      /** Detects calls */
      else {
        this.logMessage(`calls the bet of ${toCall}`);
        this._vpip = 1;
      }
    }

    this.lastBet = newBet;
  }

  /** Processes events related to the hole cards changing 
   * (most importantly, when the player is dealt in). */
  onHoleChange(mlist, obs) {
    let mlistSplit = mlist[0].oldValue.split(';');
    let state1 = mlistSplit[mlistSplit.length-2].split(' ');
    let state2 = mlist[0].target.style.opacity;

    if (state1[1] === 'opacity:') {
      if (parseInt(state1[2]) === 0 && parseInt(state2) === 1) {
        this.logMessage(`dealt hole cards`);
        this.dealtIn = 1;
      }
    }
  }

  logMessage(message) {
    this.game.logMessage(`Player ${this.seatID}: ${message}`);
  }

  /** Updates the player's stats. Ran at the end of each hand 
   * rather than during it, since some statistics depend on how 
   * the rest of the hand goes */
  updateStats() {
    if (!this.dealtIn) {
      return;
    }

    if (this.status === 1) {
      this.nvpip += this._vpip;
      this.npfr += this._pfr;
      this.n3bet += this._3bet;
      this.nhands += 1;
    }
    else {
      this.nvpip = 0;
      this.npfr = 0;
      this.n3bet = 0;
      this.nhands = 0;
    }
      
    this._vpip = 0;
    this._pfr = 0;
    this._3bet = 0;
  }

  /** Updates the player's popup stats display to reflect
   * the most current statistics. Also checks if the popup
   * is positioned on screen, and if not, move it back to
   * its default location. */
  updatePopup() {
    let winX = this.game.root.offsetWidth;
    let winY = this.game.root.offsetHeight;
    let displayX = parseInt(this.popup.style.left, 10);
    let displayY = parseInt(this.popup.style.top, 10);

    if (displayX > winX || displayY > winY) {
      this.resetPopupPosition();
    }

    let vpip = 0;
    let pfr = 0;
    let bet3 = 0;
    if (this.nhands > 0) {
      vpip = Math.round(100*this.nvpip/this.nhands);
      pfr = Math.round(100*this.npfr/this.nhands);
      bet3 = Math.round(100*this.n3bet/this.nhands);
    }
    let displayStr = `Stats for Player ${this.seatID}</br>VPIP: ${vpip}%</br>PFR: ${pfr}%</br>3bet: ${bet3}%</br>Hands: ${this.nhands}`;
    this.popup.innerHTML = displayStr;
  }
}

/** Processes events related to games being joined or left. */
function onFrameChange(mlist, obs) {    
  for (var i = 0; i < mlist.length; i++) {
    /** Nodes are added while creating or leaving a game. 
     * Occasionally other events happen but this filters those out. */
    if (mlist[i].addedNodes.length) {
      let win = null;
      let iframe = mlist[i].addedNodes[0].querySelector('[title="Table slot"]');
      if (iframe) {
        win = iframe.contentWindow;
      }

      /** If this section finds a non-null "win" object, it knows it 
       * can start a HUD instance for this game. */
      if (win) {
        console.log("starting timeout to account for load time...");
        setTimeout(function() {
          console.log("timeout done");
          console.log("game started");
          games[i] = new Game(win.document, i);
        }, 10000);
      }
      /** If no "win" object is found, by process of elimination this 
       * event was triggered by a game being left. */
      else {
        console.log("game closed");
        games[i] = null;
      }
    }
  }
}

/** The variable "frame" points to the div that holds up to four games 
 * at a time. Each empty game looks different than a game you are sitting
 * at so the observer checks for a change in one of these games and creates
 * or destroys a HUD Game class instance accordingly. */
let frame = document.getElementsByClassName("f1djomsr")[0];
let games = [null, null, null, null];
new MutationObserver(onFrameChange).observe(frame, {childList: true});