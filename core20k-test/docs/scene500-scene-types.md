# Scene500 scene types and mapping modes

Scene500 is a candidate interaction/context universe, not 500 independent vocabulary books.

The public list may contain different kinds of nodes. They must not all be populated by the same matcher.

## 1. Semantic scenes

Examples: restaurant ordering, pharmacy, job interview, bank account, weather conversation.

Primary mapping method:

`WORD -> SENSE -> KU <-> SCENE`

Candidate generation may use KU title/meaning evidence. Headword-only evidence is forbidden. Generated candidates remain pending until reviewed.

## 2. Source-membership collections

Examples: CET-4, CET-6, IELTS, TOEFL, GRE, GMAT, SAT, ACT.

These are not semantic scenes. Membership means that a word/KU belongs to an authoritative or reviewed exam vocabulary collection. A KU definition normally will not contain the string "IELTS" or "GRE".

Primary mapping method:

`authoritative source list -> headword/sense resolution -> KU membership`

Source provenance is mandatory. Semantic matching is disabled for these nodes.

## 3. Learning-task / language-function nodes

Examples: pronunciation practice, listening practice, asking for clarification, agreeing/disagreeing, giving advice.

These nodes may act as filters or overlays rather than standalone vocabulary books. A learner can combine them with a semantic scene, for example:

`Travel × Airport × Complaint/Request`

or

`Academic × Classroom × Clarification`

The runtime should support compositional filtering instead of duplicating the same KU into many flat lists.

## 4. Place/context nodes

Examples: airport, classroom, office, hospital, supermarket.

These may be used as contextual facets and can overlap with semantic scenes. They should not force a KU into every task that happens in that place.

## Release implication

A Scene500 label is not automatically a learnable standalone scene. Before runtime exposure each node must declare its role/mapping mode and satisfy the corresponding evidence gate.

The current first-stage implementation uses semantic candidate generation for ordinary scenes and separately declares source-membership scenes in `data/scene500-source-membership-v1.json`.

The next taxonomy refinement should add explicit role/facet metadata so Theme / Place / Task / Function can be composed without duplicating vocabulary mechanically.
