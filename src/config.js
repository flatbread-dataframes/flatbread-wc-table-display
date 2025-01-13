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

    // Nordic
    "sv-SE": "Swedish",
    "no-NO": "Norwegian",
    "da-DK": "Danish",
    "fi-FI": "Finnish",

    // Asia
    "zh-CN": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    "ja-JP": "Japanese",
    "ko-KR": "Korean",

    // Other major
    "ar-SA": "Arabic",
    "hi-IN": "Hindi",
    "ru-RU": "Russian",
    "pt-BR": "Portuguese (Brazil)",
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
