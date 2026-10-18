#!/usr/bin/env python3
"""Independent v33 benchmarks: Python stdlib only, no repository model imports."""
from decimal import Decimal, localcontext, getcontext
from pathlib import Path
import json, math, sys
getcontext().prec = 90
D = Decimal
PI = D('3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117')
if len(sys.argv) != 2:
    raise SystemExit('Usage: python3 build-shell-conduction-reference.py OUTPUT_JSON')
OUT = Path(sys.argv[1]).resolve()
OUT.parent.mkdir(parents=True, exist_ok=True)
G = D('4.30091e-6')
PC = D('3.0856775814913673e18')
MYR = D('31557600e6')
KB = D('1.380649e-16')
MP = D('1.67262192369e-24')
MU = D('.6')
GAMMA = D(5)/D(3)
T0 = D('1e6')
L0 = D(100)
TTH = D(100)
EPS = D('.001')
CP = D('2.5') * KB
CS = (GAMMA*KB*T0/(MU*MP)).sqrt() # cm/s


def shell(q, x):
    q, x = D(str(q)), D(str(x))
    den = (1-q)*(1+q+q*q)
    if x <= q:
        f = D(0)
    elif x < 1:
        f = (x-q)*(x*x+x*q+q*q)/den
    else:
        f = D(1)
    g = -f/(x*x) if x else D(0)
    if not x:
        phi = -D('1.5')*(1+q)/(1+q+q*q)
    elif x <= 1:
        s = max(x,q)
        phi = -f/x-D('1.5')*(1-s)*(1+s)/den
    else:
        phi = -1/x
    rho = 3/(4*PI*den) if q < x < 1 or q == x == 0 else D(0)
    # At x=q or 1, discontinuous density is a one-sided quantity; use null in export.
    if (x == q and q != 0) or x == 1:
        rho = None
    return dict(enclosedFraction=f, gNorm=g, phiNorm=phi,
                vcNorm=(-x*g).sqrt(), vescNorm=(-2*phi).sqrt(),
                densityNorm=rho)


def simp(f,a,b,tol=1e-12,maxdepth=25):
    if a == b:
        return 0.0
    def s(fa,fm,fb,a,b): return (b-a)*(fa+4*fm+fb)/6
    fa,fm,fb = f(a),f((a+b)/2),f(b)
    initial=s(fa,fm,fb,a,b)
    def rec(a,b,fa,fm,fb,whole,tol,depth):
        m=(a+b)/2; l=(a+m)/2; r=(m+b)/2
        fl,fr=f(l),f(r)
        sl,sr=s(fa,fl,fm,a,m),s(fm,fr,fb,m,b)
        err=sl+sr-whole
        if depth <= 0 or abs(err) <= 15*tol:
            return sl+sr+err/15
        return rec(a,m,fa,fl,fm,sl,tol/2,depth-1)+rec(m,b,fm,fr,fb,sr,tol/2,depth-1)
    return rec(a,b,fa,fm,fb,initial,tol,maxdepth)


def radial_potential(q,x):
    # Mass-weighted angularly averaged thin-shell potential, numerically integrate s.
    # Potential of unit thin shell is -1/max(x,s); no closed thick-shell formula used.
    den=1-q**3
    def f(s):
        z=max(x,s)
        return -3*s*s/(den*z) if z else 0.0
    if q < x < 1:
        return simp(f,q,x)+simp(f,x,1)
    return simp(f,q,1)


def radial_mass(q,x):
    # Independent volume integral for M(<r)/M.
    if x <= q:
        return 0.0
    return simp(lambda s:3*s*s/(1-q**3),q,min(x,1))


