export class SettingsTrigger extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: "open" })
    }

    // MARK: setup
    connectedCallback() {
        this.render()
        this.addEventListeners()
    }

    disconnectedCallback() {
        this.removeEventListeners()
    }

    addEventListeners() {}

    removeEventListeners() {}

    // MARK: render
    render() {
        const styles = `
            <style>
                button {
                    display: grid;
                    place-items: center;
                    width: 1.75rem;
                    height: 1.75rem;
                    border: 1px solid var(--border-color, currentColor);
                    border-radius: 50%;
                    background: var(--background-color, transparent);
                    cursor: pointer;
                    font-size: .925rem;
                    line-height: 1;
                    font-family: sans-serif;
                }
            </style>
        `
        this.shadowRoot.innerHTML = `
            ${styles}
            <button title="settings">•••</button>
        `
    }
}

customElements.define("settings-trigger", SettingsTrigger)
