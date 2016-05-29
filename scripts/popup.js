document.querySelector('.word-search__button').addEventListener('click', function (event) {
    event.preventDefault();
    
    let input = event.target.parentElement.querySelector('.word-search__input');

    if (input.validity.valid) {
        chrome.runtime.sendMessage({text: input.value});
    } else {
        event.target.parentElement.reset();
    }
});

chrome.tabs.query({
    active: true,
    currentWindow: true
}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {wakeup: 1}, setInput);
});


function setInput(text) {
    if (text) {
        document.querySelector('.word-search__input').value = text.selection;
        document.querySelector('.word-search__input').focus();
    }
}
