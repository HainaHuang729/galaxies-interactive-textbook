# Figure 8.1 — dual thermal-mode comparator review

Declared as an Anatomy Figure before work. 71 true physical solids in 71 measured-depth items. Pregeometry concept and parts plan: thermal-parts-plan.md. Final parts match that plan: 15 common bench parts and 28 per cabinet. Both independent support stacks, cabinet bodies, lids, actual screen backplates, four-piece bezels, control panels, three knurled knobs, rocker switch, connectors, vent plates, handle stands/bridges and fasteners are present. Knobs face outward on the front panel, with true axis-y cylindrical shapes; their knurl ribs fade smoothly and terminate on seam arcs.

This is a computational comparison instrument only, not a physical heat-transfer demonstration. There are no simulated particles, heat paths, electronic response, optical ray paths or fabricated sensor effects. Solids stay fixed. Root owns both computed Fourier-mode waveforms, two-wavelength interval, common amplitude scale, readouts, accessible labels and final chapter integration.

## Exact API

content/thermal-comparator-projection.json has panels[0] and panels[1]. Panel 0 is the no-conduction reference at smaller world x/left; panel 1 is with conduction at larger x/right. DOM painter order may differ, so identify with explicit index hooks rather than query order.

Each panels[i].plane contains corners (00,10,11,01), origin, basis.u, basis.v, originWorld, uWorld and vWorld. For any fractional coordinates u,v in [0,1], screen point = origin + u*basis.u + v*basis.v. v increases upward in world z, u increases in world x. The clipped drawing rectangle is 88 x 40 world units on the actual front screen surface. zeroV = 0.5 on both. The eight affine corners match to 1e-9; screen sizes are identical.

Wave hooks: data-thermal-wave-0 and data-thermal-wave-1. Both are g elements with the matching screen clipPath, within their backplate's physically measured painter slot. Selection hooks: data-thermal-selection-0/1, closed lit-tone border paths, initially opacity 0. A two-wavelength cosine can be projected with u spanning 0–1 and v=0.5+amplitudeRatio*cos(4*pi*u), provided both panels share the same scaling. Waves may end at the clipping border; they are data ink rather than unrecorded physical parts.

Fixed zero lines reach both sides of the closed calibrated screen border. Minimal quarter ticks root at that border. The only free line ends are printed-text rules on the bench plaque. No textual labels/legend claims are drawn inside either screen or machine; the caption identifies the two channels.

## Verification

Anatomy recorder/settle/audit: all failing categories 0, audit passed; 71 solids/71 items/248 measured overlaps and rules. No allow-lists, key biases or stand-in shapes. Report thermal-audit.txt.

Official Anatomy lines: 0 of 360 ends on 45 lines float, both themes; console clean. Reports thermal-lines-dark.txt and thermal-lines-light.txt.

Browser geometry: 1440/390 x dark/light, no page errors or horizontal overflow. Both front screen surfaces are visible at 390 px, each about 64.25 CSS px wide by 49.59 bounding-box px tall. They remain side by side and individually distinct. The screen projection itself is slanted, so this bounding box includes the screen's shear.

All 14 PNGs in this QA directory were opened and visually read: desktop/phone both themes, full-cabinet 4x close-ups for both channels/themes, four additional initial broad screen/support crops, and two official line-check outputs. Current full-cabinet close-ups cover every rim, knob, support post, handle, vent and connector. The bezel's rear surface reaches the cabinet front; screen ink sits in the actual inset opening. Both screens remain entirely within their cabinets. No untested moving-solid or exploded pose exists.
