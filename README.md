# IgnitionHUD

Simple Chrome extension that records HUD stats while playing on Ignition Casino in your browser. If you have the extension active, it will start automatically when you visit the poker section of IgnitionCasino.eu and display draggable stats popups as soon as a hand has been completed.

![Screen shot](/screenshots/ss2.png?raw=true)
![Screen shot](/screenshots/ss4.png?raw=true)
![Screen shot](/screenshots/ss5.png?raw=true)

Current features:
- A variety of useful stats (VPIP, PFR, 3bet, hands played)
- Multitable support
- Automatic, draggable popups

Install instructions:
- Download the repo and save it in an unzipped folder.
- Visit <chrome://extensions/> in your Chrome browser and check the "Developer mode" slider in the top right corner.
![Developer mode](/resources/devmode.png?raw=true)
- Click the "Load unpacked extension" button (it should have appeared when you entered developer mode).
![Load unpacked extension](/resources/loadext.png?raw=true)
- Select the folder where you saved this repository.



TODO list:
- Other important stats (cbet, agg)
- Bug: If you disconnect from a game, the HUD will not reappear
- Bug: If the small blind is skipped (sometimes happens after players leave/join), the big blind is treated as the small blind, first raise as the big blind, etc...
- Bug: "you" being involved in hands sometimes messes up the statistics recorded. Unclear why to me right now.
- Errors when loading into a blank table (with no game). Unclear if these actually cause any problems though.
- Make the popups spawn in a better spot -- right now they appear right on top of each player's cards, which helps identify who they belong too but isn't where anyone will keep them.
