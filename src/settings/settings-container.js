import { SettingsTrigger } from "./settings-trigger.js"
import { SettingsPopup } from "./settings-popup.js"
import { FormatDialog } from "./format/format-dialog.js"

export class SettingsContainer extends HTMLElement {
    constructor(data, options) {
        super()
        this.attachShadow({ mode: "open" })
        this.data = data
        this.options = options

        this.handleTriggerClick = this.handleTriggerClick.bind(this)
        this.handleModalClose = this.handleModalClose.bind(this)
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
    }

    removeEventListeners() {
        this.trigger.removeEventListener("click", this.handleTriggerClick)
        this.shadowRoot.removeEventListener("modal-close", this.handleModalClose)
    }

    // MARK: get/set
    get trigger() {
        return this.shadowRoot.querySelector("settings-trigger")
    }

    get popup() {
        return this.shadowRoot.querySelector("settings-popup")
    }

    // MARK: handlers
    handleModalClose() {
        // Only close the container if the settings popup is being closed
        this.isVisible = false
        this.removeAttribute("open")
        this.popup?.remove()
    }

    handleTriggerClick(event) {
        event.stopPropagation()

        if (this.isVisible) {
            this.handleModalClose() // Use existing close handler
        } else {
            const settingsPopup = new SettingsPopup(this.data, this.options)
            settingsPopup.triggerElement = this.trigger
            this.shadowRoot.appendChild(settingsPopup)
            this.isVisible = true
            this.setAttribute("open", "")
        }
    }

    // MARK: render
    render() {
        const styles = `
            :host {
                position: absolute;
                display: inline-block;
                z-index: 1000;
            }

            settings-popup {
                position: fixed;
                width: max-content;
                margin-right: 0.5rem;
                z-index: 100;

                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease, visibility 0.2s ease;
                pointer-events: none;
            }

            :host([open]) settings-popup {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
            }
        `
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <settings-trigger></settings-trigger>
        `
    }
}

customElements.define("settings-container", SettingsContainer)
