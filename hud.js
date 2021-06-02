class Game {
	static communityDOMQS = ".f34l2e8";

	static streetNames = ['Hole cards', 'Flop', 'Turn', 'River'];

	constructor(doc, id, max) {
		this.verbose = false;

		this.doc = doc;
		this.gameID = id;
		this.max = max;
	
		this.logMessage(`Initializing ${this.max}max game`);

		this.street = 0;
		this.betCounter = 0;

		this.community = this.doc.querySelector(Game.communityDOMQS);
		this.flop = this.community.children[0]; // DOM element of first card of flop
		this.turn = this.community.children[3]; // DOM element of turn card
		this.river = this.community.children[4]; // DOM element of river card

		new MutationObserver(this.makeStreetCallback(1).bind(this)).observe(this.flop, {attributes: true, childList: true, subtree: true});
		new MutationObserver(this.makeStreetCallback(2).bind(this)).observe(this.turn, {attributes: true, childList: true, subtree: true});
		new MutationObserver(this.makeStreetCallback(3).bind(this)).observe(this.river, {attributes: true, childList: true, subtree: true});

		this.players = [];
		for (var i = 0; i < this.max; i++) {
			this.players.push(new Player(this, i));
			new MutationObserver(this.makeBTNCallback(i).bind(this)).observe(this.players[i].btn, {attributes: true, attributeFilter: ['style'], attributeOldValue: true});
		}
	}

	logMessage(message) {
		if (this.verbose) {
			console.log(message);
		}
	}

	makeBTNCallback(seat) {
		function onBTNMove(mlist, obs) {
			let state1 = mlist[0].oldValue.split(';')[0].split(' ')[1];
			let state2 = mlist[0].target.style.visibility;
			if (state1 === 'hidden' && state2 === 'visible') {
				this.logMessage(`Button moved to player ${seat}`);
				this.street = 0;
				for (var i = 0; i < this.max; i++) {
					this.players[i].updateStats();
					this.players[i].updateDisplay();
					this.players[i].reinitialize();
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
			for (var i = 0; i < this.max; i++) {
				this.players[i].onStreetChange(street);
			}
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
	//static noteDOMQS = 'textarea[placeholder="Add note"]';

	constructor(game, seatID) {
		this.game = game;
		this.seatID = seatID;

		this.display = this.game.doc.createElement('div');
		this.display.innerHTML = "";
		this.display.class = "hud-stats-display";
		this.display.style.position = "absolute";
		this.display.style.visibility = "hidden";
		this.display.style.backgroundColor = "white";
		this.display.style.border = "1px solid black";
		this.display.style.zIndex = 10000;
		let root = this.game.doc.getElementsByClassName("f1qy5s7k")[0];
		root.appendChild(this.display);
		this.displayPositions = [0, 0, 0, 0];
		this.display.onmousedown = this.dragMouseDown.bind(this);

		this.seat = this.game.doc.querySelector(`[data-qa="playerContainer-${this.seatID}"]`);

		this.nhands = 0;
		this.nvpip 	= 0;
		this.npfr 	= 0;
		this.n3bet	= 0;

		this._vpip 	= 0;
		this._pfr 	= 0;
		this._3bet 	= 0;

		this.lastBet = 0;
		this.status = 0; // 0: uninitialized, 1: initialized

		this.btn = this.seat.querySelector(Player.btnDOMQS);
	}

	dragMouseDown(e) {
		e = e || this.game.doc.defaultView.event;
		e.preventDefault();

		this.displayPositions[2] = e.clientX;
		this.displayPositions[3] = e.clientY;
		this.display.onmouseup = this.closeDragStats.bind(this);
		this.display.onmousemove = this.statsDrag.bind(this);
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
		this.display.onmouseup = null;
		this.display.onmousemove = null;
	}
 	
 	// Make this player as active as possible; ran every time the button moves
	reinitialize() {
		if (this.status === 0) { // Uninitialized
			this.nhands = 0;
			this.nvpip = 0;
			this.npfr = 0;
			this.n3bet = 0;
		}
		this.bet = this.seat.querySelector(Player.betDOMQS);
		//this.note = this.seat.querySelector(Player.noteDOMQS);
		this.hole = this.seat.querySelector(`[data-qa="holeCards"]`);

		if (this.bet && this.status === 0) {
			this.betObs = new MutationObserver(this.onBetChange.bind(this)).observe(this.bet, {characterData: true, childList: true, attributes: true, subtree: true});
			//if (this.note) { // Player is someone other than you
			//	this.logMessage("has a player");
			//}
			//else {
			//	this.logMessage("is your seat");
			//}
			if (this.hole) {
				this.holeObs = new MutationObserver(this.onHoleChange.bind(this)).observe(this.hole, {attributes: true, attributeFilter: ['style'], attributeOldValue: true});
			}
			let seatRect = this.seat.getBoundingClientRect();
			this.display.style.top = seatRect.bottom + "px";
			this.display.style.left = seatRect.right + "px";
			this.display.style.visibility = "visible";
			this.status = 1;
		}
		else if (!this.bet && this.status === 1) {
			this.logMessage("is no longer sitting here, deinitialized");
			this.display.style.visibility = "hidden";
			this.status = 0;
			this.bet = null;
			//this.note = null;
			this.betObs = null;
			this.holeObs = null;
		}
	}

	onBetChange(mlist, obs) {
		let newBet = Number(this.bet.innerHTML.replace(/\D/, '')).toFixed(2);
		let amtBet = (newBet - this.lastBet).toFixed(2);

		let toCall = this.game.toCall;
		let amtCall = toCall - this.lastBet;

		// Bug: when the player is in the hand, stats get messed up

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
					// Raise (TODO classify RFI, 3bet, 4bet etc...)
					if (this.game.betCounter === 2) {
						this.logMessage(`has ${amtCall} to call, raises first in to ${newBet}`);
					}
					else if (this.game.betCounter >= 3) {
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

	onHoleChange(mlist, obs) {
		let oldOpacity = Number(mlist[0].oldValue.split(';')[2].split(' ')[2]); // TODO finish
		let newOpacity = Number(mlist[0].target.style.opacity);
		if (oldOpacity === 1 && newOpacity === 0) {
			// I have another way of determining folds right now but this works
			// this.logMessage("folds");
		}
	}

	onStreetChange(street) {
		// Right now there's nothing to do here
	}

	logMessage(message) {
		this.game.logMessage(`Player ${this.seatID}: ${message}`);
	}

	updateStats() {
		if (this.status === 1) {
			this.nvpip += this._vpip;
			this.npfr += this._pfr;
			this.n3bet += this._3bet;
			this.nhands += 1;
			this._vpip = 0;
			this._pfr = 0;
			this._3bet = 0;
		}
	}

	updateDisplay() {
		let vpip = 0;
		let pfr = 0;
		let bet3 = 0;
		if (this.nhands > 0) {
			vpip = Math.round(100*this.nvpip/this.nhands);
			pfr = Math.round(100*this.npfr/this.nhands);
			bet3 = Math.round(100*this.n3bet/this.nhands);
		}
		let displayStr = `Stats for Player ${this.seatID}</br>VPIP: ${vpip}%</br>PFR: ${pfr}%</br>3bet: ${bet3}%</br>Hands: ${this.nhands}`;
		//if (this.note) {
		//	this.note.value = displayStr;
		//}
		this.display.innerHTML = displayStr;
	}
}

let frame = document.getElementsByClassName("f1djomsr")[0];
let games = [null, null, null, null];

new MutationObserver(onFrameChange).observe(frame, {childList: true});

function onFrameChange(mlist, obs) {
	for (var i = 0; i < mlist.length; i++) {
		if (mlist[i].addedNodes.length) {
			let iframe = mlist[i].addedNodes[0].querySelector('[title="Table slot"]');
			if (iframe) {
				console.log("starting timeout to account for load time...");
				setTimeout(function() {
					console.log("timeout done");
					console.log("game started");
					games[i] = new Game(iframe.contentWindow.document, i, 6);
				}, 10000);
			}
			else {
				console.log("game closed");
				games[i] = null;
			}
		}
	}
}