chrome.runtime.onMessage.addListener(
    function (request, sender) {
        // If there exists a value named 'count'
        // in the message sent by content script
        let tex = '-';
        // let mess;
        if (request.text) {
            // console.log('Incoming message: ' + request.text);
            //     request.count + 'and tab id is ' + sender.tab.id);
            // Set the badge of the extension to the value of 'mytext'
            tex = request.text.length.toString();
            // tex = request.text.toString();
            // mess = request.text;
        }
        chrome.browserAction.setBadgeText({text: tex});
    }
);

// chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
//     chrome.tabs.sendMessage(tabs[0].id, {greeting: '!!'});
// });