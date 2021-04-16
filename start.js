function start() {
	chrome.tabs.executeScript({
		file: 'hud.js'
	});
}

document.getElementById('startHUD').addEventListener('click', start);