# IMF sampling tray Figure geometry review

75 true physical solids in 75 measured-depth items. The pregeometry plan is imf-parts-plan.md. Final geometry matches its count: 10 base parts, 4 support rails, 5 finish parts and 7 parts per tray (8 identical trays). Every tray has its own saddle, floor, left/right walls, back wall, front wall/readout panel and physical side-wall top fastener. It is an open sorting-tray rack, not 8 floating slabs or translucent boxes.

Each tray is 54 x 48 world units, with identical 18-unit wall height. All dimensions remain fixed. Two rails support every row; saddles touch both rails, floors rest on saddles, and walls rest on floors. The tray fronts face +world y. Back row y=-62 contains bins 0,1,2,3 in increasing x, followed by front row y=16 bins 4,5,6,7 in increasing x. Parent captions/accessible descriptions must preserve this order.

Each panel has a calibrated linear fraction scale of width 42 and height 10 world units on the front wall. All 8 panels use the same scale. Origin and basis.u/v in bins[i].plane directly map fractional u/v to SVG screen points: origin + u*basis.u + v*basis.v. The u direction is displayed share, v increases up the face. All 32 panel corners were checked against their affine maps to 1e-9. The JSON also gives true world origin/basis and all tray dimensions.

Hooks data-imf-bar-0..7 are clipped data-ink groups. data-imf-selection-0..7 are closed outline groups, initially opacity 0, using only the single Anatomy lit accent. The groups are inserted in the front panel's physically measured painter slot, not as arbitrary topmost overlays. Parent runtime changes ink only. A full-width bar means fraction 1, not maximum from a rescaled dataset.

Interpretation: the machine is an explicit sampling analogy. It contains no physical stars, and bar ink does not represent stellar radius, density, tray volume or material heap. Model, random sampling, sample persistence, per-bin fractions, selected quantile, source references and chapter integration remain parent-owned.

Anatomy audit: all checks 0, audit passed. No allow-lists, stand-ins or key biases. Official line check: 0 of 300 line ends float on both themes; console clean. Calibration ticks root in their closed outlines, ruler ticks root on physical strips, and only label text rules use free ends. Geometry is static; no explode or moving solid is claimed.

Browser checks: 1440 and 390 wide x dark/light, 75 parts in each, no overflow or page errors. All ten PNGs were opened and read: four full desktop/phone previews, four 4x tray/rail/front-wall contact close-ups in both themes, and two official line-check outputs. All eight panels are visible, separated and within their wall faces. All trays have readable volume, supported walls and clean joints. There is no unreviewed generated raster image in this deliverable.
