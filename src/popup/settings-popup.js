import { FormatTable } from "./format/format-table.js"

export class SettingsPopup extends HTMLElement {
    constructor(data) {
        super()
        this.attachShadow({ mode: "open" })
        this.data = data

        this.handleInputChange = this.handleInputChange.bind(this)
        this.handleTabClick = this.handleTabClick.bind(this)
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
        this.shadowRoot.addEventListener("change", this.handleInputChange.bind(this))
        this.shadowRoot.addEventListener("click", this.handleTabClick)
    }

    removeEventListeners() {}

    // MARK: handlers
    handleInputChange(event) {
        const input = event.target
        this.dispatchEvent(new CustomEvent("setting-change", {
            bubbles: true,
            composed: true,
            detail: {
                setting: input.id,
                value: input.type === "number" ? input.value : input.checked
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

    // MARK: render
    render() {
        const styles = `
            :host {
                display: grid;
                background: var(--background-color, white);
                border: 1px solid var(--border-color, currentColor);
                border-radius: 4px;
                padding: 1rem;
            }

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
                grid-row: 2;
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
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
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
                    <input type="number" id="section-levels" min="0" value="0">
                </label>
                <label for="hide-column-borders">
                    <input type="checkbox" id="hide-column-borders">
                    Hide column borders
                </label>
                <label for="hide-row-borders">
                    <input type="checkbox" id="hide-row-borders">
                    Hide row borders
                </label>
                <label for="hide-index-border">
                    <input type="checkbox" id="hide-index-border">
                    Hide index border
                </label>
                <label for="hide-thead-border">
                    <input type="checkbox" id="hide-thead-border">
                    Hide thead border
                </label>
                <label for="show-hover">
                    <input type="checkbox" id="show-hover">
                    Show hover effect
                </label>
                <label for="collapse-columns">
                    <input type="checkbox" id="collapse-columns">
                    Collapse columns
                </label>
            </section>

            <section role="tabpanel" id="format"></section>
        `
        const formatTable = new FormatTable(this.data)
        this.shadowRoot.getElementById("format").appendChild(formatTable)
    }
}

customElements.define("settings-popup", SettingsPopup)
