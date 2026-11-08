# Match Achievements

Status: keep this set and tone. This is the maximum permitted level of filth; do not intensify it. Match-only; no effect on defeat rules.

Requirements (attribution, ties, leaderboard minimums, award conditions and copy for both themes) are specified in the pending OpenSpec change [match-achievements spec](../openspec/changes/spec-match-achievements-and-predictions/specs/match-achievements/spec.md), which follows the current implementation. After integration they move to `openspec/specs/match-achievements/spec.md`.

Naming history: Oraakkeli peräsuolesta replaces Ajatustenlukija (other renames are noted in the table below). Hautausurakoitsija and Tyhjä käsi, kylmä perse were proposed here and now match the spec.

## Unresolved proposals

Status: unresolved. These earlier proposals differ from the implemented conditions or copy in the spec above. Whether any of them should replace the implemented behavior has not been decided; they are kept as a record, not as requirements.

| Name | Proposed copy | Proposed condition | Implemented instead (see spec) |
| --- | --- | --- | --- |
| (all leaderboard awards) | — | Require at least one qualifying event for a leaderboard award; share ties. | Minimums 3 / 3 / 5; ties award nobody. |
| (prediction score, from the project plan) | — | Show prediction accuracy and participation alongside points. | Prediction points appear only through awards; the score table shows receiver-answer accuracy, bluff calls and bluffs. |
| Paskapuheen tohtori | Väitöskirja oli paskaa. Kaikki taputtivat. | Most false claims believed by the final receiver. Replaces Pokerinaama. | Copy `Väitöskirja oli palturia.`; unique leader, minimum 3. |
| Paskatutka | Haistaa kusetuksen oman ripulinkin läpi. | Most correct false calls against false claims. Replaces Valheenpaljastin. | Different copy; unique leader, minimum 3. |
| Saatanan kiertopalkinto | Kävi kaikilla. Jäi yhden riesaksi. | Longest resolved passing chain; shared by its participants. Replaces Kiertopalkinto. | Only the penalty taker; minimum 3 claims; unique longest chain. |
| Joukkokusetus | Koko pöytä söi paskaa ja pyysi reseptin. | False claim believed by its receiver and all submitted eligible predictions, minimum two predictions. Replaces Yleisö lankesi; copy is comic exaggeration, UI should show actual participant counts. | 3+ predictions in a match of 5+ people; no participant counts shown. |
| Kuiva kakkonen | Sama kusetus. Sama uhri. Ei liukuvoidetta. | Same claimant fools the same receiver on two consecutive resolved encounters between that pair. | Three consecutive. |
| Hautapaikka varattu | Arkkuun sai jo kaivertaa nimen. | Reach one card below the matching-card defeat threshold, then survive at least three further resolved challenges and finish without losing. | Five further resolutions. |
| Oma kusetus, oma kuoppa | Kaivoit kuopan. Hyppäsit itse. | Your false claim is correctly challenged and gives you your game-ending matching card. | Title `Kuset reisillä`, copy `Kasteli omat housunsa.` |
| Vainoharhainen mulkku | Kukaan ei valehdellut. Sekös epäilytti. | At least three false calls against true claims in the match. | At least four. |
| Totuus sattuu, saatana | Kerrankin puhuit totta. Kaveri maksoi siitä. | At least three true claims incorrectly challenged by receivers in the match. | At least four. |

## Open implementation details

Define consecutive encounters across passing chains; count accuracy denominators explicitly; limit recap award density; verify all award criteria with worked examples.
