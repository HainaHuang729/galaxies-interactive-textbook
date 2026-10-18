# Fig 13.1 geometry review

64 physical parts, each drawn and recorded with the same true shape; 64 depth-sorted items. No audit allow-list, stand-ins, or painter-key bias.

Parts: four feet, base plate and raised deck; four corner fasteners; two guide rails and four end stops with four bolts; two ruler strips; nameplate and two rivets; source saddle, stem, case, lid, exit window and two lid fasteners; slit saddle, bottom/top bars and two side posts, two separate fixed slit leaves, two top fasteners and two knurled knobs; optical registration saddle, stem and four-piece open frame with two fasteners; detector saddle, case, recessed panel, four bezel bars, four fasteners and two controls. Detailed dimensions are in content/line-spread-bench-projection.json partsList.

The slit is a real gap (-2.5 < y < 2.5, 20 < z < 46) between two distinct leaves, never a painted line on a solid wall. It remains fixed when LOSVD/instrumental widths change. The open optical mount does not claim to implement a lens or grating prescription. No light rays are drawn. The detector plane uses arbitrary display coordinates, not calibrated physical pixels; its profile and scan marker must be driven by the same pure numerical line model used by the external chart.

SVG hooks: data-line-profile and data-line-scan-marker are clipped layers on the detector top plane. data-line-slit-leaf-far / near and data-line-detector-panel identify physical parts. data-line-part identifies all 64 solids. Projection JSON provides the camera, all four plane corners, world bounds, origin/xEnd/yEnd, and per-world-unit screen vectors.

Audit: all checks 0, audit passed. Static geometry has one actual pose; there is no untested explode or moving solid. Runtime moves only data ink.

Official Anatomy line check: 0 of 256 line ends float in both themes; console clean. Four browser combinations (1440/390 x dark/light), no overflow or page errors. All 10 resulting PNGs were opened and visually read: full desktop and phone, both official line-check outputs, and both source/slit plus detector/mounts 4x crops in each theme. Rail endings, supports, slit opening, panel seating and screws were checked in the close-ups.
