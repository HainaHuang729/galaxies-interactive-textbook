import json
from pathlib import Path
import mpmath as mp
mp.mp.dps=50
rows=[]
for alpha in ['-1.6','-1.1','-.6']:
 a=mp.mpf(alpha)+1
 total=mp.gammainc(a,mp.mpf('1e-4'),mp.power(10,mp.mpf('1.5')))
 for mass in ['10','10.371','12','14.9','15']:
  m=mp.mpf(mass)
  rank=(mp.power(10,-mp.mpf('.9')*(m-10))-mp.power(10,mp.mpf('-4.5')))/(1-mp.power(10,mp.mpf('-4.5')))
  lo,hi=mp.mpf(6),mp.mpf('11.5')
  for _ in range(100):
   mid=(lo+hi)/2
   cdf=mp.gammainc(a,mp.power(10,mid-10),mp.power(10,mp.mpf('1.5')))/total
   if cdf>rank:lo=mid
   else:hi=mid
  rows.append(dict(alpha=float(alpha),mass=float(mass),rank=str(rank),logL=str((lo+hi)/2)))
sfr=[]
for z in [0,2,6]:
 for cut in ['8','9.9','12']:
  for eff in [0,10]:
   A=1/(mp.mpf('1e14')*mp.exp(-z))+1/mp.power(10,mp.mpf('12.5'))
   epoch=(1+z)**2*mp.exp(-mp.mpf(z)/3)
   integral=mp.mpf('.003')*eff*epoch/(mp.log(10)*mp.power(10,mp.mpf('1.2')))*A**(-mp.mpf('.1'))*mp.gammainc(mp.mpf('.1'),A*mp.power(10,mp.mpf(cut)),A*mp.mpf('1e15'))
   sfr.append(dict(z=z,cut=float(cut),eff=eff,total=str(integral)))
Path(__file__).with_name('whole-book-v36.json').write_text(json.dumps({'method':'50-digit incomplete gamma integrals and independent bisection; no model import','rows':rows,'sfr':sfr},indent=2)+'\n')
