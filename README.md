# IgnitionHUD

Simple Chrome extension that records HUD stats while playing on Ignition Casino in your browser. If you have the extension active, it will start automatically when you visit the poker section of IgnitionCasino.eu and display draggable stats popups as soon as a hand has been completed.

![Screen shot](/screenshots/ss2.png?raw=true)
![Screen shot](/screenshots/ss4.png?raw=true)
![Screen shot](/screenshots/ss5.png?raw=true)

Current features:
- A variety of useful stats (VPIP, PFR, 3bet, hands played)
- Multitable support
- Automatic, draggable popups

TODO list:
- Other important stats (cbet, agg)
- Automatically detecting table size (very easy I'm just lazy)
- Bug: some players record stats before being dealt in (they will be 0/0/0/X for the X hands before they're dealt in)
- Bug: If you disconnect from a game, the HUD will not reappear
- Errors when loading into a blank table (with no game). Unclear if these actually cause any problems though.
- Make the popups spawn in a better spot -- right now they appear right on top of each player's cards, which helps identify who they belong too but isn't where anyone will keep them.