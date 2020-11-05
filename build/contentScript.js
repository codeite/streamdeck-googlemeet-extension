"use strict";
const getTabId = () => new Promise(resolve => {
    chrome.runtime.sendMessage('new', response => {
        resolve(response);
    });
});
connect();
function connect() {
    const socket = new WebSocket('ws://localhost:1987');
    socket.onopen = async () => {
        console.log('connected');
        const tabId = await getTabId();
        runPlugin(socket, tabId);
    };
    socket.onclose = () => {
        console.log('disconnected');
        setTimeout(() => connect(), 1000);
    };
}
function runPlugin(socket, tabId) {
    console.log('runPlugin');
    let isMuted = false;
    let isHidden = false;
    let callState = 'notoncall';
    setInterval(() => {
        const hup = document.querySelector('[aria-label="Leave call"]');
        const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
        const join = buttons.find(x => x.innerText === 'Join now');
        const testCallState = hup ? 'oncall' : (join ? 'inloby' : 'notoncall');
        if (callState !== testCallState) {
            callState = testCallState;
            sendOnCallState();
        }
    }, 250);
    let muteButton = null;
    let cameraButton = null;
    var extensionPort = chrome.runtime.connect({ name: "" + tabId });
    sendIdentification();
    socket.addEventListener('message', function (event) {
        var message = JSON.parse(event.data);
        if (message.type === 'action') {
            if (message.value === 'mute') {
                mute();
            }
            else if (message.value === 'unmute') {
                unmute();
            }
            else if (message.value === 'togglemute') {
                toggleMute();
            }
            else if (message.value === 'togglecamera') {
                toggleCamera();
            }
            else if (message.value === 'leavecall') {
                leaveCall();
            }
            else {
                console.log('Dont know this action: ' + message.value);
            }
        }
    });
    function toggleMute() {
        let muteButton = document.querySelector('[data-tooltip="Turn off microphone (⌘ + D)"]');
        let unmuteButton = document.querySelector('[data-tooltip="Turn on microphone (⌘ + D)"]');
        if (muteButton) {
            muteButton.click();
        }
        else if (unmuteButton) {
            unmuteButton.click();
        }
        else {
            throw Error('No mute or unmute button found');
        }
    }
    function toggleCamera() {
        let hideButton = document.querySelector('[data-tooltip="Turn off camera (⌘ + E)"]');
        let unhideButton = document.querySelector('[data-tooltip="Turn on camera (⌘ + E)"]');
        if (hideButton) {
            hideButton.click();
        }
        else if (unhideButton) {
            unhideButton.click();
        }
        else {
            throw Error('No hide or unhide button found');
        }
    }
    function leaveCall() {
        let leaveCallButton = document.querySelector('[data-tooltip="Leave call"]');
        if (leaveCallButton) {
            leaveCallButton.click();
        }
        else {
            const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
            const join = buttons.find(x => x.innerText === 'Join now');
            if (join)
                join.click();
        }
    }
    function unmute() {
        let unmuteButton = document.querySelector('[data-tooltip="Turn on microphone (⌘ + D)"]');
        if (unmuteButton) {
            unmuteButton.click();
        }
    }
    function mute() {
        let muteButton = document.querySelector('[data-tooltip="Turn off microphone (⌘ + D)"]');
        if (muteButton) {
            muteButton.click();
        }
    }
    function updateMuteState(force) {
        if (muteButton) {
            const buttonState = Boolean(muteButton.getAttribute('data-is-muted') === 'true');
            if (isMuted !== buttonState || force === true) {
                isMuted = buttonState;
                sendMuteState();
            }
        }
    }
    function updateCameraState(force) {
        if (cameraButton) {
            const buttonState = Boolean(cameraButton.getAttribute('data-is-muted') === 'true');
            console.log({ buttonState, cameraButton });
            if (isHidden !== buttonState || force === true) {
                isHidden = buttonState;
                sendCameraState();
            }
        }
    }
    function observeMuteStateChange() {
        muteButton = document.querySelector('[aria-label="Turn off microphone (⌘ + D)"]') || document.querySelector('[aria-label="Turn on microphone (⌘ + D)"]');
        cameraButton = document.querySelector('[aria-label="Turn off camera (⌘ + E)"]') || document.querySelector('[aria-label="Turn on camera (⌘ + E)"]');
        if (muteButton && cameraButton) {
            clearInterval(findButtons);
            new MutationObserver(updateMuteState).observe(muteButton, {
                childList: false,
                attributes: true,
                attributeFilter: ['aria-label'],
                subtree: false,
            });
            new MutationObserver(updateCameraState).observe(cameraButton, {
                childList: false,
                attributes: true,
                attributeFilter: ['aria-label'],
                subtree: false,
            });
            updateMuteState(true);
            updateCameraState(true);
        }
    }
    let findButtons = window.setInterval(observeMuteStateChange, 250);
    function sendMuteState() {
        const message = {
            type: 'muteState',
            value: isMuted ? 'muted' : 'unmuted',
        };
        socket.send(JSON.stringify(message));
        extensionPort.postMessage({ isMuted: !!isMuted });
    }
    function sendCameraState() {
        const message = {
            type: 'cameraState',
            value: isHidden ? 'hidden' : 'unhidden',
        };
        socket.send(JSON.stringify(message));
    }
    function sendOnCallState() {
        const message = {
            type: 'callState',
            value: callState,
        };
        console.log(message);
        socket.send(JSON.stringify(message));
    }
    function sendIdentification() {
        var identify = {
            type: 'identify',
            value: 'iamameet',
        };
        socket.send(JSON.stringify(identify));
    }
}
