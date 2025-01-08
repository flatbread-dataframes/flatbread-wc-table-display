export class SettingsPopup extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: "open" })
        this.handleInputChange = this.handleInputChange.bind(this)
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
    }

    removeEventListeners() {}

    // MARK: api
    syncState(dataViewer) {
        // Get all current attribute values from dataViewer
        const inputs = this.shadowRoot.querySelectorAll("input")
        inputs.forEach(input => {
            const attr = input.id
            if (input.type === "number") {
                input.value = dataViewer.getAttribute(attr) || 0
            } else {
                input.checked = dataViewer.hasAttribute(attr)
            }
        })
    }

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

    // MARK: render
    render() {
        const styles = `
            <style>
                :host {
                    background: var(--background-color, white);
                    border: 1px solid var(--border-color, currentColor);
                    border-radius: 4px;
                    padding: 1rem;
                }
                div {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                input[type="number"] {
                    width: 3rem;
                }
            </style>
        `
        this.shadowRoot.innerHTML = `
            ${styles}
            <div>
                <label for="section-levels">Section levels</label>
                <input type="number" id="section-levels" min="0" value="0">
            </div>
            <div>
                <input type="checkbox" id="hide-column-borders">
                <label for="hide-column-borders">Hide column borders</label>
            </div>
            <div>
                <input type="checkbox" id="hide-row-borders">
                <label for="hide-row-borders">Hide row borders</label>
            </div>
            <div>
                <input type="checkbox" id="hide-index-border">
                <label for="hide-index-border">Hide index border</label>
            </div>
            <div>
                <input type="checkbox" id="hide-thead-border">
                <label for="hide-thead-border">Hide thead border</label>
            </div>
            <div>
                <input type="checkbox" id="show-hover">
                <label for="show-hover">Show hover effect</label>
            </div>
            <div>
                <input type="checkbox" id="collapse-columns">
                <label for="collapse-columns">Collapse columns</label>
            </div>
        `
    }
}

customElements.define("settings-popup", SettingsPopup)
