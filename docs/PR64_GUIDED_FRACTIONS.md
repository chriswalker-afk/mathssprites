# PR64 — Guided Fractions campaign

World 3 is now available through the unified Experiment Board. All 24 Guided
levels are open, in six chapters of four. Independent and Apprentice tabs
show their planned counts but remain disabled. Squares remains locked.

The existing exact fraction controller mounts in a dedicated shadow-root
campaign scene, using the PR63 chamber, hand, basket and object artwork.
This avoids duplicate DOM IDs and leaves legacy whole-number gameplay
untouched. The menu owns stable world/stage/level progress, resume, best
moves, next level and return to board/home. The direct integration preview
remains isolated from progress. The new replay is a step-through comic
with physical before/after inventories, the actual operation, and exact
MathML equations, revealed after success. It is not yet the animated
notebook-writing replay used in older worlds.

Stars: an independent algebraic lower bound counts scaling moves needed
to turn the absolute coefficient difference into one. Allowed factors
2/3/4/5 change one prime exponent at a time (up to two for prime 2).
Each kind initially present in both rooms also requires at least one
add/remove move. Scaling cannot remove a nonzero quantity. The legal
engine reference route must achieve the sum of these bounds for each
Guided level. Thus the targets are exact minima, not just authored
route lengths. Stars use the existing 3/2/1 rule.

Tests cover all 24 legal routes and targets, registry/locked stages,
progress/resume isolation, comic MathML, public navigation and phone
layout. Existing global totals become 144 levels and 432 stars. Existing
World 1/2 curricula and saves stay intact; the comprehensive teacher
curriculum report will gain World 3 metadata during the final audit.

Next PR65: publish the 20 Independent Fractions levels, reuse the same
fraction controller with manual hand control, certify their star minima,
test matching equivalent fractions, failed-match rollback, progress,
replay and navigation. Keep Apprentice locked until PR66.
