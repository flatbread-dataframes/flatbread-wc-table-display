export const BREAKPOINTS = {
    POPUP_MOBILE: "500px"  // or MODAL_MOBILE, MODAL_VIEWPORT
}

export const MEDIA_QUERIES = {
    POPUP_MOBILE: window.matchMedia(`(min-width: ${BREAKPOINTS.POPUP_MOBILE})`),
}

export const COMMON_LOCALES = {
    // Western Europe
    "en-GB": "English (UK)",
    "en-US": "English (US)",
    "nl-NL": "Dutch",
    "de-DE": "German",
    "fr-FR": "French",
    "es-ES": "Spanish",
    "it-IT": "Italian",
    "pt-PT": "Portuguese",

    // Nordic
    "sv-SE": "Swedish",
    "no-NO": "Norwegian",
    "da-DK": "Danish",
    "fi-FI": "Finnish",

    // Eastern Europe
    "ru-RU": "Russian",
    "pl-PL": "Polish",
    "tr-TR": "Turkish",

    // Middle East
    "ar-SA": "Arabic (Saudi Arabia)",
    "he-IL": "Hebrew",
    "fa-IR": "Persian",

    // Asia Pacific
    "zh-CN": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    "ja-JP": "Japanese",
    "ko-KR": "Korean",
    "hi-IN": "Hindi",
    "bn-IN": "Bengali",
    "th-TH": "Thai",
    "vi-VN": "Vietnamese",
    "id-ID": "Indonesian",

    // Americas
    "pt-BR": "Portuguese (Brazil)",
    "es-MX": "Spanish (Mexico)",
    "es-AR": "Spanish (Argentina)",

    // Oceania
    "en-AU": "English (Australia)",
    "en-NZ": "English (New Zealand)"
}

// Most commonly used locales for easy access
export const PREFERRED_LOCALES = [
    "en-US",
    "en-GB",
    "nl-NL",
    "de-DE",
    "fr-FR",
]

export const PREFERRED_CURRENCIES = [
    "EUR",
    "USD",
    "GBP",
    "CNY",
    "JPY",
    "SEK",
    "NOK",
]
