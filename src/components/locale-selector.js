import { InputDatalist } from "./input-datalist.js"
import { COMMON_LOCALES, PREFERRED_LOCALES } from "../config.js"

export class LocaleSelector extends HTMLElement {
    static get observedAttributes() {
        return ["name", "value"]
    }

    constructor() {
        super()
        this.attachShadow({ mode: "open" })
        this.handleLocaleChange = this.handleLocaleChange.bind(this)
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
        this.input.addEventListener("change", this.handleLocaleChange)
    }

    removeEventListeners() {
        this.input.removeEventListener("change", this.handleLocaleChange)
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return

        if (name === "value") {
            this.value = newValue
            this.updateLocaleDisplay()
        }
        if (name === "name") {
            this.input?.setAttribute("name", newValue ?? "")
        }
    }

    // MARK: get/set
    get input() {
        return this.shadowRoot.querySelector("input-datalist")
    }

    get display() {
        return this.shadowRoot.querySelector(".locale-display")
    }

    get value() {
        return this.input?.value
    }

    set value(val) {
        if (this.input) {
            this.input.value = val
            this.updateLocaleDisplay()
        }
    }

    // MARK: handlers
    handleLocaleChange() {
        this.updateLocaleDisplay()
        this.dispatchEvent(new Event("change", { bubbles: true }))
    }

    // MARK: api
    updateLocaleDisplay() {
        if (this.display) {
            this.display.textContent = COMMON_LOCALES[this.value] ?? this.value
        }
    }

    // MARK: render
    render() {
        const styles = `
            *,
            *::before,
            *::after {
                box-sizing: border-box;
            }
            :host {
                display: grid;
                grid-template-columns: 4rem 1fr;
                align-items: center;
                gap: 1rem;
            }
            .locale-display {
                font-size: 0.9em;
                opacity: 0.8;
            }`

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <input-datalist
                name="${this.getAttribute("name") ?? ""}"
                value="${this.getAttribute("value") ?? ""}"
                common-options="${PREFERRED_LOCALES.join(";")}"
                options="${Object.keys(COMMON_LOCALES).join(";")}"
            ></input-datalist>
            <div class="locale-display"></div>
        `
        this.updateLocaleDisplay()
    }
}

customElements.define("locale-selector", LocaleSelector)
