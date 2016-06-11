const needle = require('needle'),
    cheerio = require("cheerio"),
    GRAMOTA = 'http://www.gramota.ru/slovari/dic/?bts=x&az=x&word=',
    WIKTIONARY = 'http://ru.wiktionary.org/w/index.php?action=render&title=';

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        if (request.text) {

            const urlArray = [
                GRAMOTA + encodeURIComponent(request.text),
                WIKTIONARY + encodeURIComponent(request.text)
            ];
            let result = [];
            let errCounter = 0;

            function cb(err, response) {
                if (!err) {
                    result.push(grabTheInfo(response.body, response.url));

                    if (result.length === urlArray.length) {
                        resp(result, sendResponse);
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
        return true;
    }
);

function resp(arrayOfResults, sendResponse) {
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
        $('h2').each(function (i, elem) {
            if ($(this).text() !== 'Искомое слово отсутствует' &&
                $(this).next('div').text() !== 'искомое слово отсутствует') {
                result[$(this).text()] = $(this).next('div').html();
            } else {
                return false;
            }
        });
    } else {
        $('h4').each(function (i, elem) {
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

                    result[$(this).prevAll('h2').eq(0).text()] =
                        $(this).next().wrap('<ol></ol>').parent().html();
                }
            }
        });
        // избавляемся от пустых пунктов списка
        Object.keys(result).forEach(function (key) {
            result[key] = result[key].replace('<li class="mw-empty-li"></li>\n', '');
        });
    }

    if (Object.keys(result).length) {
        result['site'] = site;
        return result;
    } else {
        return null;
    }
}