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

	logMessage(message) {
		if (this.verbose) {
			console.log(message);
		}
	}

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
	static btnDOMQS = ".fm87pe9.Desktop";
	static betDOMQS = ".f1p6pf8a.Desktop";
	static holeDOMQS = "[data-qa='holeCards']";

	constructor(game, seatID) {
		this.game = game;
		this.seatID = seatID;

		/*this.display = this.game.doc.createElement('div');
		this.display.class = "hud-stats-display";
		this.display.style.position = "absolute";
		this.display.style.visibility = "hidden";
		this.display.style.backgroundColor = "white";
		this.display.style.border = "1px solid black";
		this.display.style.zIndex = 10000;*/
		this.popup = this.generateStatsPopup();

		/*this.game.root.appendChild(this.display);
		this.displayPositions = [0, 0, 0, 0];
		this.display.onmousedown = this.dragMouseDown.bind(this);*/
		this.game.root.appendChild(this.popup);

		this.seat = this.getSeatDOM();
		this.hole = this.getHoleDOM();
		this.btn = this.getBTNDOM();
		this.bet = null;

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

	/*dragMouseDown(e) {
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
	}*/

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

	resetStatsPosition() {
		let seatRect = this.getSeatDOM().getBoundingClientRect();
		let verticalMiddle = Math.round((seatRect.top+(seatRect.bottom-seatRect.top)/2)*this.game.getZoom()).toString() + "px";
		let horizontalMiddle = Math.round((seatRect.left+(seatRect.right-seatRect.left)/2)*this.game.getZoom()).toString() + "px";
		this.popup.style.top = verticalMiddle;
		this.popup.style.left = horizontalMiddle;
	}
 	
	onBTNMove() {
		this.updateStats();
		this.dealtIn = 0;
		this.updateDisplay();
		this.reinitialize();
	}

 	// Make this player as active as possible; ran every time the button moves
	reinitialize() {
		this.bet = this.getBetDOM();

		if (this.bet && this.status === 0) { // Active but uninitialized (player needs to be initialized)
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
			
			this.resetStatsPosition();
			this.popup.style.visibility = "visible";

			this.status = 1;
		}
		else if (!this.bet && this.status === 1) { // Inactive but initialized (player needs to be uninitialized)
			this.logMessage("is no longer sitting here, uninitialized");

			// Made stats display invisible
			this.popup.style.visibility = "hidden";

			// Set status to uninitialized and make sure the player has no pointers to DOM objects
			this.status = 0;
			this.bet = null;
			this.betObs = null;
			this.holeObs = null;
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
			else {
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
		let displayX = parseInt(this.popup.style.left, 10);
		let displayY = parseInt(this.popup.style.top, 10);

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
		this.popup.innerHTML = displayStr;
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
					games[i] = new Game(win.document, i);
				}, 10000);
			}
			else {
				console.log("game closed");
				games[i] = null;
			}
		}
	}
}