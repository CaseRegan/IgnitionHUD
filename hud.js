class Game {
	static communityDOMQS = ".f34l2e8";
	static rootDOMQS = ".f1qy5s7k";
	static zoomDOMQS = ".f1so0fyt";

	static streetNames = ['Hole cards', 'Flop', 'Turn', 'River'];

	constructor(doc, id, max) {
		// The "verbose" flag determines if actions will be logged in the Chrome console
		// If it is set to false, each call to "logMessage" will do nothing
		this.verbose = false;
		this.logMessage(`Initializing ${this.max}max game`);

		// TODO: better detection of if this game can be initialized or not
		if (!doc) {
			return null;
		}

		this.doc = doc;			// The client uses an iframe for each table you're at and this is a pointer to the corresponding html doc
		this.gameID = id;		// Indicates if this game is table 1, 2, 3, or 4

		this.max = this.doc.querySelector(Game.zoomDOMQS).childNodes.length-2;
								// The maximum number of seats at the game (ex: 6 for a 6max game)
		
		this.street = 0;		// Indicates what street the game is currently playing (preflop, flop, turn, or river)
		this.betCounter = 0;	// Indicates the number of raises on the current street

		// Relate DOM elements to each group of community cards (flop, turn, and river)
		this.community = this.doc.querySelector(Game.communityDOMQS);
		this.flop = this.community.children[0];
		this.turn = this.community.children[3];
		this.river = this.community.children[4];

		// Bind a custom callback function to changes in the DOM elements of each group of community cards
		new MutationObserver(this.makeStreetCallback(1).bind(this)).observe(this.flop, {attributes: true, childList: true, subtree: true});
		new MutationObserver(this.makeStreetCallback(2).bind(this)).observe(this.turn, {attributes: true, childList: true, subtree: true});
		new MutationObserver(this.makeStreetCallback(3).bind(this)).observe(this.river, {attributes: true, childList: true, subtree: true});

 		// This is the DOM element in which stats popups are placed
		this.root = this.doc.querySelector(Game.rootDOMQS);

		// Initialize list of players
		this.players = [];
		for (var i = 0; i < this.max; i++) {
			this.players.push(new Player(this, i));
			let btnObsCallback = this.makeBTNCallback(i).bind(this);
			let btnObsConfig = {
				attributes: true,
				attributeFilter: ['style'],
				attributeOldValue: true
			};
			// Observes button movement to detect when the next hand has started
			new MutationObserver(btnObsCallback).observe(this.players[i].btn, btnObsConfig);
		}
	}

	logMessage(message) {
		if (this.verbose) {
			console.log(message);
		}
	}

	getZoom() {
		return Number(this.doc.querySelector(Game.zoomDOMQS).style.zoom);
	}

	// Creates the custom callback function for each player to tell them that the button moved
	makeBTNCallback(seat) {
		function onBTNMove(mlist, obs) {
			let state1 = mlist[0].oldValue.split(';')[0].split(' ')[1];
			let state2 = mlist[0].target.style.visibility;
			if (state1 === 'hidden' && state2 === 'visible') {
				this.logMessage(`Button moved to player ${seat}`);
				this.street = 0;
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

	makeStreetCallback(street) {
		function onStreet(mlist, obs) {
			//for (var i = 0; i < this.max; i++) {
			//	this.players[i].onStreetChange(street);
			//}
			this.street = street;
			this.toCall = 0;
			this.betCounter = 0;

			this.logMessage(Game.streetNames[street] + " dealt");
		}

		return onStreet;
	}
}

class Player {
	static btnDOMQS = ".fm87pe9.Desktop";
	static betDOMQS = ".f1p6pf8a.Desktop";
	static holeDOMQS = "[data-qa='holeCards']";

	constructor(game, seatID) {
		this.game = game;
		this.seatID = seatID;

		this.display = this.game.doc.createElement('div');
		this.display.class = "hud-stats-display";
		this.display.style.position = "absolute";
		this.display.style.visibility = "hidden";
		this.display.style.backgroundColor = "white";
		this.display.style.border = "1px solid black";
		this.display.style.zIndex = 10000;

		this.game.root.appendChild(this.display);
		this.displayPositions = [0, 0, 0, 0];
		this.display.onmousedown = this.dragMouseDown.bind(this);

		this.seat = this.game.doc.querySelector(`[data-qa="playerContainer-${this.seatID}"]`);
		this.hole = null;
		this.btn = this.seat.querySelector(Player.btnDOMQS);

		this.nhands = 0;
		this.nvpip 	= 0;
		this.npfr 	= 0;
		this.n3bet	= 0;

		this.dealtIn = 0;
		this._vpip 	= 0;
		this._pfr 	= 0;
		this._3bet 	= 0;

		this.lastBet = 0;
		this.status = 0;
	}

	dragMouseDown(e) {
		e = e || this.game.doc.defaultView.event;
		e.preventDefault();

		this.displayPositions[2] = e.clientX;
		this.displayPositions[3] = e.clientY;
		this.game.doc.onmouseup = this.closeDragStats.bind(this);
		this.game.doc.onmousemove = this.statsDrag.bind(this);
	}

	statsDrag(e) {
		e = e || this.game.doc.defaultView.event;
		e.preventDefault();

		this.displayPositions[0] = this.displayPositions[2] - e.clientX;
		this.displayPositions[1] = this.displayPositions[3] - e.clientY;
		this.displayPositions[2] = e.clientX;
		this.displayPositions[3] = e.clientY;

		this.display.style.top = (this.display.offsetTop-this.displayPositions[1]) + "px";
		this.display.style.left = (this.display.offsetLeft-this.displayPositions[0]) + "px";
	}

	closeDragStats() {
		this.game.doc.onmouseup = null;
		this.game.doc.onmousemove = null;
	}

	resetStatsPosition() {
		this.seat = this.game.doc.querySelector(`[data-qa="playerContainer-${this.seatID}"]`);
		this.btn = this.seat.querySelector(Player.btnDOMQS);

		let seatRect = this.seat.getBoundingClientRect();
		let verticalMiddle = Math.round((seatRect.top+(seatRect.bottom-seatRect.top)/2)*this.game.getZoom()).toString() + "px";
		let horizontalMiddle = Math.round((seatRect.left+(seatRect.right-seatRect.left)/2)*this.game.getZoom()).toString() + "px";
		this.display.style.top = verticalMiddle;
		this.display.style.left = horizontalMiddle;
	}
 	
	onBTNMove() {
		this.updateStats();
		this.dealtIn = 0;
		this.updateDisplay();
		this.reinitialize();
	}

 	// Make this player as active as possible; ran every time the button moves
	reinitialize() {
		this.bet = this.seat.querySelector(Player.betDOMQS);
		this.seat = this.game.doc.querySelector(`[data-qa="playerContainer-${this.seatID}"]`);

		if (this.bet && this.status === 0) { // Active but uninitialized (player needs to be initialized)
			this.logMessage("initialized");

			this.hole = this.seat.querySelector(Player.holeDOMQS);
			let holeObsCallback = this.onHoleChange.bind(this);
			let holeObsConfig = {
				attributes: true,
				attributeFilter: ['style'],
				attributeOldValue: true
			};
			this.holeObs = new MutationObserver(holeObsCallback).observe(this.hole, holeObsConfig);
			
			// Create observer for bet DOM element
			this.betObs = new MutationObserver(this.onBetChange.bind(this)).observe(this.bet, {characterData: true, childList: true, attributes: true, subtree: true});
			
			// Make stats display visible and position it
			this.resetStatsPosition();
			this.display.style.visibility = "visible";

			// Set status to initialized
			this.status = 1;
		}
		else if (!this.bet && this.status === 1) { // Inactive but initialized (player needs to be uninitialized)
			this.logMessage("is no longer sitting here, uninitialized");

			// Made stats display invisible
			this.display.style.visibility = "hidden";

			// Set status to uninitialized and make sure the player has no pointers to DOM objects
			this.status = 0;
			this.bet = null;
			this.betObs = null;
		}
		// else: Active and initialized or inactive and uninitialzed (aka correct state)

	}

	onBetChange(mlist, obs) {
		let newBet = Number(this.bet.innerHTML.replace(/\D/, '')).toFixed(2);
		let amtBet = (newBet - this.lastBet).toFixed(2);

		let toCall = this.game.toCall;
		let amtCall = toCall - this.lastBet;

		if (this.game.street === 0) {
			if (newBet === 0 || amtBet < 0) {
				if (this.lastBet >= toCall) {
					this.logMessage("continues");
				}
				else {
					this.logMessage("folds");
				}
			}
			else if (amtBet > amtCall) { // Player raises
				if (this.game.betCounter === 0) {
					// Post small blind
					this.logMessage("posts small blind");
					this.game.betCounter += 1;
				}
				else if (this.game.betCounter === 1) {
					// Post big bliind
					this.logMessage("posts big blind");
					this.game.betCounter += 1;
				}
				else {
					// Raise first in
					if (this.game.betCounter === 2) {
						this.logMessage(`has ${amtCall} to call, raises first in to ${newBet}`);
					}
					else if (this.game.betCounter >= 3) {
						// TODO: Fix and make this only capture 3bets, not 4bets+ as well
						// There's an issue where if the player is involved in a 3bet hand it won't record correctly
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
			else { // Player calls
				this.logMessage(`calls the bet of ${toCall}`);
				this._vpip = 1;
			}
		}

		this.lastBet = newBet;
	}

	onStreetChange(street) {
		// Right now there's nothing to do here
	}

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

	// Ran at the end of each hand to update the player's statistics based on their actions
	// This can't be done as the hand is in progress because some actions may need future context
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

	// Updates the stats popup display
	// TODO: Consider putting logic for keeping the popup on screen after display changes here?
	updateDisplay() {
		let winX = this.game.root.offsetWidth;
		let winY = this.game.root.offsetHeight;
		let displayX = parseInt(this.display.style.left, 10);
		let displayY = parseInt(this.display.style.top, 10);

		if (displayX > winX || displayY > winY) {
			this.resetStatsPosition();
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
		this.display.innerHTML = displayStr;
	}
}

let frame = document.getElementsByClassName("f1djomsr")[0];
let games = [null, null, null, null];

// Observes the page and acts when an element in the list where games go is changed
new MutationObserver(onFrameChange).observe(frame, {childList: true});

// Ran whenever the state of the main page changes
// Checks for what type of event happened and acts accordingly
function onFrameChange(mlist, obs) {	
	for (var i = 0; i < mlist.length; i++) {
		if (mlist[i].addedNodes.length) {
			let win = null;
			let iframe = mlist[i].addedNodes[0].querySelector('[title="Table slot"]');
			if (iframe) {
				win = iframe.contentWindow;
			}
			if (win) {
				// This uses a timeout right now, so it will fail on especially slow PCs
				// and be annoyingly slow on very fast ones. Can be improved but this is
				// an easy solution for right now.
				console.log("starting timeout to account for load time...");
				setTimeout(function() {
					console.log("timeout done");
					console.log("game started");
					games[i] = new Game(win.document, i, 6);
				}, 10000);
			}
			else {
				console.log("game closed");
				games[i] = null;
			}

			// Whenever a new game is initialized or destroyed, the layout will change 
			// and stats popups may get left offscreen or otherwise mispositioned
			for (var j = 0; j < games.length; j++) {
				/*if (games[j]) {
					for (var k = 0; k < games[j].max; k++) {
						games[j].players[k].resetStatsPosition();
					}
				}*/
			}
		}
	}
}