def angular_force(x,s=1.0):
    # Direct Newtonian angular integral. mu=1-2t^2 removes the surface cusp.
    if x == s:
        # Integrand after cancellation is constant, not the force result itself.
        fun=lambda t:-1/(2*s*s)
    else:
        def fun(t):
            den=(x-s)**2+4*x*s*t*t
            return -2*t*(x-s+2*s*t*t)/(den**1.5)
    ts = abs(x-s)/(2*math.sqrt(x*s)) if x*s else 1.0
    points=sorted(set([0.0,1.0]+[min(1.0,ts*k) for k in [.125,.5,1,2,8,32]]))
    return sum(simp(fun,a,b,3e-13/(len(points)-1),28) for a,b in zip(points,points[1:]))


def angular_potential(x,s=1.0):
    def fun(t):
        den=(x-s)**2+4*x*s*t*t
        if not den:
            return -1/s # x=s, t=0, removable after transformation
        return -2*t/math.sqrt(den)
    ts = abs(x-s)/(2*math.sqrt(x*s)) if x*s else 1.0
    points=sorted(set([0.0,1.0]+[min(1.0,ts*k) for k in [.125,.5,1,2,8,32]]))
    return sum(simp(fun,a,b,3e-13/(len(points)-1),28) for a,b in zip(points,points[1:]))


def jsonable(x):
    if isinstance(x,D): return float(x)
    if isinstance(x,dict): return {k:jsonable(v) for k,v in x.items()}
    if isinstance(x,(list,tuple)): return [jsonable(v) for v in x]
    return x

shellcases=[]
for q,xs in [
    ('0',['0','.000001','.25','.5','.99999999','1','1.00000001','2','3']),
    ('.5',['0','.25','.49999999','.5','.50000001','.75','.99999999','1','1.00000001','3']),
    ('.9',['0','.45','.89999999','.9','.90000001','.95','.99999999','1','1.00000001','2','3'])
]:
    for x in xs:
        a=shell(q,x)
        pnum=radial_potential(float(q),float(x)); fnum=radial_mass(float(q),float(x))
        shellcases.append(dict(q=D(q),x=D(x),**a,numericalRadialPotential=pnum,
                               numericalRadialEnclosedFraction=fnum,
                               radialPotentialAbsoluteError=abs(pnum-float(a['phiNorm'])),
                               radialMassAbsoluteError=abs(fnum-float(a['enclosedFraction']))))

angularcases=[]
for x in [0,.25,.5,.9,.999,1,1.001,1.1,2,3]:
    ff=angular_force(x); pp=angular_potential(x)
    fexpect=0.0 if x<1 else (-.5 if x==1 else -1/x**2)
    pexpect=-1/max(x,1)
    angularcases.append(dict(thinShellRadius=1,observationRadius=x,
                             numericalNewtonAngularForce=ff,expectedForce=fexpect,
                             absoluteForceError=abs(ff-fexpect),
                             numericalNewtonAngularPotential=pp,expectedPotential=pexpect,
                             absolutePotentialError=abs(pp-pexpect)))

# Force/potential relation and Poisson, high precision central differences away from interfaces.
derivatives=[]
h=D('1e-16')
for q,x in [('0','.1'),('0','.5'),('0','1.5'),('.5','.25'),('.5','.75'),('.5','1.5'),('.9','.45'),('.9','.95'),('.9','2')]:
    q,x=D(q),D(x); cur=shell(q,x)
    pm=shell(q,x-h)['phiNorm']; p0=cur['phiNorm']; pp=shell(q,x+h)['phiNorm']
    dp=(pp-pm)/(2*h); dd=(pp-2*p0+pm)/(h*h)
    lap=dd+2*dp/x
    expected=3/(1-q**3) if q<x<1 else D(0)
    derivatives.append(dict(q=q,x=x,h=h,numericMinusDPhiDx=-dp,expectedG=cur['gNorm'],
                            forceAbsoluteError=abs(-dp-cur['gNorm']),
                            numericLaplacianPhi=lap,expected4PiDensity=expected,
                            poissonAbsoluteError=abs(lap-expected)))
