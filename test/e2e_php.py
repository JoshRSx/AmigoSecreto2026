import json, subprocess
from playwright.sync_api import sync_playwright
src=open('test/run.py').read(); exec(src[src.index('def solve'):src.index('with sync_playwright')])
content=json.loads(subprocess.check_output(['node','-e','console.log(JSON.stringify(require("./src/content.js")))']))
P={x['nombre']:x for x in content['participantes']}
U='http://127.0.0.1:8080/'; errs=[]
def nuevo(b):
    pg=b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True).new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); return pg
def entrar(pg, n):
    pg.goto(U); pg.wait_for_selector('.nombre'); pg.click(f'.nombre[data-n="{n}"]'); pg.click('#modal [data-i="1"]'); pg.wait_for_timeout(500)
def jugar_todo(pg, n):
    for i,lv in enumerate(P[n]['niveles']):
        pg.click(f'[data-ronda="{i}"]'); pg.wait_for_timeout(200); solve(pg, lv); pg.wait_for_timeout(1700)
        pg.click('#regalo'); pg.wait_for_timeout(600); pg.click('#seguir'); pg.wait_for_timeout(300)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    subprocess.run(['curl','-s','-XPOST',U+'api.php','-d','{"accion":"reiniciar","pin":"pin-test"}'],capture_output=True)
    a=nuevo(b); a.goto(U); a.wait_for_selector('.nombre'); a.screenshot(path='test/20_inicio.png', full_page=True)
    entrar(a,'Gabriel'); print('hub Gabriel:', a.is_visible('text=Hola, Gabriel'))
    jugar_todo(a,'Gabriel')   # tras el 3er desafío, el botón lleva directo al sorteo
    print('pantalla privacidad:', a.is_visible('text=nadie más')); a.screenshot(path='test/21_listo.png')
    a.click('#listo'); a.wait_for_timeout(1200); a.screenshot(path='test/22_slot.png')
    a.wait_for_selector('#nombreRes', timeout=15000); a.wait_for_timeout(500)
    res=a.inner_text('#nombreRes'); print('resultado Gabriel:', res, '| wa link:', a.get_attribute('a.btn.verde','href')[:60]); a.screenshot(path='test/23_resultado.png', full_page=True)
    # recarga: mismo resultado, oculto
    a.reload(); a.wait_for_selector('#sortear'); a.click('#sortear'); a.wait_for_timeout(300)
    print('tras recargar igual y oculto:', a.inner_text('#nombreRes')==res, 'oculto' in a.get_attribute('#nombreRes','class'))
    # otro celular intenta usar Gabriel
    c=nuevo(b); c.goto(U); c.wait_for_selector('.nombre'); print('candado visible en Gabriel:', '🔒' in c.inner_text('.nombre[data-n="Gabriel"]') or '✅' in c.inner_text('.nombre[data-n="Gabriel"]'))
    c.click('.nombre[data-n="Gabriel"]'); c.click('#modal [data-i="1"]'); c.wait_for_timeout(500); print('bloqueo otro celular:', c.inner_text('#modal .modal-caja p')); c.click('#modal [data-i="0"]')
    # panel
    c.goto(U+'#organizador'); c.wait_for_selector('#fpin'); c.fill('#fpin input','mal'); c.click('#fpin button'); c.wait_for_timeout(900)
    c.fill('#fpin input','pin-test'); c.click('#fpin button'); c.wait_for_selector('.tabla-admin')
    print('panel oculta parejas:', '••••••' in c.inner_text('.tabla-admin'))
    c.click('#toggle'); c.wait_for_timeout(400); print('panel muestra pareja:', res in c.inner_text('.tabla-admin')); c.screenshot(path='test/24_panel.png', full_page=True)
    c.click('[data-menu="Gabriel"]'); c.click('#modal [data-i="1"]'); c.wait_for_timeout(500)   # liberar celular
    a.goto(U+'#juego'); a.reload(); a.wait_for_timeout(1200); print('celular original tras liberar -> vuelve a inicio:', a.is_visible('text=¿Quién eres?') or a.is_visible('text=Nombre liberado'))
    print('errores JS:', errs); b.close()
