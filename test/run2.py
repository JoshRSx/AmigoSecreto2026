# Escenarios sin pistas / pistas parciales / pistas en blanco
import json, subprocess
from playwright.sync_api import sync_playwright
import importlib.util
spec=importlib.util.spec_from_file_location('r','test/run.py')
src=open('test/run.py').read(); solve_src=src[src.index('def solve'):src.index('with sync_playwright')]
content = json.loads(subprocess.check_output(['node','-e','console.log(JSON.stringify(require("/home/claude/amigosecreto2026/src/content.js")))']))
exec(solve_src)
URL='http://127.0.0.1:8765/'; errs=[]
P={x['nombre']:x for x in content['participantes']}
names=list(P)
def jugar(page, nombre):
    page.evaluate(f'localStorage.setItem("as_yo", JSON.stringify("{nombre}"))'); page.goto(URL+'#juego'); page.reload(); page.wait_for_timeout(300)
    for i,n in enumerate(P[nombre]['niveles']):
        page.click(f'[data-ronda="{i}"]'); page.wait_for_timeout(200); solve(page,n); page.wait_for_timeout(1700)
        page.click('#regalo'); page.wait_for_timeout(600)
        txt=page.inner_text('#pista'); page.click('#seguir'); page.wait_for_timeout(200)
        print(f'   {nombre} r{i+1}: {txt}')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    page=b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True).new_page()
    page.on('pageerror', lambda e: errs.append(str(e)))
    open('test/srv/config.js','w').write(open('public/config.js').read())
    print('1) SIN PISTAS'); page.goto(URL); page.evaluate('localStorage.clear()')
    jugar(page,'Patricia'); page.screenshot(path='test/10_hub_libre.png', full_page=True)
    page.click('#verlibre'); page.wait_for_timeout(500); print('   final libre:', page.is_visible('text=¿Quién crees que es?')); page.screenshot(path='test/11_final_libre.png')
    print('2) PISTAS PARCIALES (10 de 14, algunas en blanco)')
    codes=[]
    for i,n in enumerate(names[:10]):
        page.goto(URL+'#pistas'); page.reload(); page.wait_for_timeout(150)
        page.select_option('#de', n); page.select_option('#para', names[(i+1)%14])
        if i%2==0:
            for k in (1,2,3): page.fill(f'#p{k}', f'Pista {k} escrita por {n}')
        page.click('#generar'); codes.append(page.input_value('#cod'))
    page.goto(URL+'#organizador'); page.wait_for_timeout(200); page.fill('#codigos','\n'.join(codes)); page.wait_for_timeout(200)
    print('  ', page.inner_text('#estado').splitlines()[-1]); page.click('#gen'); open('test/srv/config.js','w').write(page.input_value('#paq'))
    page.evaluate('localStorage.clear()')
    jugar(page,'Estephany')   # regalador Joshua escribió pistas
    jugar(page,'Dante')       # regalador Estephany dejó en blanco -> automáticas
    page.click('#adivinar'); page.click('.nombre[data-n="Estephany"]'); page.click('#confirmar'); page.click('#modal [data-i="1"]'); page.wait_for_timeout(400)
    print('   Dante adivina:', page.inner_text('.final-nombre'))
    jugar(page,'Juliett')     # nadie le escribió (fuera de los 10) -> libre
    print('   Juliett botón libre:', page.is_visible('#verlibre'))
    print('3) ORGANIZADOR SIN CÓDIGOS'); page.goto(URL+'#organizador'); page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_timeout(200)
    page.click('#gen'); print('   ', page.input_value('#paq').splitlines()[1:4])
    print('errores:', errs); b.close()
