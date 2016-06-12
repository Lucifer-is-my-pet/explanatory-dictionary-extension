from bottle import default_app, route, request, response
import pymorphy2 as pymorphy

@route('/', method='GET')
def normalize():
    try:
        morph = pymorphy.MorphAnalyzer()
        parsed = morph.parse(request.query.word)
        parse_result = str(parsed[0]).replace('Parse(', '')

        if (parse_result.find('Surn') + 1 or parse_result.find('Name') + 1) and len(parsed) > 1:
            parse_result = str(parsed[1]).replace('Parse(', '')

        result_list = parse_result.split(', ')
        normal_form = str()
        tag = str()

        for param in result_list:
            if param.find('tag') + 1:
                tag = param.split('\'')[1]
            elif param.find('normal') + 1:
                normal_form = param.split('\'')[1]

        if tag.find('LATN') + 1 or tag.find('NUMB') + 1 or tag.find('UNKN') + 1:
            response.status = 418

        return normal_form

    except Exception as exc:
        response.status = 418
        return exc.args

application = default_app()