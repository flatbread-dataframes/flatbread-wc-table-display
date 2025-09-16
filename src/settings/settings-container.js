import "./settings-trigger.js"
import { SettingsPopup } from "./settings-popup.js"
import { BREAKPOINTS } from "../config.js"

export class SettingsContainer extends HTMLElement {
    constructor(options) {
        super()
        this.attachShadow({ mode: "open" })
        this.options = options
        this.data = null
        this.state = {
            selectedTab: null,
        }

        this.handleTriggerClick = this.handleTriggerClick.bind(this)
        this.handleModalClose = this.handleModalClose.bind(this)
        this.handleTabSelect = this.handleTabSelect.bind(this)
    }

    // MARK: setup
    connectedCallback() {
        this.render()
        this.addEventListeners()
    }

    disconnectedCallback() {
        this.removeEventListeners()
    }

    addEventListeners() {
        this.trigger.addEventListener("click", this.handleTriggerClick)
        this.shadowRoot.addEventListener("modal-close", this.handleModalClose)
        this.shadowRoot.addEventListener("select-tab", this.handleTabSelect)
    }

    removeEventListeners() {
        this.trigger.removeEventListener("click", this.handleTriggerClick)
        this.shadowRoot.removeEventListener("modal-close", this.handleModalClose)
    }

    // MARK: get/set
    get trigger() {
        return this.shadowRoot.querySelector("flatbread-table-settings-trigger")
    }

    get popup() {
        return this.shadowRoot.querySelector("flatbread-table-settings-popup")
    }

    // MARK: handlers
    handleModalClose() {
        this.isVisible = false
        this.removeAttribute("open")
        this.popup?.remove()
    }

    handleTriggerClick(event) {
        event.stopPropagation()

        if (this.isVisible) {
            this.handleModalClose()
        } else {
            const settingsPopup = new SettingsPopup(this.data, this.options, this.state)
            settingsPopup.triggerElement = this.trigger
            this.shadowRoot.appendChild(settingsPopup)
            this.isVisible = true
            this.setAttribute("open", "")
        }
    }

    handleTabSelect(event) {
        this.state.selectedTab = event.detail.selectedTab
    }

    // MARK: render
    render() {
        const styles = `
            *,
            *::before,
            *::after {
                box-sizing: border-box
            }
            :host {
                position: absolute;
                display: inline-block;
                z-index: 1000;
            }

            flatbread-table-settings-popup {
                position: fixed;
                width: max-content;
                margin-right: 0.5rem;
                z-index: 100;

                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease, visibility 0.2s ease;
                pointer-events: none;

                @media (max-width: ${BREAKPOINTS.POPUP_MOBILE}) {
                    width: auto;
                }
            }

            :host([open]) flatbread-table-settings-popup {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
            }
        `
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <flatbread-table-settings-trigger></flatbread-table-settings-trigger>
        `
    }
}

customElements.define("flatbread-table-settings-container", SettingsContainer)
