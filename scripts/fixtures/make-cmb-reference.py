"""Independent standard-library references: math.lgamma and the half-integer
Gamma CDF recurrence beginning at erf(sqrt(x)), rather than JS's series/fraction.
Only moderate CDF coordinates are compared; cancellation in the far lower tail
is checked by absolute tolerance and is not treated as an exact tail reference.
"""
import json
import math
from pathlib import Path

def reference(ell, r):
    a = ell + .5
    x = a*r
    pdf = math.exp(a*math.log(a)-math.lgamma(a)+(a-1)*math.log(r)-x) if r > 0 else 0.
    if x <= 0:
        return {"ell": ell, "r": r, "pdf": pdf, "cdf": 0.}
    cdf = math.erf(math.sqrt(x))
    old_a = .5
    term = math.exp(old_a*math.log(x)-x-math.lgamma(old_a+1))
    while old_a < a:
        cdf -= term
        old_a += 1
        term *= x/old_a
    return {"ell": ell, "r": r, "pdf": pdf, "cdf": min(1., max(0., cdf))}

cases = [reference(ell, r) for ell in [2, 3, 10, 50, 100] for r in [0, .05, .3, .8, 1., 1.5, 3., 8.]]
Path(__file__).with_name("cmb-python-reference.json").write_text(json.dumps({"method": "Python math.lgamma + half-integer erf recurrence", "cases": cases}, indent=2) + '\n')
print(f"Wrote {len(cases)} independent reference coordinates")
