export class SliderInput extends HTMLElement {
    static get observedAttributes() {
        return ["min", "max", "value", "label"]
    }

    constructor() {
        super()
        this.attachShadow({ mode: "open" })

        this.handleInput = this.handleInput.bind(this)
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
        this.input.addEventListener("input", this.handleInput)
    }

    removeEventListeners() {
        this.input.removeEventListener("input", this.handleInput)
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return
        if (name === "value") this.value = newValue
    }

    // MARK: get/set
    get input() {
        return this.shadowRoot.querySelector("input")
    }

    get readout() {
        return this.shadowRoot.querySelector("output")
    }

    get value() {
        return this.getAttribute("value")
    }

    set value(val) {
        if (this.input) this.input.value = val
        if (this.readout) this.readout.textContent = val
        this.setAttribute("value", val)
    }

    // MARK: handlers
    handleInput(event) {
        const value = event.target.value
        this.readout.textContent = value
        this.setAttribute("value", value)
        this.dispatchEvent(new Event("change", { bubbles: true }))
    }

    buildDatalist() {
        const min = parseInt(this.getAttribute("min") ?? 0)
        const max = parseInt(this.getAttribute("max") ?? 100)
        const range = max - min
        const step = Math.max(1, Math.floor(range / 10)) // Create ~10 markers

        const options = []
        for (let value = min; value <= max; value += step) {
            options.push(`<option value="${value}"></option>`)
        }
        // Always include max value if it's not already included
        if ((max - min) % step !== 0) {
            options.push(`<option value="${max}"></option>`)
        }

        return options.join("")
    }

    // MARK: render
    render() {
        const min = this.getAttribute("min") ?? 0
        const max = this.getAttribute("max") ?? 100
        const value = this.getAttribute("value") ?? min
        const label = this.getAttribute("label")

        const styles = `
            :host {
                display: grid;
                grid-template-columns: 1fr auto auto;
                align-items: center;
                gap: 0.5rem;
            }
            output {
                min-width: 2.5em;
                text-align: right;
            }
        `

        const labelHtml = label
            ? `<label for="slider">${label}</label>`
            : ""

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            ${labelHtml}
            <input
                type="range"
                id="slider"
                min="${min}"
                max="${max}"
                value="${value}"
                list="markers"
            >
            <output>${value}</output>
            <datalist id="markers">
                ${this.buildDatalist()}
            </datalist>
        `
    }
}

customElements.define("slider-input", SliderInput)