for q in [D(0),D('.9')]:
    p0=shell(q,0)['phiNorm']; ph=shell(q,h)['phiNorm']
    lap=6*(ph-p0)/(h*h)
    expected=D(3) if not q else D(0)
    derivatives.append(dict(q=q,x=0,h=h,centerLaplacianPhi=lap,expected4PiDensity=expected,
                            poissonAbsoluteError=abs(lap-expected)))

# Interface continuity and integrated Poisson jump, including finite density steps.
interfaces=[]
e=D('1e-9')
for q in [D(0),D('.5'),D('.9')]:
    for x in ([q,D(1)] if q else [D(1)]):
        m=shell(q,x-e); c=shell(q,x); p=shell(q,x+e)
        # Integrated normalized Poisson: -[x^2 g]_(x-e)^(x+e)=M_right-M_left.
        flux=-(x+e)**2*p['gNorm']+(x-e)**2*m['gNorm']
        dm=p['enclosedFraction']-m['enclosedFraction']
        interfaces.append(dict(q=q,x=x,epsilon=e,
                               phiLeft=m['phiNorm'],phiAt=c['phiNorm'],phiRight=p['phiNorm'],
                               gLeft=m['gNorm'],gAt=c['gNorm'],gRight=p['gNorm'],
                               integratedPoissonFlux=flux,enclosedMassJump=dm,
                               integratedPoissonAbsoluteError=abs(flux-dm)))

physical=[]
for logm,b,q,x in [(9,50,'.9','0'),(9,50,'.9','1'),(12,5,'0','0'),(12,5,'0','1'),(12,5,'.9','.95'),(11,20,'.5','.25'),(11,20,'.5','3')]:
    m=D(10)**logm; b=D(b); a=shell(q,x); scale=G*m/b
    physical.append(dict(logM=logm,bKpc=b,q=D(q),x=D(x),rKpc=D(x)*b,
                         enclosedMassMsun=m*a['enclosedFraction'],
                         phiKm2S2=scale*a['phiNorm'],
                         signedGKm2S2PerKpc=scale/b*a['gNorm'],
                         vcKmS=scale.sqrt()*a['vcNorm'],vescKmS=scale.sqrt()*a['vescNorm']))


def thermal(alpha,d,w,tau):
    alpha,d,w,tau=map(lambda v:D(str(v)),(alpha,d,w,tau))
    cooling=1-alpha; damping=4*PI*PI*d/(w*w); growth=cooling-damping
    a=EPS*(growth*tau).exp(); anocond=EPS*(cooling*tau).exp()
    lc=2*PI*L0*(d/cooling).sqrt() if cooling>0 else None
    snd=w*L0*PC/CS/MYR
    ratio=snd*abs(growth)/TTH
    # A neutral interface is classified separately below for an exact critical parameter.
    cls='growing' if growth>0 else ('decaying' if growth<0 else 'neutral')
    fields=[]
    for xi in [0,.125,.25,.375,.5,.75,1,1.25,1.5,1.75,2]:
        delta=a*D(str(math.cos(2*math.pi*xi)))
        fields.append(dict(xi=xi,deltaTemperature=delta,deltaDensity=-delta,
                           temperatureRatio=1+delta,densityRatio=1-delta,
                           pressureRatio=(1+delta)*(1-delta)))
    return dict(alpha=alpha,d=d,w=w,tau=tau,wavelengthPc=w*L0,timeMyr=tau*TTH,
                sigmaTth=growth,sigmaPerMyr=growth/TTH,
                coolingOnlySigmaTth=cooling,conductionDampingTth=damping,
                amplitude=a,noConductionAmplitude=anocond,
                conductionAmplitudeRatio=a/anocond,
                criticalWavelengthPc=lc,classification=cls,
                soundCrossMyr=snd,soundToEFoldRatio=ratio,
                eFoldMyr=TTH/abs(growth) if growth else None,
                maxPressureTruncationError=a*a,fields=fields)

