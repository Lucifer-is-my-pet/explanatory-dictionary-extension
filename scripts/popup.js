const MESS_ERROR = 'messages__error',
    MESS_NO = 'messages__no',
    RESULTS = 'results',
    TITLE = 'results__title',
    DEFINITION = 'results__definition';

document.querySelector('.word-search__button').addEventListener('click', function (event) {
    event.preventDefault();

    let oldDefinitions = document.querySelectorAll('.' + DEFINITION);
    let oldTitles = document.querySelectorAll('.' + TITLE);
    if (oldDefinitions.length) {
        for (let i = 0; i < oldDefinitions.length; i++) {
            oldDefinitions[i].parentElement.removeChild(oldDefinitions[i]);
        }
    }
    if (oldTitles.length) {
        for (let i = 0; i < oldTitles.length; i++) {
            oldTitles[i].parentElement.removeChild(oldTitles[i]);
        }
    }

    document.querySelector('.' + MESS_ERROR).classList.add(MESS_ERROR + '_hidden');
    document.querySelector('.' + MESS_NO).classList.add(MESS_NO + '_hidden');
    document.querySelector('.' + RESULTS).classList.add(RESULTS + '_hidden');


    let input = event.target.parentElement.querySelector('.word-search__input');

    if (input.validity.valid && input.value.length) {
        chrome.runtime.sendMessage({text: input.value}, onResponse);
    } else {
        event.target.parentElement.reset();
    }
});

document.querySelector('.word-search__input').focus();

function setInput(text) {
    if (text) {
        document.querySelector('.word-search__input').value = text.selection;
        document.querySelector('.word-search__input').focus();
    }
}

chrome.tabs.query({
    active: true,
    currentWindow: true
}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {wakeup: 1}, setInput);
});

function insertResults(arrayOfDicts) {
    // console.log(arrayOfDicts[0]);
    let gramota = arrayOfDicts[0].site === 'Грамота' ? arrayOfDicts[0] : arrayOfDicts[1];
    let wiktionary = arrayOfDicts[0].site === 'Викисловарь' ? arrayOfDicts[0] : arrayOfDicts[1];
    let gramotaSection = document.querySelector('.results__gramota');
    let wiktionarySection = document.querySelector('.results__wiktionary');

    if (gramota) {
        delete gramota.site;
        Object.keys(gramota).forEach(function (key) {
            let title = document.createElement('div');
            title.className = TITLE;
            title.innerHTML = key;
            let def = document.createElement('div');
            def.className = DEFINITION;
            def.innerHTML = gramota[key];
            gramotaSection.appendChild(title);
            gramotaSection.appendChild(def);
        });
    }
    if (wiktionary) {
        delete wiktionary.site;
        Object.keys(wiktionary).forEach(function (key) {
            if (Object.keys(wiktionary) > 1) {
                let title = document.createElement('div');
                title.className = TITLE;
                title.innerHTML = key;
                wiktionarySection.appendChild(title);
            }
            let def = document.createElement('div');
            def.className = DEFINITION;
            def.innerHTML = wiktionary[key];
            wiktionarySection.appendChild(def);
        });
    }
}

function onResponse(response) {
    if (!response) {
        document.querySelector('.' + MESS_ERROR).classList.remove(MESS_ERROR + '_hidden');
    } else {
        if (response.status > 0) { // есть результат
            insertResults(JSON.parse(response.definition));
            document.querySelector('.' + RESULTS).classList.remove(RESULTS + '_hidden');
        } else if (response.status < 0) { // ошибка
            document.querySelector('.' + MESS_ERROR).classList.remove(MESS_ERROR + '_hidden');
        } else { // нет результата
            document.querySelector('.' + MESS_NO).classList.remove(MESS_NO + '_hidden');
        }
    }
}