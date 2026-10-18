# Tidal gradiometer Figure geometry review

Final: 69 true physical solids in 69 measured-depth items. The 67-part pregeometry plan was refined by splitting each true annular bezel into camera-back and camera-front half-annular prisms. This is necessary to let its raised rim correctly occlude the recessed circular face, without a painter-key bias. The drawer/source/rail analogy is not used: this object is visibly four post-mounted test blocks in a fixed orthogonal cross, beside two actual dial heads.

Parts: 4 feet, plate, deck, 4 corner screws; plaque/2 rivets/2 ruler strips; 4 endpoint assemblies each with plinth/collar/post/seat/test mass/fastener; central flange/post/hub/cap; 4 fixed half-baselines; 2 dial heads each with mounting plate/post foot/post/case/face/2 true bezel halves/crown lug/knurled crown/2 mounting screws. All dimensions and names are in the projection JSON's partsList.

World radial axis [1,0,0], transverse [0,1,0], dot product 0. Both endpoint separations are 102 world units and share the same physical height. The two central rods stop on hub surfaces; each outer rod end stops on its own test-block surface. The blocks are supported independently by their posts. This geometry remains static; it is a computational-readout teaching apparatus, not an elasticity/noise/finite-baseline sensor simulation.

Dial hooks are data-tidal-needle-r and data-tidal-needle-t. Both are clipped to radius 21.5 on horizontal dial faces at z=35.08. gauges.r/t in the JSON give center, worldCenter, worldPlaneBasis, screen basis.u/v, needle radius 16, face radius 23 and common scale [-1.05,0.30]. Angle starts -3pi/4 and increases by 3pi/2; world needle endpoint = center + r*(sin(angle)*[1,0,0] - cos(angle)*[0,1,0]). No static needle is drawn. Runtime must draw both pointers from its pure physical model with the single lit readout ink tone. No other lit accent or decorative color is baked into the machine.

All 28 dial ticks attach to a closed engraved scale circle; the tick for zero has a stronger tone. No tick uses data-free. The only free lines are the two printed-text rules on the nameplate.

Anatomy audit: all checks 0; audit passed. No allow-list, no stand-in shapes, no painter bias. Detailed report tidal-audit.txt.
Official line check: 0 of 358 line ends float in both themes, console clean. Browser geometry checks at 1440 and 390, both themes: 69 parts each, no errors, no overflow. Geometry is static so there is no missing explode/motion pose.

Visual review: each PNG was opened and read. Four 4x close-ups cover baselines/hub/endpoint support and dial/bezel/crown junctions in both themes. Four full-frame PNGs cover desktop/390 and both themes; two official line-check PNGs were also read. An extra highlighted diagnostic PNG confirmed the radial plus arm's visibility; it is not a product asset. Rims, line roots, support contacts, scale seating and the right-angle cross read correctly. Runtime integration, animated needles, physical equations and chapter packaging remain parent-owned.
