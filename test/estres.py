import os
import json, random, secrets, urllib.request, concurrent.futures as cf, collections
U='http://127.0.0.1:8080/api.php'
def call(d):
    d={'clave':'151126', **d}
    req=urllib.request.Request(U, data=json.dumps(d).encode(), headers={'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req) as r: return json.loads(r.read())
    except urllib.error.HTTPError as e: return json.loads(e.read())
nombres=[p['nombre'] for p in call({'accion':'estado'})['participantes']]
stats=collections.Counter(); problemas=[]
for run in range(60):
    call({'accion':'reiniciar','clave':os.environ['CLAVE_ADMIN']})
    tok={n:secrets.token_hex(16) for n in nombres}
    for n in nombres: assert call({'accion':'reclamar','nombre':n,'token':tok[n]})['ok']
    orden=nombres[:]; random.shuffle(orden)
    if True:
        with cf.ThreadPoolExecutor(14) as ex: res=list(ex.map(lambda n: (n, call({'accion':'sortear','nombre':n,'token':tok[n]})), orden))
    else:
        res=[(n, call({'accion':'sortear','nombre':n,'token':tok[n]})) for n in orden]
    asign={n:r.get('asignado') for n,r in res}
    errs=[r for n,r in res if not r.get('ok')]
    if errs or None in asign.values() or len(set(asign.values()))!=14 or any(a==n for n,a in asign.items()):
        problemas.append((run, errs, asign))
    for n,a in asign.items(): stats[(n,a)]+=1
print('rondas con problema:', len(problemas), problemas[:2])
# repetir sorteo devuelve lo mismo
print('re-sortear idempotente:', call({'accion':'sortear','nombre':nombres[0],'token':tok[nombres[0]]})['asignado']==asign[nombres[0]])
print('token ajeno reclama:', call({'accion':'reclamar','nombre':nombres[0],'token':secrets.token_hex(16)}).get('error'))
print('token ajeno sortea:', call({'accion':'sortear','nombre':nombres[0],'token':secrets.token_hex(16)}).get('error'))
print('jugador intenta admin:', call({'accion':'admin','clave':'151126'}).get('error'))
# aleatoriedad: cada persona deberia caerle a cada otra ~300/13 = 23 veces
vals=[stats[(a,b)] for a in nombres for b in nombres if a!=b]
print('distribución pares (min/prom/max):', min(vals), round(sum(vals)/len(vals),1), max(vals))
# Anular a mitad de camino y completar
call({'accion':'reiniciar','clave':os.environ['CLAVE_ADMIN']}); tok={n:secrets.token_hex(16) for n in nombres}
for n in nombres: call({'accion':'reclamar','nombre':n,'token':tok[n]})
for n in nombres[:12]: call({'accion':'sortear','nombre':n,'token':tok[n]})
call({'accion':'anular','clave':os.environ['CLAVE_ADMIN'],'nombre':nombres[3]})
for n in [nombres[3]]+nombres[12:]: r=call({'accion':'sortear','nombre':n,'token':tok[n]}); assert r['ok'], r
adm=call({'accion':'admin','clave':os.environ['CLAVE_ADMIN']})['participantes']; a={f['nombre']:f['asignado'] for f in adm}
print('anular+completar válido:', len(set(a.values()))==14 and all(k!=v for k,v in a.items()) and None not in a.values())
print('sin clave:', call({'accion':'estado','clave':''}).get('error'))
print('clave mala:', call({'accion':'entrar','clave':'123456'}).get('error'))
print('entrar jugador/admin:', call({'accion':'entrar','clave':'151126'}).get('rol'), call({'accion':'entrar','clave':os.environ['CLAVE_ADMIN']}).get('rol'))
