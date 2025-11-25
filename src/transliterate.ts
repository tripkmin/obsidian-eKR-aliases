const CHOSEONG_KEYS = [
	"r",
	"R",
	"s",
	"e",
	"E",
	"f",
	"a",
	"q",
	"Q",
	"t",
	"T",
	"d",
	"w",
	"W",
	"c",
	"z",
	"x",
	"v",
	"g",
] as const;

const JUNGSEONG_KEYS = [
	"k",
	"o",
	"i",
	"O",
	"j",
	"p",
	"u",
	"P",
	"h",
	"hk",
	"ho",
	"hl",
	"y",
	"n",
	"nj",
	"np",
	"nl",
	"b",
	"m",
	"ml",
	"l",
] as const;

const JONGSEONG_KEYS = [
	"",
	"r",
	"R",
	"rt",
	"s",
	"sw",
	"sg",
	"e",
	"f",
	"fr",
	"fa",
	"fq",
	"ft",
	"fx",
	"fv",
	"fg",
	"a",
	"q",
	"qt",
	"t",
	"T",
	"d",
	"w",
	"c",
	"z",
	"x",
	"v",
	"g",
] as const;

const COMPATIBILITY_KEYS: Record<string, string> = {
	ㄱ: "r",
	ㄲ: "R",
	ㄴ: "s",
	ㄷ: "e",
	ㄸ: "E",
	ㄹ: "f",
	ㅁ: "a",
	ㅂ: "q",
	ㅃ: "Q",
	ㅅ: "t",
	ㅆ: "T",
	ㅇ: "d",
	ㅈ: "w",
	ㅉ: "W",
	ㅊ: "c",
	ㅋ: "z",
	ㅌ: "x",
	ㅍ: "v",
	ㅎ: "g",
	ㅏ: "k",
	ㅐ: "o",
	ㅑ: "i",
	ㅒ: "O",
	ㅓ: "j",
	ㅔ: "p",
	ㅕ: "u",
	ㅖ: "P",
	ㅗ: "h",
	ㅘ: "hk",
	ㅙ: "ho",
	ㅚ: "hl",
	ㅛ: "y",
	ㅜ: "n",
	ㅝ: "nj",
	ㅞ: "np",
	ㅟ: "nl",
	ㅠ: "b",
	ㅡ: "m",
	ㅢ: "ml",
	ㅣ: "l",
};

export function hangulToDubeolsik(input: string): string {
	return Array.from(input).map(convertChar).join("");
}

function convertChar(char: string): string {
	const code = char.codePointAt(0);
	if (code === undefined) {
		return "";
	}

	if (code >= 0xac00 && code <= 0xd7a3) {
		const syllableIndex = code - 0xac00;
		const choseongIndex = Math.floor(syllableIndex / 588);
		const jungseongIndex = Math.floor((syllableIndex % 588) / 28);
		const jongseongIndex = syllableIndex % 28;

		return [
			CHOSEONG_KEYS[choseongIndex],
			JUNGSEONG_KEYS[jungseongIndex],
			JONGSEONG_KEYS[jongseongIndex],
		].join("");
	}

	if (code >= 0x3131 && code <= 0x318e) {
		const mapping = COMPATIBILITY_KEYS[char];
		if (mapping) {
			return mapping;
		}
	}

	return char;
}
