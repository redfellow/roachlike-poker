## ADDED Requirements

### Requirement: Prediction scoring in the match recap
The recap SHALL score each person's predictions across all non-cancelled resolutions: one point for each prediction whose belief matches whether its own claim was true, zero for a wrong prediction, and nothing for a skipped claim. Cancelled resolutions SHALL contribute nothing and SHALL publish no predictions. Prediction eligibility, revision and locking are defined by the game rules, not by this capability.

#### Scenario: Predictions on two claims of one card score separately
- **WHEN** a person predicts "false" on a false first claim and "true" on a true passed claim, and the card resolves
- **THEN** both correct predictions count toward that person's `correct` total (as counted by the `correct` leaderboard award and `sofa-psychologist`), and the recap shows no prediction score

#### Scenario: Cancelled challenge earns nothing
- **WHEN** a challenge is cancelled after predictions were submitted
- **THEN** the recap stores the cancelled resolution with no predictions and no score changes

### Requirement: Recap player statistics
The recap SHALL show, per person, receiver answers, bluff calls and own final-claim bluffs. The round history SHALL show each resolved round's locked predictions per claim, with their outcome, after resolution.

#### Scenario: Statistics columns
- **WHEN** a recap is shown
- **THEN** each person shows answers correct out of submitted with a rounded percentage (or `—` when none), bluff calls as correct / wrong `En usko` answers, and own final-claim bluffs as passed / caught

#### Scenario: Locked predictions shown after resolution
- **WHEN** a resolved round is opened in the history
- **THEN** each claim lists its predictions with ✓ or ✕, the predictor and `Uskon`/`En usko`, or a no-predictions note

### Requirement: Attribution to people
Awards SHALL be attributed to person IDs, not seats. A bluff SHALL be attributed to the sender of the final claim, never to earlier senders in the chain. A replacement person SHALL NOT inherit earlier persons' counts. Passing or abstaining SHALL NOT count as belief. Only non-cancelled resolutions SHALL count toward any award.

#### Scenario: Bluff credited to the last sender
- **WHEN** A sends a card with a true claim, B peeks and passes it with a false claim, and the receiver believes
- **THEN** the believed bluff counts for B and not for A

### Requirement: Leaderboard awards
`bluffs` (most believed final-claim bluffs, minimum 3), `catches` (most correctly called final-claim bluffs, minimum 3) and `correct` (most correct predictions, minimum 5) SHALL be awarded only to a single unique leader; ties award nobody. `chain` SHALL be awarded to the person who took the penalty card in the uniquely longest resolved chain, when that chain has at least 3 claims; ties for longest award nobody.

#### Scenario: Tied leaders get nothing
- **WHEN** two people each have five correct predictions and nobody has more
- **THEN** no `correct` award is given

### Requirement: Event and threshold awards
The match SHALL grant each award in the table below to every qualifying person, one entry per key listing all recipients.

#### Scenario: Award conditions
- **WHEN** a match recap is computed
- **THEN** each award is granted exactly by its condition below. "Lie" means the final claim differs from the card; "believed" means the receiver answered `Uskon`; "at risk" means the person's seat already showed threshold−1 cards of one creature before the resolution; "table size" is the number of people in the match.

