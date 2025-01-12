import { ModalElement } from "./modal-element.js"
import { FormatTable } from "./format/format-table.js"

export class SettingsPopup extends ModalElement {
    constructor(data, options) {
        super()
        this.data = data
        this.options = options

        this.handleInputChange = this.handleInputChange.bind(this)
        this.handleTabClick = this.handleTabClick.bind(this)
    }

    // MARK: setup
    connectedCallback() {
        super.connectedCallback()
        this.addEventListeners()
    }

    addEventListeners() {
        this.shadowRoot.addEventListener("change", this.handleInputChange)
        this.shadowRoot.addEventListener("click", this.handleTabClick)
    }

    // MARK: handlers
    handleInputChange(event) {
        const input = event.target
        this.dispatchEvent(new CustomEvent("setting-change", {
            bubbles: true,
            composed: true,
            detail: {
                setting: input.id,
                value: ["number", "text"].includes(input.type) ? input.value : input.checked
            }
        }))
    }

    handleTabClick(event) {
        const tab = event.target.closest("[role=tab]")
        if (!tab) return

        const tabs = this.shadowRoot.querySelectorAll("[role=tab]")
        const panels = this.shadowRoot.querySelectorAll("[role=tabpanel]")

        tabs.forEach(tab => tab.setAttribute("aria-selected", "false"))
        panels.forEach(panel => panel.removeAttribute("selected"))

        tab.setAttribute("aria-selected", "true")
        const panel = this.shadowRoot.querySelector(`#${tab.getAttribute("aria-controls")}`)
        panel.setAttribute("selected", "")
    }

    // MARK: api
    position() {
        if (!window.matchMedia("(min-width: 769px)").matches) return
        if (!this.triggerElement) return

        const trigger = this.triggerElement.getBoundingClientRect()
        if (window.matchMedia("(min-width: 769px)").matches) {
            // Position left edge of popup so its right edge aligns with trigger
            this.style.top = `${trigger.top}px`
            this.style.left = `${trigger.left - this.offsetWidth - 8}px`
        }
    }

    // MARK: render
    getComponentStyles() {
        return `
            nav {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 1rem;
                border-bottom: 1px solid var(--border-color, currentColor);
            }

            [role="tab"] {
                padding: 0.5rem 1rem;
                border: none;
                background: none;
                color: inherit;
                cursor: pointer;
                border-bottom: 2px solid transparent;
                margin-bottom: -1px;
            }

            [role="tab"][aria-selected="true"] {
                border-bottom-color: currentColor;
            }

            [role="tabpanel"] {
                visibility: hidden;
                grid-column: 1;
                grid-row: 3;
                overflow-x: auto;
            }
            [role="tabpanel"][selected] {
                visibility: visible;
            }

            label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
            }
            input[type="number"] {
                width: 3rem;
            }
        `
    }

    buildContent() {
        return `
            ${this.buildHeader("Settings")}
            <nav role="tablist">
                <button role="tab"
                    aria-selected="true"
                    aria-controls="general">General</button>
                <button role="tab"
                    aria-selected="false"
                    aria-controls="format">Format</button>
            </nav>

            <section role="tabpanel" id="general" selected>
                <label for="section-levels">
                    Section levels
                    <input type="number" id="section-levels" min="0" value="${this.options.styling.sectionLevels}">
                </label>
                <label for="na-rep">
                    Na rep
                    <input type="text" id="na-rep" value="${this.options.naRep}">
                </label>
                <label for="hide-column-borders">
                    <input type="checkbox" id="hide-column-borders" ${!this.options.styling.columnBorders ? "checked" : ""}>
                    Hide column borders
                </label>
                <label for="hide-row-borders">
                    <input type="checkbox" id="hide-row-borders" ${!this.options.styling.rowBorders ? "checked" : ""}>
                    Hide row borders
                </label>
                <label for="hide-index-border">
                    <input type="checkbox" id="hide-index-border" ${!this.options.styling.indexBorder ? "checked" : ""}>
                    Hide index border
                </label>
                <label for="hide-thead-border">
                    <input type="checkbox" id="hide-thead-border" ${!this.options.styling.theadBorder ? "checked" : ""}>
                    Hide thead border
                </label>
                <label for="show-hover">
                    <input type="checkbox" id="show-hover" ${this.options.styling.showHover ? "checked" : ""}>
                    Show hover effect
                </label>
                <label for="collapse-columns">
                    <input type="checkbox" id="collapse-columns" ${this.options.styling.collapseColumns ? "checked" : ""}>
                    Collapse columns
                </label>
            </section>

            <section role="tabpanel" id="format"></section>`
    }

    render() {
        super.render()
        const formatTable = new FormatTable(this.data)
        this.shadowRoot.getElementById("format").appendChild(formatTable)
    }
}

customElements.define("settings-popup", SettingsPopup)
