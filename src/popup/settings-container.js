import { SettingsTrigger } from "./settings-trigger.js"
import { SettingsPopup } from "./settings-popup.js"

export class SettingsContainer extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: "open" })
        this.handleTriggerClick = this.handleTriggerClick.bind(this)
        this.handleDocumentClick = this.handleDocumentClick.bind(this)
        this.isVisible = false
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
    }

    removeEventListeners() {
        this.trigger.removeEventListener("click", this.handleTriggerClick)
        document.removeEventListener("click", this.handleDocumentClick)
    }

    // MARK: getter/setter
    get trigger() {
        return this.shadowRoot.querySelector("settings-trigger")
    }

    get popup() {
        return this.shadowRoot.querySelector("settings-popup")
    }

    // MARK: handlers
    syncState() {
        const dataViewer = this.getRootNode().host
        this.popup.syncState(dataViewer)
    }

    /**
     * Toggles visibility of settings popup when trigger is clicked
     *
     * If popup is visible, hides it and removes document click listener.
     * If popup is hidden, shows it and adds document click listener
     * to handle clicking outside.
     *
     * @param {Event} event - The click event from the trigger
     */
    handleTriggerClick() {
        this.isVisible = !this.isVisible
        if (this.isVisible) {
            this.syncState()
            this.setAttribute("open", "")
            this.positionPopup()
            document.addEventListener("click", this.handleDocumentClick)
        } else {
            this.removeAttribute("open")
            document.removeEventListener("click", this.handleDocumentClick)
        }
    }

    positionPopup() {
        const trigger = this.trigger.getBoundingClientRect()
        const popup = this.popup

        // Position to the left of the trigger button
        popup.style.top = `${trigger.top}px`
        popup.style.right = `${window.innerWidth - trigger.left + 8}px` // 8px offset
    }

    /**
     * Handles clicks on the document to determine if popup should close
     *
     * When popup is open, checks if click occurred outside both the trigger
     * and popup. If so, hides popup and removes document click listener.
     * Uses composedPath() to handle clicks through shadow DOM boundaries.
     *
     * @param {Event} event - The click event from the document
     */
    handleDocumentClick(event) {
        const path = event.composedPath()
        const isInside = path.includes(this)

        if (!isInside) {
            this.isVisible = false
            this.removeAttribute("open")
            document.removeEventListener("click", this.handleDocumentClick)
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
                top: 0;
                right: 100%;
                margin-right: 0.5rem;
                z-index: 100;

                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease, visibility 0.2s ease;
            }

            :host([open]) settings-popup {
                opacity: 1;
                visibility: visible;
            }
        `
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <settings-trigger></settings-trigger>
            <settings-popup></settings-popup>
        `
    }
}

customElements.define("settings-container", SettingsContainer)