thermalcases=[]
for vals in [(-1,0,.25,0),(-1,0,4,2),(-1,.05,.25,2),(-1,.05,4,2),
             (0,0,1,2),(0,.01,1,2),(0,.05,.25,2),(0,.05,4,2),
             (1,0,1,2),(1,.05,4,2),(1,.05,.25,2),
             (2,0,4,2),(2,.05,.25,2),(2,.05,4,2),
             ('.99999999',0,1,2),('1.00000001',0,1,2),
             (-1,'.05',1,1),(-1,'.05',1,2)]:
    thermalcases.append(thermal(*vals))

# Exact neutral mode input computed at 90 digits, with one-sided scale checks.
neutral=[]
for alpha,w in [(D(-1),D('.25')),(D(0),D(1)),(D('.9'),D(4))]:
    dn=(1-alpha)*w*w/(4*PI*PI)
    for factor in [D('.999999'),D(1),D('1.000001')]:
        r=thermal(alpha,dn*factor,w,2)
        r['criticalDiffusivityD']=dn; r['relativeToCriticalD']=factor
        if factor==1:
            # 90-digit residual may be ±1e-89: the mathematical reference is exactly neutral.
            r['classification']='neutral';r['sigmaTth']=D(0);r['sigmaPerMyr']=D(0)
            r['amplitude']=EPS;r['eFoldMyr']=None;r['soundToEFoldRatio']=D(0)
        neutral.append(r)

# Independent first-order isobaric source derivative at equilibrium.
source_deriv=[]
u=D('1e-16')
for alpha in [D(-1),D(0),D(1),D(2)]:
    def source(theta): return 1-((alpha-1)*theta.ln()).exp()
    slope=(source(1+u)-source(1-u))/(2*u)
    source_deriv.append(dict(alpha=alpha,finiteDifferenceHeatingMinusCoolingSlope=slope,
                             expectedLinearSlope=1-alpha,absoluteError=abs(slope-(1-alpha))))

# Independent time integration using RK4, not exponential evaluation.
def rk4_linear(rate,tf,n=20000):
    h=tf/n; a=.001
    for _ in range(n):
        k1=rate*a;k2=rate*(a+h*k1/2);k3=rate*(a+h*k2/2);k4=rate*(a+h*k3)
        a += h*(k1+2*k2+2*k3+k4)/6
    return a
rk=[]
for idx in [1,2,3,5,8,12,17]:
    c=thermalcases[idx]; a=rk4_linear(float(c['sigmaTth']),float(c['tau']))
    rk.append(dict(alpha=c['alpha'],d=c['d'],w=c['w'],tau=c['tau'],
                   rk4Amplitude=a,expectedAmplitude=c['amplitude'],
                   relativeError=abs(a/float(c['amplitude'])-1)))

# Bound proof uses corners in alpha,d and endpoints in w: w*|c-A/w^2|.
# On each sign interval, either monotonic or has a minimum; the maxima on w∈[.25,4] are endpoints.
cornerbounds=[]
for alpha in [-1,2]:
    for d in [0,.05]:
        for w in [.25,4]:
            c=thermal(alpha,d,w,2)
            cornerbounds.append({k:c[k] for k in ['alpha','d','w','sigmaTth','soundToEFoldRatio','amplitude']})
worstsound=max(cornerbounds,key=lambda c:c['soundToEFoldRatio'])
amax=EPS*D(4).exp()
amin=EPS*((-1-4*PI*PI*D('.05')/D('.25')**2)*2).exp()
chi_max=D('.05')*(L0*PC)**2/(TTH*MYR)

