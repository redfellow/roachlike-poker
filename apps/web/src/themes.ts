import { DEFAULT_THEME, LABELS, type Creature, type ThemeId, type ThemeRef } from "@torakka/game";

export interface ThemeDefinition {
	id: ThemeId;
	name: string;
	version: number;
	className: string;
	brand: { first: string; second: string; label: string; documentTitle: string };
	labels: Readonly<Record<Creature, string>>;
	images: Partial<Record<Creature, string>>;
	icons: Partial<Record<Creature, string>>;
	cardBack: string;
	threshold: (count: number) => string;
	matchingLoss: (count: number) => string;
	chooseCardType: string;
	startHint: string;
	historyTitle: string;
	roundHistoryTitle: string;
	rulesFirst: string;
	rulesLoss: string;
	landingLede: string;
	cardSerial: string;
	cleanTable: string;
	rulesVisibility: string;
	achievementCopy: Readonly<Record<string, { title: string; copy: string }>>;
}

const gentlemanAchievements: Readonly<Record<string, { title: string; copy: string }>> = {
	bluffs: { title: "Klubin puheenjohtaja", copy: "Puhui paskaa arvokkaasti ja sai pöytäseurueen nyökkäilemään." },
	catches: { title: "Portieerin paskatutka", copy: "Haistoi valheen jo ennen kuin herrasmies ehti riisua silinterinsä." },
	correct: { title: "Salonki-orakkeli", copy: "Näki tulevan pohjalasin läpi ja oli vastenmielisen oikeassa." },
	chain: { title: "Kiertävä konjakkilasi", copy: "Kävi jokaisella, mutta viimeinen herrasmies joi pohjat." },
	twice: { title: "Sama uhri, uusi vuosikerta", copy: "Tarjoili saman kusetuksen samalle pöytänaapurille ilman häpeää." },
	crowd: { title: "Yhtiökokouksen yksimielisyys", copy: "Koko klubi hyväksyi valheen pöytäkirjaan." },
	paranoid: { title: "Epäluuloinen perijä", copy: "Epäili testamenttia, tarjoilijaa ja lopulta omaa varjoaan." },
	truth: { title: "Rehellinen lurjus", copy: "Puhui totta niin epäilyttävästi, että joku muu maksoi laskun." },
	undertaker: { title: "Klubin hautausmestari", copy: "Saattoi pöytätoverin tyylikkäästi suoraan tappiolle." },
	"own-grave": { title: "Oma hautaholvi", copy: "Tilasi arkun, kaiversi nimensä ja kompastui itse sisään." },
	grave: { title: "Viimeinen sikari", copy: "Kuolema odotti eteisessä, mutta herrasmies tilasi vielä yhden." },
	empty: { title: "Tyhjä tasku, täysi lasku", copy: "Kortit loppuivat ennen tekosyitä." },
	"poker-grave": { title: "Pokka kuin hovimestarilla", copy: "Valheet tarjoiltiin hopeavadilta ilman käden tärinää." },
	"last-bluff": { title: "Viimeinen malja", copy: "Valehteli vielä toinen jalka viinikellarissa." },
	"honest-bastard": { title: "Kunniallinen paskiainen", copy: "Puhui pelkkää totta ja pilasi sillä koko illan." },
	"serial-liar": { title: "Salonki-Scheherazade", copy: "Kertoi kuusi satua eikä yhdessäkään ollut moraalia." },
	"cheap-bluff": { title: "Talonskandaali", copy: "Valhe oli halpa, mutta seura vielä halvempaa." },
	"lie-detector": { title: "Monokkelin läpi", copy: "Näki kusetuksen siitäkin huolimatta, että lasi oli huurussa." },
	"trust-issues": { title: "Perintöriidan veteraani", copy: "Ei luottanut kehenkään. Ei edes asianajajaansa." },
	"trusting-dead": { title: "Hyväuskoinen kunnianjäsen", copy: "Luotti herrasmiehiin ja liittyi vainajien vuosikokoukseen." },
	"wrong-corpse": { title: "Väärä muistopuhe", copy: "Hautajaiset olivat hienot. Vainaja vain hengitti." },
	optimist: { title: "Klubin viimeinen optimisti", copy: "Uskoi jokaista herrasmiestä ja ansaitsi seuraukset." },
	"recycle-problem": { title: "Kiertävä lasku", copy: "Kun lasku saapui, se siirrettiin sivistyneesti seuraavalle." },
	"full-circle": { title: "Täysi klubikierros", copy: "Kortti kiersi salongin, eikä kukaan tunnustanut koskeneensa siihen." },
	"return-sender": { title: "Palautus hovimestarille", copy: "Tarjoilu kiersi pöydän ja palasi tilaajalleen." },
	"dirty-baton": { title: "Tahmainen kävelykeppi", copy: "Kaikki pitelivät sitä. Kukaan ei kysynyt miksi se oli märkä." },
	"slow-death": { title: "Pitkä ilta klubilla", copy: "Ei sammunut nopeasti. Sammui perusteellisesti." },
	"clean-corpse": { title: "Moitteeton ruumis", copy: "Ei valehdellut kertaakaan. Etiketti ei silti pelastanut." },
	"bullet-dodger": { title: "Kaksintaistelun väistelijä", copy: "Kaikki tähtäsivät, mutta tämä herrasmies unohti kuolla." },
	"silent-partner": { title: "Äänetön yhtiömies", copy: "Oli läsnä lähinnä klubin jäsenluettelossa." },
	"equal-bastard": { title: "Tasapuolinen sikailija", copy: "Kohteli jokaista pöytätoveria yhtä ala-arvoisesti." },
	"sofa-psychologist": { title: "Nahkasohvan Freud", copy: "Analysoi pöytäseurueen ilmeet ja laskutti konjakilla." },
	"wrong-professional": { title: "Arvovaltainen väärässäolija", copy: "Oli väärässä niin vakuuttavasti, että siitä tuli virallinen kanta." },
	"lone-genius": { title: "Klubin ainoa selvä", copy: "Kaikki muut näkivät kahtena. Tämä näki ikävä kyllä oikein." },
	"herd-grave": { title: "Johtokunta hautaan", copy: "Päätös oli yksimielinen, arvokas ja täydellisen väärä." },
};

