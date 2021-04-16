class Game {
	constructor(doc) {
		this.doc = doc;
		this.btn = -1;
		this.max = 9;

		this.players = [];
		for (var i = 0; i < 9; i++) {
			this.players.push(new Player(doc, i));
			let btnCallback = this.onBtnMove.bind(this);
			let obs = new MutationObserver(btnCallback).observe(this.players[i].deal, {attributes: true, attributeFilter: ['style'], attributeOldValue: true});
			if (this.players[i].isButton()) {
				this.btn = i;
			}
		}
	}

	onBtnMove(mlist, obs) {
		console.log(mlist[0].oldValue.split(';')[0]);
		console.log(mlist[0].target.style.visibility);
		if (this.players[this.btn].isButton()) {
			this.btn = this.btn+1;
			if (this.btn >= this.max) {
				this.btn = 0;
			}
			console.log(this.btn);
		}
	}
}

class Player {
	constructor(doc, seatID) {
		this.seatID = seatID;
		this.seat = doc.querySelector(`[data-qa="playerContainer-${this.seatID}"]`);
		this.deal = this.seat.childNodes[1].childNodes[this.seat.childNodes[1].childNodes.length-1];
		this.initialized = 0;
		this.prevBTN = this.isButton();
	}

	initialize() {
		try {
			this.nvpip 	= 0;
			this.npfr  	= 0;
			this.nhands = 0;
			this.ispreflop = 1;
			this.note = this.seat.querySelector('textarea[placeholder="Add note"]');
			this.bet = this.seat.childNodes[1].childNodes[0].childNodes[0].childNodes[1];
			this.initialbet = Number(this.bet.innerHTML);
			let betCallback = this.onBetChange.bind(this);
			this.obs = new MutationObserver(betCallback).observe(this.bet, {characterData: true, childList: true, attributes: true, subtree: true});
			this.initalized = 1;
			console.log(`Player ${this.seatID} successfully initialized`);
		}
		catch (TypeError) {
			console.log(`Player ${this.seatID} cannot be initalized`);
		}
	}

	reset() {
		this.ispreflop = 1;

		try {
			this.initialize();
		}
		catch (TypeError) {
			console.log(`Failed to initialize player ${this.seatID} on reset`);
		}
	}

	isButton() {
		return this.deal.style.visibility === 'visible';
	}

	onBetChange(mlist, obs) {
		console.log(`Player ${this.seatID} bet changed to ${this.bet.innerHTML} from ${this.initialbet}`);

		if (this.bet.innerHTML > this.initialbet && this.ispreflop) {
			this.nvpip += 1;
			// if not call
			this.npfr += 1;
			this.updateDisplay();
		}

		this.initialbet = this.bet.innerHTML;
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
		this.note.value = `VPIP: ${this.getVPIP()}\nPFR:${this.getPFR()}`;
	}
}

console.log("Loading HUD...");

var game = new Game(document.querySelectorAll('[title="Table slot"]')[1].contentWindow.document);