reference=dict(
    metadata=dict(version=33,method='Independent Python stdlib: Decimal 90-digit closed expressions; adaptive Simpson radial and direct Newton angular quadrature; high-precision derivatives; RK4 time integration. No repository model imported.',
                  precisionDigits=90,units=dict(shellPotential='GM/b',shellAcceleration='GM/b^2',shellSpeed='sqrt(GM/b)',shellDensity='M/b^3'),
                  constants=dict(GKpcKm2S2Msun=G,parsecCm=PC,myrSeconds=MYR,kBoltzmannErgPerK=KB,protonMassG=MP,mu=MU,gamma=GAMMA,
                                 temperature0K=T0,L0Pc=L0,tthMyr=TTH,epsilon0=EPS,cpParticleErgPerK=CP,cpMassErgPerGPerK=CP/(MU*MP),soundSpeedKmS=CS/D('1e5')),
                  modelBoundaries=['Newtonian static spherical density; no collapse/orbit/equilibrium simulation.',
                                   'Linear single isobaric Fourier mode around exact thermal equilibrium, fixed composition and constant coefficient chi.',
                                   'Heating is constant per particle, not per unit volume.',
                                   'Density and temperature satisfy pressure balance to first order only.',
                                   'Critical wavelength uses lambda=2pi/k; not an empirically calibrated Spitzer conductivity.']),
    shell=dict(cases=shellcases,angularThinShellQuadrature=angularcases,derivativePoissonChecks=derivatives,
               interfaceIntegralChecks=interfaces,physicalReadouts=physical,
               tolerances=dict(closedDoubleAbs=2e-12,radialQuadratureAbs=2e-12,angularQuadratureAbs=2e-10,
                               finiteDifferenceDecimalAbsolute=1e-28,physicalReadoutRelative=2e-12),
               validation=dict(maxRadialPotentialAbs=max(c['radialPotentialAbsoluteError'] for c in shellcases),
                               maxRadialMassAbs=max(c['radialMassAbsoluteError'] for c in shellcases),
                               maxAngularForceAbs=max(c['absoluteForceError'] for c in angularcases),
                               maxAngularPotentialAbs=max(c['absolutePotentialError'] for c in angularcases),
                               maxForceDerivativeAbs=max(c.get('forceAbsoluteError',D(0)) for c in derivatives),
                               maxPoissonAbs=max(c['poissonAbsoluteError'] for c in derivatives),
                               maxIntegratedPoissonAbs=max(c['integratedPoissonAbsoluteError'] for c in interfaces))),
    thermal=dict(cases=thermalcases,neutralBoundaryCases=neutral,sourceDerivativeChecks=source_deriv,rk4TimeChecks=rk,
                 parameterCornerBounds=cornerbounds,
                 bounds=dict(maxSoundToEFoldRatio=worstsound['soundToEFoldRatio'],soundWorstCase=worstsound,
                             maxAmplitude=amax,minAmplitude=amin,maxPressureTruncationError=amax*amax,
                             minTemperatureOrDensityRatio=1-amax,maxTemperatureOrDensityRatio=1+amax,
                             maxChiCm2PerS=chi_max,maxChiPc2PerMyr=D(5)),
                 tolerances=dict(closedDoubleRelative=3e-12,sigmaNearNeutralAbsolute=2e-12,rk4Relative=2e-10),
                 validation=dict(maxSourceDerivativeAbs=max(c['absoluteError'] for c in source_deriv),
                                 maxRk4Relative=max(c['relativeError'] for c in rk)))
)
assert reference['shell']['validation']['maxRadialPotentialAbs'] < 2e-12
assert reference['shell']['validation']['maxAngularForceAbs'] < 2e-10
assert reference['shell']['validation']['maxPoissonAbs'] < D('1e-28')
assert reference['thermal']['bounds']['maxSoundToEFoldRatio'] < D('.053')
assert amax < D('.055')
assert reference['thermal']['validation']['maxRk4Relative'] < 2e-10
OUT.write_text(json.dumps(jsonable(reference),ensure_ascii=False,indent=2)+'\n')
print(json.dumps(jsonable(dict(shellValidation=reference['shell']['validation'],thermalValidation=reference['thermal']['validation'],thermalBounds=reference['thermal']['bounds'],soundSpeedKmS=CS/D('1e5'),caseCounts=dict(shell=len(shellcases),angular=len(angularcases),derivatives=len(derivatives),interfaces=len(interfaces),thermal=len(thermalcases),neutral=len(neutral)))),indent=2))