| Key | Recipient and condition |
| --- | --- |
| `twice` | Final sender, after fooling the same receiver with believed lies on 3 consecutive resolutions between that sender→receiver pair (any other outcome for the pair resets the streak) |
| `crowd` | Final sender of a believed lie in a match of 5+ people where the final claim had 3+ predictions, all believing |
| `cheap-bluff` | Final sender of a believed lie in a match of 5+ people where the final claim had 3+ predictions, all disbelieving |
| `paranoid` | Receiver who answered `En usko` to 4+ true final claims |
| `truth` | Final sender whose true final claim was disbelieved 4+ times |
| `undertaker` | Final sender of a believed lie whose resolution ended the match by matching cards |
| `own-grave` | Final sender of a disbelieved lie whose resolution ended the match by matching cards |
| `last-bluff` | Final sender of a believed lie while at risk |
| `wrong-corpse` | Receiver who disbelieved a true final claim from an at-risk sender |
| `serial-liar` | Person who made 6+ consecutive false claims (any claim in a chain counts; a true claim resets) |
| `poker-grave` | Person with 5+ believed final-claim bluffs |
| `lie-detector` | Person with 5+ correctly called final-claim bluffs |
| `honest-bastard` | Person with 7+ claims, all true |
| `trust-issues` | Person with 7+ `En usko` answers, at most 1 correct |
| `optimist` | Person with 7+ answers, all `Uskon` |
| `recycle-problem` | Person who sent 5+ passed (non-initial) claims |
| `dirty-baton` | Person who sent or finally received in 5+ multi-claim chains |
| `full-circle` | Penalty taker of a multi-claim chain in which every active (non-removed) person, at least 5, took part |
| `return-sender` | Final receiver of a 3+ claim chain who sent its first claim |
| `sofa-psychologist` | Person with 8+ predictions, all correct |
| `wrong-professional` | Person with 8+ predictions, none correct |
| `lone-genius` | In a match of 5+ people, among people who were ever the only correct predictor of a claim with 3+ predictions, the unique one with the most correct predictions |
| `herd-grave` | In a match of 5+ people, among people who were in a unanimous wrong set of 3+ predictions on a claim, the unique one with the most wrong predictions |
| `equal-bastard` | In a match of 4+ people, an active person who has sent claims to every other active person |
| `bullet-dodger` | The unique initial target of 5+ challenges, more than anyone, who did not lose |
| `silent-partner` | When an ended match had 10+ resolutions, each active person who made no claim and gave no answer |
| `slow-death` | Loser of a match with a loser and 25+ resolutions |
| `clean-corpse` | Loser who made 4+ claims, all true |
| `trusting-dead` | Loser who believed 5+ lies |
| `grave` | Person (still in the same active seat) who reached threshold−1 of one creature, survived 5+ further resolutions and did not lose, in a match with a loser |
| `empty` | Loser who lost by having to initiate with an empty hand |

#### Scenario: Three consecutive fools on one pair
- **WHEN** A's lies are believed by B on three consecutive A→B resolutions
- **THEN** A receives `twice`; with only two, A does not

#### Scenario: Small table blocks audience awards
- **WHEN** a believed lie with three believing predictions happens in a four-person match
- **THEN** no `crowd` award is given

#### Scenario: Survivor at the edge
- **WHEN** a person reaches threshold−1 cards of one creature and five more cards resolve without them losing
- **THEN** that person receives `grave`

### Requirement: Award copy
The recap SHALL show each award with its recipients' names joined by ` & `, the theme's title and copy, and the default reason line.

#### Scenario: Default copy
- **WHEN** an Örkkipokka recap shows an award
- **THEN** it uses the copy below, substituting the count for `<count>` (`chain` uses the longest chain length among all stored resolutions, cancelled ones included); a key without a reason shows `Saavutus myönnettiin tämän ottelun tapahtumien perusteella.`

