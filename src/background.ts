/// <reference types="chrome"/>

var port = chrome.runtime.connectNative('be.jeroenvdb.streamdeckgooglemeet');

let connectedCount = 0;
chrome.runtime.onConnect.addListener((extensionPort) => {
	extensionPort.onDisconnect.addListener(() => {
		connectedCount--;
		chrome.browserAction.setBadgeText({ text: connectedCount === 0 ? '' : `${connectedCount}` });
	});
	connectedCount++;
	chrome.browserAction.setBadgeText({ text: `${connectedCount}` });

	extensionPort.onMessage.addListener(function (msg) {
		console.log({ msg });
		if (typeof msg.isMuted === 'boolean') {
			const path = msg.isMuted ? 'mute.png' : 'mic.png';
			chrome.browserAction.setIcon({ path });
		}
	});
});

port.onMessage.addListener((req) => {
	if (chrome.runtime.lastError) {
		console.log(chrome.runtime.lastError.message);
	}
	handleMessage(req);
});

port.onDisconnect.addListener(() => {
	if (chrome.runtime.lastError) {
		console.log(chrome.runtime.lastError.message);
	}
	console.log('Disconnected');
});

port.postMessage({ message: 'ping', body: 'hello from browser extension' });

function handleMessage(req: any) {
	if (req.message === 'pong') {
		console.log(req);
	}
}
