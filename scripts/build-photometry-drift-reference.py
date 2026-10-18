#!/usr/bin/env python3
"""v34 independent benchmarks; only Python stdlib, no repo module imports."""
from decimal import Decimal, getcontext
from pathlib import Path
import json, math, sys
getcontext().prec=85
D=Decimal
PI=D('3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117')
LN2=D(2).ln(); C=D('29979245800'); YEAR=D(31557600)
PC_CM=D('3.0856775814913673e18'); MPC_KM=PC_CM*10 # 1e6 pc and cm->km
OUT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).parent/'fixtures'

def jd(x):
    if isinstance(x,D): return float(x)
    if isinstance(x,dict): return {k:jd(v) for k,v in x.items()}
    if isinstance(x,(list,tuple)): return [jd(v) for v in x]
    return x

def simpson(f,a,b,n=2000):
    if a==b:return 0.0
    h=(b-a)/n
    return h*(f(a)+f(b)+sum((4 if j%2 else 2)*f(a+j*h) for j in range(1,n)))/3

def aperture(S,B,t,F,k):
    S,B,t,F,k=[D(str(x)) for x in (S,B,t,F,k)]
    r=k*F; area=PI*r*r; skyarea=100*PI*F*F; a=area/skyarea
    f=1-(-4*LN2*k*k).exp()
    ns=S*t*f; nb=B*t*area; skyvar=nb*a; var=ns+nb+skyvar
    # Derive independently from raw aperture X and independent background Y:
    # X~Pois(Ns+Nb), Y~Pois(Bt A_sky), Z=X-aY.
    ny=B*t*skyarea; independentVar=ns+nb+a*a*ny
    return dict(S=S,B=B,t=t,fwhmArcsec=F,k=k,radiusArcsec=r,
                apertureAreaArcsec2=area,skyAreaArcsec2=skyarea,areaRatio=a,
                enclosedFraction=f,Ns=ns,Nb=nb,NskyRegion=ny,
                finiteSkyVariance=skyvar,variance=var,sigma=var.sqrt(),snr=ns/var.sqrt(),
                independentRawCountVariance=independentVar,
                rawCountVarianceError=abs(independentVar-var),
                totalFluxEstimateExpectedElectrons=S*t,
                apertureCorrectedVariance=var/(f*f))

def golden(fun,lo=D('.05'),hi=D(3)):
    p=(D(5).sqrt()-1)/2
    c=hi-p*(hi-lo);d=lo+p*(hi-lo);fc=fun(c);fd=fun(d)
    for _ in range(180):
        if fc>fd:
            hi,d,fd=d,c,fc;c=hi-p*(hi-lo);fc=fun(c)
        else:
            lo,c,fc=c,d,fd;d=lo+p*(hi-lo);fd=fun(d)
    return (lo+hi)/2

def apertureStationary(S,B,F,k,finiteSky=True):
    S,B,F,k=map(lambda x:D(str(x)),(S,B,F,k))
    f=1-(-4*LN2*k*k).exp();fp=8*LN2*k*(-4*LN2*k*k).exp()
    a=D('.01') if finiteSky else D(0);q=B*PI*F*F
    v=S*f+q*(k*k+a*k**4)
    vp=S*fp+q*(2*k+4*a*k**3)
    return 2*fp*v-f*vp

def bisect(fun,lo=D('.05'),hi=D(3)):
    fl=fun(lo)
    assert fl>0 and fun(hi)<0
    for _ in range(250):
        mid=(lo+hi)/2
        if fun(mid)>0:lo=mid
        else:hi=mid
    return (lo+hi)/2

regimes=[
    dict(label='source_dominated',S=200,B='.1',t=10,F='.4'),
    dict(label='sky_dominated',S=1,B=100,t=3600,F=3),
    dict(label='balanced',S=20,B=5,t=300,F=1),
    dict(label='poor_seeing',S=20,B=5,t=300,F=3),
    dict(label='faint_short_exposure',S=1,B='.1',t=10,F='.4')]
