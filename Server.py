from bottle import default_app, route, request, response
import pymorphy2 as pymorphy

@route('/', method='GET')
def normalize():
    try:
        morph = pymorphy.MorphAnalyzer()
        parsed = morph.parse(request.query.word)
        parse_result = parsed[0]

        if (str(parse_result.tag).find('Surn') + 1 or str(parse_result.tag).find('Name') + 1) and len(parsed) > 1:
            parse_result = parsed[1]

        tag = str(parse_result.tag)
        normal_form = str(parse_result.normal_form)

        if tag.find('LATN') + 1 or tag.find('NUMB') + 1 or tag.find('UNKN') + 1:
            response.status = 418

        return normal_form

    except Exception as exc:
        response.status = 418
        return exc.args

application = default_app()