const themes: Readonly<Record<ThemeId, ThemeDefinition>> = {
	orkkipokka: {
		id: "orkkipokka", name: "Örkkipokka", version: 1, className: "theme--orkkipokka",
		brand: { first: "ÖRKKI", second: "POKKA", label: "Örkkipokka etusivu", documentTitle: "Örkkipokka — älä luota kehenkään" },
		labels: LABELS, images: {}, icons: {}, cardBack: "ÄLÄ LUOTA KEHENKÄÄN.", threshold: count => `${count} samaa = örkkikanta räjähti`, matchingLoss: count => `${count} samaa örkkiä. Luonto voitti.`,
		chooseCardType: "Valitse örkki", startHint: "Valitse omista korteista örkki, sitten kohde ja väite. Vain Lähetä paljastaa väitteen muille.",
		historyTitle: "Pöydän likainen historia", roundHistoryTitle: "Kierros kierrokselta", rulesFirst: "Valitse kortti, uhri ja örkki, jota väität kortin esittävän. Totuus on vapaaehtoinen.", rulesLoss: "Neljä samaa örkkiä pöydässäsi: hävisit. Samoin käy, jos sinun pitäisi aloittaa, mutta kätesi on tyhjä.", landingLede: "Örkki vai täyttä paskaa? Lue kavereidesi naamoja, siirrä ongelma eteenpäin ja pidä oma pokkasi.", cardSerial: "01 / 08 — EPÄILYTTÄVÄ ÖRKKI", cleanTable: "Ei vielä örkkejä pöydässä.", rulesVisibility: "Muiden kädet ovat salaisia. Pöydän kortit, käsien koot ja kortin kulkureitti näkyvät kaikille. Sivusta voit arvata väitteen totuutta: oikea arvaus tuo lisäpisteen.", achievementCopy: {},
	},
	herrasmiespokeri: {
		id: "herrasmiespokeri", name: "Herrasmiespokeri", version: 1, className: "theme--herrasmiespokeri",
		brand: { first: "HERRASMIES", second: "POKERI", label: "Herrasmiespokeri etusivu", documentTitle: "Herrasmiespokeri — klubin häpeällisin ilta" },
		labels: { torakka: "Härvääjä", lepakko: "Kiltti", karpanen: "Tilasto", sammakko: "Murre", rotta: "Lurkki", skorpioni: "Viilaaja", hamahakki: "Nippeli", lude: "Pamppu" },
		images: { torakka: "/themes/herrasmiespokeri/card-faces/harvaaja.png", lepakko: "/themes/herrasmiespokeri/card-faces/kiltti.png", karpanen: "/themes/herrasmiespokeri/card-faces/tilasto.png", sammakko: "/themes/herrasmiespokeri/card-faces/murre.png", rotta: "/themes/herrasmiespokeri/card-faces/lurkki.png", skorpioni: "/themes/herrasmiespokeri/card-faces/viilaaja.png", hamahakki: "/themes/herrasmiespokeri/card-faces/nippeli.png", lude: "/themes/herrasmiespokeri/card-faces/pamppu.png" },
		icons: { torakka: "/themes/herrasmiespokeri/card-icons/harvaaja.png", lepakko: "/themes/herrasmiespokeri/card-icons/kiltti.png", karpanen: "/themes/herrasmiespokeri/card-icons/tilasto.png", sammakko: "/themes/herrasmiespokeri/card-icons/murre.png", rotta: "/themes/herrasmiespokeri/card-icons/lurkki.png", skorpioni: "/themes/herrasmiespokeri/card-icons/viilaaja.png", hamahakki: "/themes/herrasmiespokeri/card-icons/nippeli.png", lude: "/themes/herrasmiespokeri/card-icons/pamppu.png" },
		cardBack: "HMP", threshold: count => `${count} promillea = taju lähti`, matchingLoss: count => `${count} promillea. Taju lähti.`,
		chooseCardType: "Valitse herrasmies", startHint: "Valitse omista korteista herrasmies, sitten kohde ja väite. Vain Lähetä paljastaa väitteen muille.",
		historyTitle: "Klubin häpeäkirja", roundHistoryTitle: "Ilta pöytäkirjassa", rulesFirst: "Valitse kortti, uhri ja herrasmies, jota väität kortin esittävän. Totuus on vapaaehtoinen.", rulesLoss: "Neljä promillea vei tajun. Kaksinpelissä raja on viisi. Samoin käy, jos sinun pitäisi aloittaa, mutta kätesi on tyhjä.", landingLede: "Herrasmies vai täyttä paskaa? Lue pöytäseurueen ilmeitä, siirrä lasku eteenpäin ja säilytä arvokkuutesi.", cardSerial: "01 / 08 — EPÄILYTTÄVÄ HERRASMIES", cleanTable: "Ei vielä herrasmiehiä pöydässä.", rulesVisibility: "Muiden kädet ovat salaisia. Pöydän herrasmiehet, käsien koot ja kortin kulkureitti näkyvät kaikille. Sivusta voit arvioida puheen todenperäisyyttä: oikea arvio tuo lisäpisteen.", achievementCopy: gentlemanAchievements,
	},
};

export function themeFor(reference: ThemeRef | ThemeId | undefined): ThemeDefinition {
	const id = typeof reference === "string" ? reference : reference?.id;
	return themes[id ?? DEFAULT_THEME.id] ?? themes.orkkipokka;
}

export const AVAILABLE_THEMES = Object.values(themes);
