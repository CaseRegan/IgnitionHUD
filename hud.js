class Game {
	constructor(doc) {
		this.doc = doc;
		this.max = 6;
		this.tocall = 0;
		this.blindCounter = 0;

		this.community = this.doc.querySelector(".f34l2e8");
		this.streets = ['Hole cards', 'Flop', 'Turn', 'River'];
		
		this.flop = this.community.children[0];
		let flopCallback = this.makeStreetCallback(1).bind(this);
		let flopObs = new MutationObserver(flopCallback).observe(this.flop, {attributes: true, childList: true, subtree: true});

		this.turn = this.community.children[3];
		let turnCallback = this.makeStreetCallback(2).bind(this);
		let turnObs = new MutationObserver(turnCallback).observe(this.turn, {attributes: true, childList: true, subtree: true});


		this.river = this.community.children[4];
		let riverCallback = this.makeStreetCallback(3).bind(this);
		let riverObs = new MutationObserver(riverCallback).observe(this.river, {attributes: true, childList: true, subtree: true});

		this.players = [];
		for (var i = 0; i < this.max; i++) {
			this.players.push(new Player(doc, i, [this.getToCall.bind(this), this.setToCall.bind(this)]));
			
			let btnCallback = this.makeBTNCallback(i).bind(this);
			let obs = new MutationObserver(btnCallback).observe(this.players[i].btn, {attributes: true, attributeFilter: ['style'], attributeOldValue: true});
		}
	}

	getToCall() {
		return this.tocall;
	}

	setToCall(amt) {
		this.blindCounter += 1;
		this.tocall = amt;
		console.log(`Blind counter is ${this.blindCounter}`);
		if (this.blindCounter > 2) {
			return 1;
		}
		else {
			return 0;
		}
	}

	makeBTNCallback(seat) {
		function onBTNMove(mlist, obs) {
			let state1 = mlist[0].oldValue.split(';')[0].split(' ')[1];
			let state2 = mlist[0].target.style.visibility;
			if (state1 === 'hidden' && state2 === 'visible') {
				console.log(`Button moved to player ${seat}`);
				for (var i = 0; i < this.max; i++) {
					this.players[i].setStreet(0);
				}
				this.tocall = 0;
				this.blindCounter = 0;
			}
		}
		return onBTNMove;
	}

	makeStreetCallback(street) {
		function onStreet(mlist, obs) {
			for (var i = 0; i < this.max; i++) {
				this.players[i].setStreet(street);
			}
			console.log(`${this.streets[street]} dealt`);
		}
		return onStreet;
	}
}

class Player {
	constructor(doc, seatID, funcs) {
		this.seatID = seatID;
		this.seat = doc.querySelector(`[data-qa="playerContainer-${this.seatID}"]`);

		this.getToCall = funcs[0];
		this.setToCall = funcs[1];

		this.nhands = 0;
		this.nvpip = 0;
		this.npfr = 0;

		this.tocall = 0;

		this.vpipTmp = 0;
		this.pfrTmp = 0;

		this.street = -1;
		// -1: uninitialized
		// 0: preflop
		// 1: flop
		// 2: turn
		// 3: river

		this.btn = this.seat.querySelector(".fm87pe9.Desktop");
	}

	setStreet(street) {
		if (street === 0) {
			if (this.street < 0) {
				this.bet = this.seat.querySelector(".f1p6pf8a.Desktop");
				this.note = this.seat.querySelector('textarea[placeholder="Add note"]');

				this.initialBet = 0;
		
				if (this.bet) {
					let betCallback = this.onBetChange.bind(this);
					this.obs = new MutationObserver(betCallback).observe(this.bet, {characterData: true, childList: true, attributes: true, subtree: true});
					if (this.note) {
						console.log(`Initialized player ${this.seatID}`);
					}
					else {
						console.log(`Initialized you at seat ${this.seatID}`);
					}
					this.street = 0;
				}
				else {
					console.log(`Seat ${this.seatID} is empty`);
				}
			}

			this.nvpip += this.vpipTmp;
			this.npfr += this.pfrTmp;
			this.vpipTmp = 0;
			this.pfrTmp = 0;
			this.updateDisplay();
			this.nhands += 1;
		}
		if (this.street > 0) {
			this.street = street;
		}
	}

	onBetChange(mlist, obs) {
		let newBet = Number(this.bet.innerHTML);

		if (this.street === 0) {
			if (newBet > this.getToCall()) {
				let betReturn = this.setToCall(newBet);
				if (betReturn > 0) {
					console.log(`Player ${this.seatID} has ${this.getToCall()} to call, raises to ${newBet}`);
				}
				else {
					console.log(`Player ${this.seatID} posts a blind`);
				}
				this.pfrTmp = betReturn;
			}
			else {
				console.log(`Player ${this.seatID} calls the bet of ${this.getToCall()}`);
			}
			this.vpipTmp = 1;
		}

		this.initialBet = Number(this.bet.innerHTML);
	}

	getVPIP() {
		if (this.nhands === 0)
			return 0;
		return Math.round(100*this.nvpip/this.nhands);
	}

	getPFR() {
		if (this.nhands === 0)
			return 0;
		return Math.round(100*this.npfr/this.nhands);
	}

	updateDisplay() {
		if (this.note) {
			this.note.value = `VPIP: ${this.getVPIP()}\nPFR: ${this.getPFR()}\nHands: ${this.nhands}`
		}
	}
}

console.log("Started HUD!");

var game = new Game(document.querySelectorAll('[title="Table slot"]')[1].contentWindow.document);