aCases=[];optima=[]
for p in regimes:
    for k in ['.05','.5','.67','1','1.5','3']:
        c=aperture(p['S'],p['B'],p['t'],p['F'],k);c['label']=p['label']
        kk=float(k);ff=simpson(lambda rr:8*math.log(2)*rr*math.exp(-4*math.log(2)*rr*rr),0,kk,4000)
        c['numericalRadialPsfFraction']=ff;c['radialFractionAbsError']=abs(ff-float(c['enclosedFraction']))
        aCases.append(c)
    kg=golden(lambda k:aperture(p['S'],p['B'],p['t'],p['F'],k)['snr'])
    kb=bisect(lambda k:apertureStationary(p['S'],p['B'],p['F'],k))
    opt=aperture(p['S'],p['B'],p['t'],p['F'],kg)
    opt['label']=p['label'];opt['stationaryRootK']=kb;opt['goldenVsStationaryAbs']=abs(kg-kb)
    opt['snrKminus001']=aperture(p['S'],p['B'],p['t'],p['F'],kg-D('.01'))['snr']
    opt['snrKplus001']=aperture(p['S'],p['B'],p['t'],p['F'],kg+D('.01'))['snr']
    opt['finiteSkyPenaltyFactorAtOptimum']=(opt['variance']/(opt['Ns']+opt['Nb'])).sqrt()
    optima.append(opt)

ainvariants=[]
for p in regimes:
    c1=aperture(p['S'],p['B'],10,p['F'],1)
    c2=aperture(p['S'],p['B'],3600,p['F'],1)
    ainvariants.append(dict(label=p['label'],t1=10,t2=3600,
                            snr1=c1['snr'],snr2=c2['snr'],ratio=c2['snr']/c1['snr'],
                            expectedSqrtTimeRatio=D(360).sqrt(),
                            relativeError=abs((c2['snr']/c1['snr'])/D(360).sqrt()-1)))
aCorners=[]
for S in [1,200]:
    for B in ['.1',100]:
        for t in [10,3600]:
            for F in ['.4',3]:
                for k in ['.05',3]:
                    aCorners.append(aperture(S,B,t,F,k))
# Exact limiting regimes are additional mathematical tests, not all allowed UI inputs.
kBgFinite=golden(lambda k:(1-(-4*LN2*k*k).exp())/(k*(1+k*k/100).sqrt()))
kBgInfinite=golden(lambda k:(1-(-4*LN2*k*k).exp())/k)
aLimits=dict(backgroundOnlyFiniteSkyOptimalK=kBgFinite,
             backgroundOnlyFiniteSkyOptimalFraction=1-(-4*LN2*kBgFinite*kBgFinite).exp(),
             backgroundOnlyInfiniteSkyOptimalK=kBgInfinite,
             backgroundOnlyInfiniteSkyOptimalFraction=1-(-4*LN2*kBgInfinite*kBgInfinite).exp(),
             sourceOnlyK3=aperture(200,0,10,'.4',3),
             gaussianHalfLightK=aperture(1,1,1,1,'.5')['enclosedFraction'])


def roots(m):
    m=D(str(m));q0=D('1.5')*m-1
    if 0<m<D(2)/3:
        s=((1-m)*(1+3*m)).sqrt()
        x=(1-m+s)/(2*m)
        z=2*(2-3*m)/(s+3*m-1) # rationalized near m=2/3
        zacc=((2*(1-m)/m).ln()/3).exp()-1
    else:x=z=zacc=None
    return dict(q0=q0,presentAccelerating=q0<0,nonzeroRootX=x,
                nonzeroRootZ=z,nonzeroRootInPlotRange=z is not None and z<=5,
                accelerationTransitionZ=zacc)

def redshift(H0,m,years,z):
    H0,m,years,z=map(lambda x:D(str(x)),(H0,m,years,z));x=1+z
    e=(m*x**3+1-m).sqrt();h=H0/MPC_KM;dt=years*YEAR
    # Rationalization avoids cancellation at small z; roots exact to precision.
    f=(x*x-(m*x**3+1-m))/(x+e)
    zdot=h*f;dz=zdot*dt;dv=C*dz/x
    return dict(H0=H0,omegaM=m,years=years,z=z,E=e,H0PerSecond=h,
                observerSeconds=dt,driftNorm=f,zdotPerSecond=zdot,
                zdotPerYear=zdot*YEAR,linearDeltaZ=dz,
                linearDeltaVCmS=dv,linearDeltaVMillimeterPerS=dv*10,
                **roots(m))

# Evolve exact flat matter+Lambda scale factors at observer and source along fixed comoving distance.
# u=initialH0*(observer t-t0); da_o/du=a_o E(a_o), da_e/du=a_e^2 E(a_e)/a_o.
def rhs(ao,ae,m):
    lam=1-m
    eo=(m/ao**3+lam).sqrt();ee=(m/ae**3+lam).sqrt()
    return ao*eo,ae*ae*ee/ao

def rk4Scale(m,x,u,n=32):
    ao=D(1);ae=1/x;h=u/n
    for _ in range(n):
        a,b=rhs(ao,ae,m)
        c,d=rhs(ao+h*a/2,ae+h*b/2,m)
        e,f=rhs(ao+h*c/2,ae+h*d/2,m)
        g,i=rhs(ao+h*e,ae+h*f,m)
        ao+=h*(a+2*c+2*e+g)/6
        ae+=h*(b+2*d+2*f+i)/6
    return ao,ae

