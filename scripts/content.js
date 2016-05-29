chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.wakeup) {
            let text = window.getSelection().toString();
            if (text) {
                sendResponse({selection: text});
            }
        }
    }
);