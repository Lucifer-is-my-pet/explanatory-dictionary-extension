const needle = require('needle'),
    cheerio = require("cheerio"),
    GRAMOTA = 'http://www.gramota.ru/slovari/dic/?bts=x&az=x&word=',
    WIKTIONARY = 'http://ru.wiktionary.org/w/index.php?action=render&title=';

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.text) {

            needle.get('http://luciferismypet.pythonanywhere.com/?word=' + request.text,
                function (error, response) {
                    if (error || response.statusCode === 418) {
                        sendResponse({status: -1});
                    } else {
                        const urlArray = [
                            GRAMOTA + encodeURIComponent(response.body),
                            WIKTIONARY + encodeURIComponent(response.body)
                        ];
                        let result = [];
                        let errCounter = 0;

                        function cb(err, resp) {
                            if (!err) {
                                result.push(grabTheInfo(resp.body, resp.url));

                                if (result.length === urlArray.length) {
                                    sendResp(result, sendResponse);
                                }
                            } else if (err) {
                                if (!errCounter) {
                                    errCounter++;
                                    sendResponse({status: -1});
                                    return true;
                                }
                            }
                        }

                        sendRequests(urlArray, cb);
                    }
                }
            );
        }
        return true;
    }
);

function sendResp(arrayOfResults, sendResponse) {
    let checked = arrayOfResults.filter(function (result) {
        return result !== null;
    });

    if (checked.length) {
        sendResponse({
            status: 1,
            definition: JSON.stringify(checked)
        });
    } else { // пусто по всем запросам
        sendResponse({status: 0});
    }
}

function sendRequests(urlArray, callback) {
    urlArray.forEach(function (url) {
        needle.get(url, callback);
    });
}

function grabTheInfo(string, host) {
    let $ = cheerio.load(string, {decodeEntities: false});
    let result = {};
    let site;
    if (/.+gramota.+/.test(host)) {
        site = 'Грамота';
    } else {
        site = 'Викисловарь';
    }

    $('a').each(function () {
        let repl = $(this).html();
        $(this).replaceWith(repl);
    });

    if (site === 'Грамота') {
        $('h2').each(function () {
            if ($(this).text() !== 'Искомое слово отсутствует' &&
                $(this).next('div').text() !== 'искомое слово отсутствует' &&
                $(this).text() !== 'Орфографический словарь') {
                let definition = $(this).next('div').html();
                let listItem = /<b>[0-9]+\.<\/b>/;

                while (definition.search(listItem) + 1) { // есть список, оформим его
                    definition = formatList(definition, listItem);
                }
                result[$(this).text()] = definition;
            } else {
                return false;
            }
        });
    } else {
        $('b').each(function () {
            let repl = $(this).html();
            $(this).replaceWith(repl);
        });

        $('h4').each(function () {
            if ($(this).text() === 'Значение') {
                let h1 = $(this).prevAll('h1');
                if (h1.eq(0).text() === 'Русский') {
                    // убираем фразы об отсутствии примеров употребления
                    $(this).next().children('li').each(function (j, li) {
                        let children = $(li).children();
                        children.each(function (k, child) {
                            if ($(child).hasClass('example-absent-block')) {
                                $(child).replaceWith('');
                            }
                        });
                    });

                    //проверка на случай, когда есть список без толкования, с "Отсутствуют примеры"
                    if ($(this).next().text().search(/[а-я]+/i) + 1) {
                        result[$(this).prevAll('h2').eq(0).text()] =
                            $(this).next().wrap('<ol></ol>').parent().html();
                    }
                }
            }
        });
    }
    // избавляемся от пустых пунктов списка и выделения
    Object.keys(result).forEach(function(key) {
        result[key] = result[key].replace('<li class="mw-empty-li"></li>\n', '');
        result[key] = result[key].replace(/background-color:#CCFFFF;/g, '');
        result[key] = result[key].replace(/background-color:#EDF0FF;?/g, '');
        result[key] = result[key].replace(/, см\. Список литературы/g, '');
    });

    if (Object.keys(result).length) {
        result['site'] = site;
        return result;
    } else {
        return null;
    }
}

function formatList(definition, listItem) {
    let info = definition.slice(0, definition.search(listItem));

    if (definition.search(listItem) > definition.search('<br><br>')) {
        definition = definition.replace('<br><br>', '');
    }

    let listArray = definition.slice(definition.search(listItem),
        definition.search('<br><br>')).split(listItem);
    let remnant = definition.slice(definition.search('<br><br>'));
    remnant = remnant.replace('<br><br>', '');
    let list = '<ol>\n';

    listArray.forEach(function (item) {
        if (item.length) {
            list += '<li>\n' + item + '\n</li>\n';
        }
    });

    list += '</ol>\n';
    return info + list + remnant;
}