| Key | Title | Copy | Reason |
| --- | --- | --- | --- |
| `bluffs` | Paskapuheen tohtori | Väitöskirja oli palturia. Kaikki taputtivat. | Yksin eniten läpimenneitä bluffeja, vähintään kolme: <count>. |
| `catches` | Paskatutka | Hämähäkkivaistoihin verrattavissa oleva yliluonnollinen kyky haistaa kusetus. | Yksin eniten käräytettyjä bluffeja, vähintään kolme: <count>. |
| `correct` | Oraakkeli peräsuolesta | Ennustukset tulivat perseestä. Silti oikein. | Yksin eniten oikeita sivustakatsojan arvauksia, vähintään viisi: <count>. |
| `chain` | Saatanan kiertopalkinto | Kävi kaikilla. Jäi yhden riesaksi. | Hävisi pelin pisimmässä korttiketjussa: <count> siirtoa. |
| `twice` | Kuiva kakkonen | Sama kusetus. Sama uhri. Ei liukuvoidetta. | Huijasi samaa pelaajaa onnistuneesti vähintään kolmesti peräkkäin. |
| `crowd` | Joukkokusetus | Koko pöytä söi paskaa ja pyysi reseptin. | Vähintään viiden pelaajan pelissä bluffi meni läpi vastaanottajalle ja kaikille kolmelle tai useammalle arvanneelle. |
| `paranoid` | Vainoharhainen mulkku | Kukaan ei valehdellut. Sekös epäilytti. | Epäili vähintään neljää totta väitettä väärin. |
| `truth` | Totuus sattuu, saatana | Kerrankin puhuit totta. Kaveri maksoi siitä. | Sai vähintään neljä totta väitettä näyttämään valheilta. |
| `undertaker` | Hautausurakoitsija | Toimitus perille. Asiakas kylmänä. | Syötti läpimenneen bluffin, joka aiheutti vastaanottajan tappion. |
| `own-grave` | Kuset reisillä | Kasteli omat housunsa. | Jäi kiinni bluffista, joka aiheutti oman tappion. |
| `grave` | Hautapaikka varattu | Arkkuun sai jo kaivertaa nimen. | Kävi yhden kortin päässä tappiosta ja selviytyi vielä vähintään viisi kierrosta. |
| `empty` | Tyhjä käsi, kylmä perse | Eväät loppuivat ennen selityksiä. | Hävisi, koska käsi oli tyhjä oman aloitusvuoron alkaessa. |
| `poker-grave` | Pokka pitää | Valehteli niin siististi, että ruumiskin nyökkäsi. | Sai vähintään viisi bluffia menemään läpi saman pelin aikana. |
| `last-bluff` | Viimeinen kusetus | Valehteli vielä toinen jalka haudassa. | Onnistui bluffissa ollessaan yhden samanlaisen kortin päässä tappiosta. |
| `honest-bastard` | Rehellinen paskiainen | Puhui totta niin usein, että se alkoi vaikuttaa epäilyttävältä. | Esitti vähintään seitsemän väitettä, joista jokainen oli totta. |
| `serial-liar` | Sarjavalehtelija | Totuus nähtiin viimeksi alkuillasta. | Esitti kuusi omaa valheellista väitettä peräkkäin. |
| `cheap-bluff` | Halpa meni läpi | Ei ollut hyvä valhe. Se vain löysi tarpeeksi tyhmän kohteen. | Vähintään viiden pelaajan pelissä bluffasi onnistuneesti, vaikka kaikki vähintään kolme ennustusta tunnistivat valheen. |
| `lie-detector` | Valheenpaljastaja | Haistoi kusetuksen ennen kuin se ehti jäähtyä. | Käräytti vähintään viisi bluffia saman pelin aikana. |
| `trust-issues` | Luottamusongelma | Epäili kaikkea. Kerran jopa aiheesta. | Valitsi En usko vähintään seitsemästi ja osui oikeaan korkeintaan kerran. |
| `trusting-dead` | Hyväuskoinen vainaja | Luotti ystäviinsä. Siihen se sitten kuoli. | Uskoi vähintään viisi valhetta ja hävisi lopulta pelin. |
| `wrong-corpse` | Väärä ruumis | Ruumiinavaus onnistui. Potilas vain oli elossa. | Epäili totuutta, kun lähettäjä oli yhden kortin päässä tappiosta. |
| `optimist` | Ihmiskunnan viimeinen optimisti | Uskoi kaiken. Maailma rankaisi asianmukaisesti. | Vastasi Uskon vähintään seitsemästi valitsematta kertaakaan En usko. |
| `recycle-problem` | Kierrätä ongelma | Kun paska osuu käteen, anna se kaverille. | Katsoi ja siirsi kortin eteenpäin vähintään viidesti. |
| `full-circle` | Täysi kierros, vajaa järki | Kortti näki kaikki pelaajat ja jäi lopulta tämän riesaksi. | Vähintään viiden pelaajan pelissä sai kortin ketjusta, jossa kortti kävi jokaisella. |
| `return-sender` | Palautus lähettäjälle | Paska teki kunniakierroksen ja palasi kotiin. | Sai vähintään kolmen siirron korttiketjun lopuksi aloittamansa kortin takaisin. |
| `dirty-baton` | Likainen viestikapula | Kaikki koskivat. Kukaan ei pese käsiään. | Osallistui vähintään viiteen usean siirron korttiketjuun. |
| `slow-death` | Hidas kuolema | Ei hävinnyt nopeasti. Hävisi perusteellisesti. | Hävisi vähintään 25 ratkaistua korttia kestäneen pelin. |
| `clean-corpse` | Puhdas ruumis | Ei bluffannut kertaakaan. Kuoli silti. | Hävisi esitettyään vähintään neljä väitettä, joista jokainen oli totta. |
| `bullet-dodger` | Luodinväistäjä | Kaikki tähtäsivät. Jostain syystä tämä jäi henkiin. | Oli yksin eniten ja vähintään viiden aloitussiirron kohteena eikä hävinnyt. |
| `silent-partner` | Hiljainen osakas | Oli paikalla. Juridisesti. | Selvisi vähintään kymmenen kierroksen pelistä aloittamatta väitettä tai vastaamatta yhteenkään. |
| `equal-bastard` | Tasapuolinen kusipää | Kohteli kaikkia yhtä huonosti. | Vähintään neljän pelaajan pelissä lähetti kortin jokaiselle muulle aktiiviselle pelaajalle. |
| `sofa-psychologist` | Sohvapsykologi | Luki ilmeitä kuin halpaa rikosromaania. | Teki vähintään kahdeksan ennustusta ja sai ne kaikki oikein. |
| `wrong-professional` | Väärinymmärryksen ammattilainen | Väärässä olemisesta tuli jo elämäntapa. | Teki vähintään kahdeksan ennustusta osumatta kertaakaan oikeaan. |
| `lone-genius` | Yksinäinen nero | Oli yksin oikeassa ja tiesi muutenkin muita paremmin. | Vähintään viiden pelaajan pelissä oli kolmesta tai useammasta ennustajasta ainoa oikeassa ollut ja sai ehdokkaista eniten ennustuksia oikein. |
| `herd-grave` | Laumassa hautaan | Oli mukana yhteisessä harhassa ja keräsi illan eniten huteja. | Vähintään viiden pelaajan pelissä osallistui vähintään kolmen pelaajan yksimielisesti väärään ennustukseen ja sai ehdokkaista eniten ennustuksia väärin. |

