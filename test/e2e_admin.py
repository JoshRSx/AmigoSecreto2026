import os
import json, subprocess, urllib.request
from playwright.sync_api import sync_playwright
src=open('test/run.py').read(); exec(src[src.index('def solve'):src.index('with sync_playwright')])
content=json.loads(subprocess.check_output(['node','-e','console.log(JSON.stringify(require("./src/content.js")))']))
P={x['nombre']:x for x in content['participantes']}
U='http://127.0.0.1:8080/'; errs=[]
urllib.request.urlopen(urllib.request.Request(U+'api.php', data=json.dumps({'accion':'reiniciar','clave':os.environ['CLAVE_ADMIN']}).encode(), headers={'Content-Type':'application/json'}))
def ctx(b):
    pg=b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True).new_page(); pg.on('pageerror', lambda e: errs.append(str(e))); return pg
def clave(pg, c):
    pg.goto(U); pg.wait_for_selector('#fclave'); pg.fill('#fclave input', c); pg.click('#fclave button'); pg.wait_for_timeout(700)
def elegir(pg, n):
    pg.wait_for_selector('.nombre'); pg.click(f'.nombre[data-n="{n}"]'); pg.click('#modal [data-i="1"]'); pg.wait_for_selector('[data-ronda="0"]')
def jugar(pg, n, hasta):
    for i in range(hasta):
        pg.click(f'[data-ronda="{i}"]'); pg.wait_for_timeout(200); solve(pg, P[n]['niveles'][i]); pg.wait_for_selector('#regalo', timeout=8000)
        pg.click('#regalo'); pg.wait_for_timeout(500); pg.click('#seguir'); pg.wait_for_timeout(300)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    d=ctx(b); d.goto(U); d.wait_for_selector('#fclave'); d.screenshot(path='test/40_clave.png')
    d.fill('#fclave input','999999'); d.click('#fclave button'); d.wait_for_timeout(900); print('clave mala sigue en pantalla de clave:', d.is_visible('#fclave'))
    d.fill('#fclave input','151126'); d.click('#fclave button'); d.wait_for_timeout(700); print('151126 -> elegir nombre:', d.is_visible('text=¿Quién eres?'))
    d.reload(); d.wait_for_timeout(800); print('recargar no vuelve a pedir clave:', not d.is_visible('#fclave'))
    elegir(d,'Dante'); jugar(d,'Dante',1); d.click('[data-ronda="1"]'); d.wait_for_timeout(300); d.click('#ayudaBtn'); d.wait_for_timeout(400)
    n=ctx(b); clave(n,'151126'); elegir(n,'Noemí')
    g=ctx(b); clave(g,'151126'); elegir(g,'Gabriel'); jugar(g,'Gabriel',2); g.click('#listo'); g.wait_for_selector('.huecos', timeout=15000)
    g.screenshot(path='test/50_cifrado.png'); g.click('#ayudaBtn'); g.click('#ayudaBtn'); g.wait_for_timeout(300); print('ayuda revela letras:', g.inner_text('#huecos').replace('\n',' ')); g.screenshot(path='test/51_cifrado_ayuda.png')
    # mientras descifra, el panel lo muestra como 'Descifrando'
    a0=ctx(b); clave(a0,os.environ['CLAVE_ADMIN']); a0.wait_for_selector('.kpis'); print('panel mientras descifra:', a0.inner_text('.card.jug:has([data-menu="Gabriel"]) .estado-tag'))
    solve(g, P['Gabriel']['niveles'][2]); g.wait_for_selector('#nombreRes', timeout=15000); amigo=g.inner_text('#nombreRes'); g.screenshot(path='test/52_resultado.png', full_page=True)
    a=ctx(b); clave(a,os.environ['CLAVE_ADMIN']); a.wait_for_selector('.kpis'); a.wait_for_timeout(300)
    txt=a.inner_text('#app')
    def card(nombre): return a.inner_text(f'.card.jug:has([data-menu="{nombre}"])')
    print('clave admin -> panel admin:', 'Panel de moderación' in txt)
    print('KPIs:', a.inner_text('.kpis').replace('\n',' '))
    print('Dante:', card('Dante').replace('\n',' | ')[:150])
    print('Noemí:', card('Noemí').replace('\n',' | ')[:110])
    print('Gabriel oculto:', '••••••' in card('Gabriel'))
    a.screenshot(path='test/41_admin.png', full_page=True)
    a.click('#toggle'); a.wait_for_timeout(500); print('Gabriel visible ->', amigo, amigo in card('Gabriel'))
    a.click('[data-menu="Noemí"]'); a.click('#modal [data-i="1"]'); a.wait_for_timeout(700); print('Noemí tras liberar:', card('Noemí').split('\n')[1])
    a.click('[data-menu="Gabriel"]'); a.click('#modal [data-i="3"]'); a.click('#modal [data-i="1"]'); a.wait_for_timeout(700); print('Gabriel tras reiniciar:', card('Gabriel').split('\n')[1])
    a.click('[data-filtro="jugando"]'); a.wait_for_timeout(500); print('filtro jugando muestra:', [x.get_attribute('data-menu') for x in a.query_selector_all('[data-menu]')])
    print('clave admin en el HTML servido:', os.environ['CLAVE_ADMIN'] in a.content())
    print('errores JS:', errs); b.close()
