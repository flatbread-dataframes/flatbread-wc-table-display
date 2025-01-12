export const BREAKPOINTS = {
    POPUP_MOBILE: "500px"  // or MODAL_MOBILE, MODAL_VIEWPORT
}


export const MEDIA_QUERIES = {
    POPUP_MOBILE: window.matchMedia(`(min-width: ${BREAKPOINTS.POPUP_MOBILE})`),
}
