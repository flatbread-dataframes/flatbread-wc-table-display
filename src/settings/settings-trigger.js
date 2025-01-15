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
            button {
                display: grid;
                place-items: center;
                width: 1.75rem;
                height: 1.75rem;
                border: 1px solid var(--border-color, currentColor);
                border-radius: 50%;
                background-color: var(--background-color, var(--surface-color));
                cursor: pointer;
                font-size: .925rem;
                line-height: 1;
                font-family: sans-serif;
                color: currentColor;
            }
        `
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <button title="settings">•••</button>
        `
    }
}

customElements.define("settings-trigger", SettingsTrigger)
