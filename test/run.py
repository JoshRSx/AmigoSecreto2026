import json, subprocess, sys, math
from playwright.sync_api import sync_playwright
content = json.loads(subprocess.check_output(['node','-e','console.log(JSON.stringify(require("/home/claude/amigosecreto2026/src/content.js")))']))
URL='http://127.0.0.1:8765/'
errs=[]
def solve(page, n, zona='#zona'):
    t=n['tipo']
    if t=='texto':
        page.fill(f'{zona} input', n['r'][0]); page.click(f'{zona} form button')
    elif t=='opciones':
        page.click(f'{zona} .opcion[data-i="{n["correcta"]}"]')
    elif t=='candado':
        for i,d in enumerate(n['r'][0]):
            for _ in range(int(d)): page.click(f'{zona} .dial button[data-i="{i}"][data-d="1"]')
        page.click(f'{zona} #abrir')
    elif t=='memoria':
        page.wait_for_timeout(n['vista']*1000+400)
        for e in n['pares']:
            cs=page.query_selector_all(f'{zona} .carta[data-c="{e}"]'); cs[0].click(); cs[1].click(); page.wait_for_timeout(100)
    elif t=='sopa':
        for w in n['palabras']:
            pos=page.evaluate('''([w,N,s])=>{const g=generarSopa(%s,N,s);const D=[[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
              for(let r=0;r<N;r++)for(let c=0;c<N;c++)for(const[dr,dc]of D){let t='';for(let k=0;k<w.length;k++){const rr=r+dr*k,cc=c+dc*k;if(rr<0||cc<0||rr>=N||cc>=N)break;t+=g[rr][cc];}if(t===w)return[r,c,r+dr*(w.length-1),c+dc*(w.length-1)];}return null}''' % json.dumps(n['palabras']), [w,n['tam'],n['semilla']])
            assert pos, w
            page.click(f'{zona} .celda[data-r="{pos[0]}"][data-c="{pos[1]}"]'); page.click(f'{zona} .celda[data-r="{pos[2]}"][data-c="{pos[3]}"]')
    elif t=='diferencias':
        box=page.query_selector('#mod svg').bounding_box()
        difs=page.evaluate('DIFS')
        for k in n['difs']:
            x,y=difs[k]; page.mouse.click(box['x']+x/300*box['width'], box['y']+y/220*box['height']); page.wait_for_timeout(80)
    elif t=='ruleta':
        page.click(f'{zona} #girar'); page.wait_for_timeout(4500)
        cat=page.inner_text('.cat')
        cats=['Adivinanza','Cultura general','Matemática','Descifra la palabra','Encuentra el elemento','Lógica']
        i=[j for j,c in enumerate(cats) if c in cat][0]
        solve(page, n['retos'][i], '#subzona')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page=ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(URL); page.wait_for_timeout(600); page.screenshot(path='test/00_espera.png', full_page=True)
    print('libre: inicio con nombres:', page.is_visible('text=¿Quién eres?'), '| estado', page.evaluate('ESTADO'))
    page.goto(URL+'#demo'); page.wait_for_timeout(600); page.screenshot(path='test/01_inicio.png', full_page=True)
    names=[x['nombre'] for x in content['participantes']]
    for idx,P in enumerate(content['participantes']):
        page.evaluate(f'localStorage.clear(); localStorage.setItem("as_yo", JSON.stringify("{P["nombre"]}"))'); page.reload(); page.wait_for_timeout(300)
        for i,n in enumerate(P['niveles']):
            page.click(f'[data-ronda="{i}"]'); page.wait_for_timeout(200)
            if idx in (0,4,6,9,12,13) and i==0: page.screenshot(path=f'test/reto_{P["nombre"]}.png', full_page=True)
            solve(page,n); page.wait_for_timeout(1700)
            ok=page.is_visible('#regalo')
            print(P['nombre'], i+1, n['tipo'], 'OK' if ok else 'FALLO')
            if not ok: page.screenshot(path=f'test/fallo_{P["nombre"]}_{i}.png', full_page=True); break
            page.click('#regalo'); page.wait_for_timeout(700)
            if idx==0 and i==0: page.screenshot(path='test/02_regalo.png')
            page.click('#seguir'); page.wait_for_timeout(200)
        if idx==0: page.screenshot(path='test/03_hub.png', full_page=True)
        page.click('#adivinar'); page.wait_for_timeout(200)
        wrong=[n for n in names if n not in (P['nombre'], names[(idx+5)%14])][0]
        page.click(f'.nombre[data-n="{wrong}"]'); page.click('#confirmar'); page.click('#modal [data-i="1"]'); page.wait_for_timeout(200); page.click('#modal [data-i="0"]'); page.wait_for_timeout(200)
        page.click(f'.nombre[data-n="{names[(idx+5)%14]}"]'); page.click('#confirmar'); page.click('#modal [data-i="1"]'); page.wait_for_timeout(500)
        fin=page.inner_text('.final-nombre') if page.is_visible('.final-nombre') else None
        print('  final:', fin)
        if idx==0: page.screenshot(path='test/04_final.png')
    # escribir pistas + organizador
    codes=[]
    for i,n in enumerate(names):
        page.goto(URL+'#pistas'); page.wait_for_timeout(200)
        page.select_option('#de', n); page.select_option('#para', names[(i+1)%14])
        for k in (1,2,3): page.fill(f'#p{k}', f'Pista {k} de {n} ñandú')
        page.click('#generar'); codes.append(page.input_value('#cod'))
    page.screenshot(path='test/05_pistas.png', full_page=True)
    page.goto(URL+'#organizador'); page.wait_for_timeout(200)
    page.fill('#codigos', '\n'.join(codes)); page.wait_for_timeout(200)
    page.click('#gen'); cfg=page.input_value('#paq'); page.screenshot(path='test/06_org.png', full_page=True)
    open('test/srv/config.js','w').write(cfg)
    page.evaluate('localStorage.clear(); localStorage.setItem("as_yo", JSON.stringify("Dante"))'); page.goto(URL+'#juego'); page.reload(); page.wait_for_timeout(400)
    print('real: estado', page.evaluate('ESTADO'), '| demo banner', page.is_visible('text=MODO DEMO'), '| hub', page.is_visible('text=Hola, Dante'))
    print('PARES Dante:', page.evaluate('PARES["Dante"]'))
    page.goto(URL+'#demo'); page.wait_for_timeout(300); print('demo bloqueado con paquete real:', page.evaluate('ESTADO'))
    open('test/srv/config.js','w').write(cfg.replace('horaInicio: ""','horaInicio: "2030-01-01T00:00:00Z"'))
    page.goto(URL+'#juego'); page.reload(); page.wait_for_timeout(1500); print('cuenta regresiva:', page.inner_text('#reloj')); page.screenshot(path='test/07_cuenta.png')
    print('errores:', errs)
    b.close()