#### Scenario: Herrasmiespokeri copy
- **WHEN** a Herrasmiespokeri recap shows an award
- **THEN** title and copy are replaced as below and the reason is unchanged

| Key | Title | Copy |
| --- | --- | --- |
| `bluffs` | Klubin puheenjohtaja | Puhui paskaa arvokkaasti ja sai pöytäseurueen nyökkäilemään. |
| `catches` | Portieerin paskatutka | Haistoi valheen jo ennen kuin herrasmies ehti riisua silinterinsä. |
| `correct` | Salonki-orakkeli | Näki tulevan pohjalasin läpi ja oli vastenmielisen oikeassa. |
| `chain` | Kiertävä konjakkilasi | Kävi jokaisella, mutta viimeinen herrasmies joi pohjat. |
| `twice` | Sama uhri, uusi vuosikerta | Tarjoili saman kusetuksen samalle pöytänaapurille ilman häpeää. |
| `crowd` | Yhtiökokouksen yksimielisyys | Koko klubi hyväksyi valheen pöytäkirjaan. |
| `paranoid` | Epäluuloinen perijä | Epäili testamenttia, tarjoilijaa ja lopulta omaa varjoaan. |
| `truth` | Rehellinen lurjus | Puhui totta niin epäilyttävästi, että joku muu maksoi laskun. |
| `undertaker` | Klubin hautausmestari | Saattoi pöytätoverin tyylikkäästi suoraan tappiolle. |
| `own-grave` | Oma hautaholvi | Tilasi arkun, kaiversi nimensä ja kompastui itse sisään. |
| `grave` | Viimeinen sikari | Kuolema odotti eteisessä, mutta herrasmies tilasi vielä yhden. |
| `empty` | Tyhjä tasku, täysi lasku | Kortit loppuivat ennen tekosyitä. |
| `poker-grave` | Pokka kuin hovimestarilla | Valheet tarjoiltiin hopeavadilta ilman käden tärinää. |
| `last-bluff` | Viimeinen malja | Valehteli vielä toinen jalka viinikellarissa. |
| `honest-bastard` | Kunniallinen paskiainen | Puhui pelkkää totta ja pilasi sillä koko illan. |
| `serial-liar` | Salonki-Scheherazade | Kertoi kuusi satua eikä yhdessäkään ollut moraalia. |
| `cheap-bluff` | Talonskandaali | Valhe oli halpa, mutta seura vielä halvempaa. |
| `lie-detector` | Monokkelin läpi | Näki kusetuksen siitäkin huolimatta, että lasi oli huurussa. |
| `trust-issues` | Perintöriidan veteraani | Ei luottanut kehenkään. Ei edes asianajajaansa. |
| `trusting-dead` | Hyväuskoinen kunnianjäsen | Luotti herrasmiehiin ja liittyi vainajien vuosikokoukseen. |
| `wrong-corpse` | Väärä muistopuhe | Hautajaiset olivat hienot. Vainaja vain hengitti. |
| `optimist` | Klubin viimeinen optimisti | Uskoi jokaista herrasmiestä ja ansaitsi seuraukset. |
| `recycle-problem` | Kiertävä lasku | Kun lasku saapui, se siirrettiin sivistyneesti seuraavalle. |
| `full-circle` | Täysi klubikierros | Kortti kiersi koko salongin ja jäi lopulta tämän herrasmiehen laskuun. |
| `return-sender` | Palautus hovimestarille | Tarjoilu kiersi pöydän ja palasi tilaajalleen. |
| `dirty-baton` | Tahmainen kävelykeppi | Kaikki pitelivät sitä. Kukaan ei kysynyt miksi se oli märkä. |
| `slow-death` | Pitkä ilta klubilla | Ei sammunut nopeasti. Sammui perusteellisesti. |
| `clean-corpse` | Moitteeton ruumis | Ei valehdellut kertaakaan. Etiketti ei silti pelastanut. |
| `bullet-dodger` | Kaksintaistelun väistelijä | Kaikki tähtäsivät, mutta tämä herrasmies unohti kuolla. |
| `silent-partner` | Äänetön yhtiömies | Oli läsnä lähinnä klubin jäsenluettelossa. |
| `equal-bastard` | Tasapuolinen sikailija | Kohteli jokaista pöytätoveria yhtä ala-arvoisesti. |
| `sofa-psychologist` | Nahkasohvan Freud | Analysoi pöytäseurueen ilmeet ja laskutti konjakilla. |
| `wrong-professional` | Arvovaltainen väärässäolija | Oli väärässä niin vakuuttavasti, että siitä tuli virallinen kanta. |
| `lone-genius` | Klubin ainoa selvä | Oli yksin oikeassa ja näki illan aikana useammin oikein kuin muut ehdokkaat. |
| `herd-grave` | Johtokunta hautaan | Osallistui yksimieliseen virheeseen ja keräsi illan aikana eniten huteja ehdokkaista. |

#### Scenario: Gentleman theme copy
- **WHEN** a Herrasmiespokeri match recap shows a `bluffs` award
- **THEN** it reads `Klubin puheenjohtaja` with the default `bluffs` reason line
