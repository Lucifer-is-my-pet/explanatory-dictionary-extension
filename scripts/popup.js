const MESS_ERROR = 'messages__error',
    MESS_NO = 'messages__no',
    RESULTS = 'results',
    TITLE = 'results__title',
    DEFINITION = 'results__definition',
    WIKTIONARY = 'results__wiktionary',
    GRAMOTA = 'results__gramota';

function createTitle(sectionTitle, section) {
    let title = document.createElement('div');
    title.className = TITLE;
    title.innerHTML = sectionTitle;

    section.appendChild(title);
}

function createDefinition(definition, section) {
    let def = document.createElement('div');
    def.className = DEFINITION;
    def.innerHTML = definition;

    section.appendChild(def);
}

function setInput(text) {
    if (text) {
        document.querySelector('.word-search__input').value = text.selection.toLowerCase();
        document.querySelector('.word-search__input').focus();
        document.querySelector('.word-search__button').dispatchEvent(new Event("click", {bubbles: true, cancelable: true}));
    }
}

function insertResults(arrayOfDicts) {
    let gramota = arrayOfDicts[0].site === 'Грамота' ? arrayOfDicts[0] : arrayOfDicts[1];
    let wiktionary = arrayOfDicts[0].site === 'Викисловарь' ? arrayOfDicts[0] : arrayOfDicts[1];
    let gramotaSection = document.querySelector('.' + GRAMOTA);
    let wiktionarySection = document.querySelector('.' + WIKTIONARY);

    if (gramota) {
        delete gramota.site;

        Object.keys(gramota).forEach(function (key) {
            createTitle(key, gramotaSection);
            createDefinition(gramota[key], gramotaSection);
        });

        gramotaSection.classList.remove(GRAMOTA + '_hidden');
    }
    if (wiktionary) {
        delete wiktionary.site;

        Object.keys(wiktionary).forEach(function (key) {
            if (Object.keys(wiktionary).length > 1) {
                createTitle(key, wiktionarySection);
            }

            createDefinition(wiktionary[key], wiktionarySection);
        });

        wiktionarySection.classList.remove(WIKTIONARY + '_hidden');
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

function defaultCondition() {
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
    document.querySelector('.' + GRAMOTA).classList.add(GRAMOTA + '_hidden');
    document.querySelector('.' + WIKTIONARY).classList.add(WIKTIONARY + '_hidden');
}

document.querySelector('.word-search__button').addEventListener('click', function (event) {
    event = event || window.event;
    event.preventDefault();

    defaultCondition();

    let input = event.target.parentElement.parentElement.querySelector('.word-search__input');

    if (input.validity.valid && input.value.length) {
        chrome.runtime.sendMessage({text: input.value}, onResponse);
    } else {
        event.target.parentElement.parentElement.reset();
    }
});

document.querySelector('.word-search__input').focus();

chrome.tabs.query({
    active: true,
    currentWindow: true
}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {wakeup: 1}, setInput);
});

document.querySelector('.bug-report').addEventListener('click', function (event) {
    event = event || window.event;
    chrome.tabs.create({active: true, url: event.target.parentElement.href});
});