def smallConformalInterval(a,b,m,n=8):
    h=(b-a)/n
    def v(x):return 1/(x*x*(m/x**3+1-m).sqrt())
    return h*(v(a)+v(b)+sum((4 if j%2 else 2)*v(a+j*h) for j in range(1,n)))/3

def exactObserverScale(m,u):
    lam=1-m
    if not lam:return ((1+D('1.5')*u).ln()*D(2)/3).exp()
    s=lam.sqrt();bu=D('1.5')*s*u
    cosh=(bu.exp()+(-bu).exp())/2;sinh=(bu.exp()-(-bu).exp())/2
    return ((cosh+sinh/s).ln()*D(2)/3).exp()

params=[]
for m in ['.05','.3','.6666666666666666666666666666666666666666666666666666666666666666666666666666666666667','1']:
    for z in [0,'.01','.5',1,3,5]:params.append((70,m,30,z))
params.extend([(50,'.3',1,2),(90,'.3',30,2),(90,1,30,5),(50,'.05',1,5),
               (90,'.666666',30,'.000001'),(90,'.666667',30,'.000001')])
# Exact mathematical zero and its sides (more than requested 30 states).
zr=roots('.3')['nonzeroRootZ']
params.extend([(90,'.3',30,zr),(90,'.3',30,zr-D('.000001')),(90,'.3',30,zr+D('.000001'))])
bCases=[]
for H,m,y,z in params:
    c=redshift(H,m,y,z);m=D(str(m));x=1+D(str(z));u=c['H0PerSecond']*c['observerSeconds']
    ao,ae=rk4Scale(m,x,u);ao2,ae2=rk4Scale(m,x,u,64)
    exactDz=ao/ae-x;exactDv=C*exactDz/x
    intobs=smallConformalInterval(D(1),ao,m)
    intsrc=smallConformalInterval(1/x,ae,m)
    # Compare to an independently evaluated exact homogeneous scale-factor solution.
    aosol=exactObserverScale(m,u)
    c.update(dimensionlessObserverInterval=u,finalObserverScale=ao,finalEmissionScale=ae,
             exactFiniteDeltaZ=exactDz,exactFiniteDeltaVCmS=exactDv,
             linearAbsoluteErrorVCmS=abs(exactDv-c['linearDeltaVCmS']),
             linearRelativeError=abs(exactDv/c['linearDeltaVCmS']-1) if abs(c['linearDeltaVCmS'])>D('1e-40') else None,
             rk32Vs64DeltaZAbs=abs(exactDz-(ao2/ae2-x)),
             equalComovingConformalIncrementResidual=abs(intobs-intsrc),
             observerScaleExactSolutionAbsError=abs(ao-aosol),
             initialSecondDerivativeX= x-c['E']+D('1.5')*m*x*(x-1),
             secondOrderApproxDeltaZ=c['linearDeltaZ']+(x-c['E']+D('1.5')*m*x*(x-1))*u*u/2)
    bCases.append(c)

# Conservative bound in the entire UI domain, including near a zero where relative error is unsuitable.
# u<=3e-9. A_o in [1,1.00000001], x in [.9999999,6.0000001] is a bootstrap-invariant enclosure.
# |x'| <= x + E_e <21; times u_max gives dx<6.3e-8, within the enclosure.
# |x''| <= x + E_e + 1.5 |x^2-x| <66 in that enclosure.
umax=D(90)/MPC_KM*30*YEAR
linearBound=C*D(66)*umax*umax/2 # denominator initial x >=1
bScaling=[]
for z in ['.01','1','3','5']:
    a=redshift(50,'.3',1,z);b=redshift(90,'.3',30,z)
    bScaling.append(dict(z=D(z),lowDeltaVCmS=a['linearDeltaVCmS'],highDeltaVCmS=b['linearDeltaVCmS'],
                         actualScale=b['linearDeltaVCmS']/a['linearDeltaVCmS'],expectedScale=D(54)))
rootchecks=[]
for m in ['.05','.3','.5','.666666','0.6666666666666666666666666666666666666666666666666666666666666666666666666666666666667','1']:
    r=roots(m);f0=redshift(70,m,1,0)['driftNorm']
    fr=redshift(70,m,1,r['nonzeroRootZ'])['driftNorm'] if r['nonzeroRootZ'] is not None else None
    rootchecks.append(dict(omegaM=D(m),**r,zeroRedshiftDrift=f0,nonzeroRootDriftResidual=fr))

