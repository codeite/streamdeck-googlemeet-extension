/// <reference types="chrome"/>

connect();
function connect() {
	const socket = new WebSocket('ws://localhost:1987');
	socket.onopen = () => {
		console.log('connected');
		runPlugin(socket);
	};
	socket.onclose = () => {
		console.log('disconnected');
		setTimeout(() => connect(), 1000);
	};
}

function runPlugin(socket: WebSocket) {
	let isMuted = false;
	let muteButton: HTMLElement | null = null;

	var extensionPort = chrome.runtime.connect({ name: 'live-meeting' });

	sendIdentification();
	sendMuteState();

	socket.addEventListener('message', function (event) {
		var message: actionMessage = JSON.parse(event.data);
		if (message.type === 'action') {
			if (message.value === 'mute') {
				mute();
			} else if (message.value === 'unmute') {
				unmute();
			} else if (message.value === 'togglemute') {
				toggleMute();
			} else {
				console.log('Dont know this action: ' + message.value);
			}
		}
	});

	type actionMessage = {
		type: 'action';
		value: string;
	};

	type muteStateMessage = {
		type: 'muteState';
		value: 'muted' | 'unmuted';
	};

	type identifyMessage = {
		type: 'identify';
		value: string;
	};

	function toggleMute() {
		let muteButton = document.querySelector('[data-tooltip="Turn off microphone (⌘ + D)"]') as HTMLElement;
		let unmuteButton = document.querySelector('[data-tooltip="Turn on microphone (⌘ + D)"]') as HTMLElement;

		if (muteButton) {
			muteButton.click();
		} else if (unmuteButton) {
			unmuteButton.click();
		} else {
			throw Error('No mute or unmute button found');
		}
	}

	function unmute() {
		let unmuteButton = document.querySelector('[data-tooltip="Turn on microphone (⌘ + D)"]') as HTMLElement;

		if (unmuteButton) {
			unmuteButton.click();
		}
	}

	function mute() {
		let muteButton = document.querySelector('[data-tooltip="Turn off microphone (⌘ + D)"]') as HTMLElement;

		if (muteButton) {
			muteButton.click();
		}
	}

	function updateMuteState() {
		if (muteButton) {
			if (isMuted !== Boolean(muteButton.getAttribute('data-is-muted') === 'true')) {
				isMuted = Boolean(muteButton.getAttribute('data-is-muted') === 'true');
				sendMuteState();
			}
		}
	}

	function observeMuteStateChange() {
		muteButton = document.querySelectorAll('[data-tooltip][data-is-muted]')[0] as HTMLElement;
		if (muteButton) {
			clearInterval(findMuteButton);
			let observer = new MutationObserver(updateMuteState);
			observer.observe(muteButton, {
				childList: false,
				attributes: true,
				attributeFilter: ['data-is-muted'],
				subtree: false,
			});
		}
	}
	let findMuteButton = window.setInterval(observeMuteStateChange, 250);

	function sendMuteState() {
		const message: muteStateMessage = {
			type: 'muteState',
			value: isMuted ? 'muted' : 'unmuted',
		};

		socket.send(JSON.stringify(message));
		extensionPort.postMessage({ isMuted: !!isMuted });
	}

	function sendIdentification() {
		var identify: identifyMessage = {
			type: 'identify',
			value: 'iamameet',
		};
		socket.send(JSON.stringify(identify));
	}
}
