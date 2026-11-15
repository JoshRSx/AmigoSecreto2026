import json, subprocess, re
from playwright.sync_api import sync_playwright
src=open('test/run.py').read(); exec(src[src.index('def solve'):src.index('with sync_playwright')])
content=json.loads(subprocess.check_output(['node','-e','console.log(JSON.stringify(require("./src/content.js")))']))
U='http://127.0.0.1:8080/'; errs=[]; asign={}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True).new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(U+'#demo'); pg.wait_for_selector('#fclave'); pg.fill('#fclave input','151126'); pg.click('#fclave button'); pg.wait_for_selector('.nombre'); print('banner demo:', pg.is_visible('text=MODO DEMO'))
    for P in content['participantes']:
        n=P['nombre']
        pg.evaluate('localStorage.removeItem("as_yo"); localStorage.removeItem("as_token")'); pg.goto(U+'#juego'); pg.reload(); pg.wait_for_selector('.nombre')
        pg.click(f'.nombre[data-n="{n}"]'); pg.click('#modal [data-i="1"]'); pg.wait_for_selector('[data-ronda="0"]')
        for i,lv in enumerate(P['niveles'][:2]):
            pg.click(f'[data-ronda="{i}"]'); pg.wait_for_timeout(150); solve(pg, lv); pg.wait_for_selector('#regalo', timeout=8000)
            pg.click('#regalo'); pg.wait_for_timeout(500); pg.click('#seguir'); pg.wait_for_timeout(250)
        pg.click('#listo'); pg.wait_for_selector('.huecos', timeout=15000); solve(pg, P['niveles'][2])
        pg.wait_for_selector('#nombreRes', timeout=15000); asign[n]=pg.inner_text('#nombreRes')
    print('42 desafíos + 14 sorteos completos:', len(asign)==14)
    print('sin repetir / sin sí mismo:', len(set(asign.values()))==14, all(k!=v for k,v in asign.items()))
    print('errores JS:', errs); b.close()