ref=dict(metadata=dict(version=34,method='Python stdlib, Decimal 85 digits; numerical radial PSF integration; golden section and independent stationary root; exact two-scale-factor RK4 with equal-comoving-distance integral check.',
                       constants=dict(speedOfLightCmS=C,julianYearSeconds=YEAR,parsecCm=PC_CM,megaparsecKm=MPC_KM),
                       noRepositoryModelImported=True),
         aperture=dict(cases=aCases,extremeCornerStates=aCorners,optima=optima,timeScalingChecks=ainvariants,limitingChecks=aLimits,
                       validation=dict(maxIndependentVarianceAbs=max(c['rawCountVarianceError'] for c in aCases+aCorners),
                                       minimumCornerVariance=min(c['variance'] for c in aCorners),
                                       allCornerResultsPositive=all(c['variance']>0 and c['snr']>0 and 0<c['enclosedFraction']<1 for c in aCorners),
                                       maxPsfIntegralAbs=max(c['radialFractionAbsError'] for c in aCases),
                                       maxGoldenVsStationaryKAbs=max(c['goldenVsStationaryAbs'] for c in optima)),
                       tolerance=dict(snrRelative=3e-12,optimumKAbsolute=2e-8,radialPsfIntegralAbs=2e-11)),
         redshiftDrift=dict(cases=bCases,scalingChecks=bScaling,rootChecks=rootchecks,
                            finiteIntervalValidation=dict(maxLinearAbsoluteErrorVCmS=max(c['linearAbsoluteErrorVCmS'] for c in bCases),
                                                          conservativeFullDomainLinearAbsoluteBoundCmS=linearBound,
                                                          dimensionlessObserverIntervalMax=umax,
                                                          maxRk32Vs64DeltaZAbs=max(c['rk32Vs64DeltaZAbs'] for c in bCases),
                                                          maxEqualComovingIncrementResidual=max(c['equalComovingConformalIncrementResidual'] for c in bCases),
                                                          maxObserverScaleExactSolutionAbsError=max(c['observerScaleExactSolutionAbsError'] for c in bCases)),
                            tolerance=dict(linearDeltaVCmSRelative=4e-12,nearZeroAbsoluteCmS=2e-10,
                                           finiteVsLinearAbsoluteCmS=linearBound)),
         scopeNotes=['Aperture is a continuum, centered circular Gaussian point source plus uniform independent Poisson sky model. No pixel discretization/read noise/dark/PSF calibration or source flux in the sky region.',
                     'Sky estimator is arithmetic mean of an independent source-free region of area 100*pi*FWHM^2. It is not a median or correlated/resampled image.',
                     'Net aperture expectation Ns is not the total source expectation St; aperture correction rescales both signal and noise, retaining SNR.',
                     'Photometry SNR is a predicted expectation-to-standard-deviation ratio, not a claimed significance from one random observed image.',
                     'Redshift drift assumes comoving observer and source, homogeneous flat matter+Lambda, and no radiation/peculiar acceleration. Delta v is spectroscopic velocity-equivalent shift c Delta z/(1+z_initial), not peculiar/recession velocity.',
                     'Nonzero root expression x means 1+z, and may lie outside plot z<=5.',
                     'Linear-baseline error should be bounded absolutely near zero drift, where relative error is undefined.'])
assert ref['aperture']['validation']['maxGoldenVsStationaryKAbs'] < D('1e-35')
assert ref['aperture']['validation']['maxPsfIntegralAbs'] < 2e-11
assert ref['redshiftDrift']['finiteIntervalValidation']['maxLinearAbsoluteErrorVCmS'] < linearBound
assert ref['redshiftDrift']['finiteIntervalValidation']['maxRk32Vs64DeltaZAbs'] < D('1e-40')
assert ref['redshiftDrift']['finiteIntervalValidation']['maxEqualComovingIncrementResidual'] < D('1e-40')
(OUT/'photometry-drift-v34.json').write_text(json.dumps(jd(ref),indent=2,ensure_ascii=False)+'\n')
print(json.dumps(jd(dict(apertureValidation=ref['aperture']['validation'],
                         apertureOptima=[{k:o[k] for k in ['label','k','snr','enclosedFraction']} for o in optima],
                         apertureLimits={k:v for k,v in aLimits.items() if k!='sourceOnlyK3'},
                         driftValidation=ref['redshiftDrift']['finiteIntervalValidation'],
                         omegaM03roots=roots('.3'),caseCounts=dict(aperture=len(aCases),drift=len(bCases)))),indent=2))
