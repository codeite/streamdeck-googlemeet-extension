/// <reference types="chrome"/>

var port = chrome.runtime.connectNative('be.jeroenvdb.streamdeckgooglemeet');

chrome.runtime.onMessage.addListener((message, sender, respond) => {
	if(message === 'new') respond(sender.tab?.id)
})

let connectedTabs: number[] = []

chrome.browserAction.onClicked.addListener(tab => {
	console.log({tab})
	if (connectedTabs.length > 0){
		const pos = connectedTabs.indexOf(tab.id || -1)
		if (pos === -1) {
			chrome.tabs.update(connectedTabs[0], {highlighted: true});
		} else {
			chrome.tabs.update(connectedTabs[pos], {highlighted: false});
			chrome.tabs.update(connectedTabs[(pos+1)%connectedTabs.length], {highlighted: true});
		}
	}
})
chrome.runtime.onConnect.addListener((extensionPort) => {
	const tabId = parseInt(extensionPort.name)
	console.log({tabId})
	extensionPort.onDisconnect.addListener(() => {
		connectedTabs = connectedTabs.filter(x => x !== tabId)
		chrome.browserAction.setBadgeText({ text: connectedTabs.length === 0 ? '' : `${connectedTabs.length}` });
	});
	
	connectedTabs.push(tabId);
	chrome.browserAction.setBadgeText({ text: `${connectedTabs.length}` });

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
