# IgnitionHUD

Simple Chrome extension that records HUD stats while playing on Ignition Casino in your browser. Click the extension logo and press the start button after you have loaded into a game. Stats show up in the "notes" section of each player in the client. You can also open up the Chrome console which will display an action history since the HUD was started.

Current features:
- VPIP
- PFR
- 3bet
- Hands played
- Multitable support
- Runs automatically in background (doesn't require user interaction to start)

TODO list:
- Other important stats (cbet, agg)
- Automatically detecting table size (very easy I'm just lazy)
- Bug fixes including: better method of detecting that you've loaded into a game (currently uses a timer that guesses at the load time, on a very slow computer/connection things may break), testing for joining/leaving many tables (the basic use cases work but I haven't tested all corner ones)
- Refining how the HUD interacts with the Chrome console; during development I wanted as much info there as possible but with many tables at once displaying every single action is a bit much.
- Display Hero stats somewhere since Hero doesn't have notes for themself. Maybe use console for this exclusively?