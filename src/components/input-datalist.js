export class InputDatalist extends HTMLElement {
    static get observedAttributes() {
        return ["name", "value", "options", "common-options"]
    }

    constructor() {
        super()
        this.attachShadow({ mode: "open" })
        this.handleChange = this.handleChange.bind(this)
        this.handleKeydown = this.handleKeydown.bind(this)
    }

    // MARK: setup
    connectedCallback() {
        this.render()
        this.addEventListeners()
        this.value = this.getAttribute("value") ?? this.defaultOption
    }

    disconnectedCallback() {
        this.removeEventListeners()
    }

    addEventListeners() {
        this.input.addEventListener("change", this.handleChange)
        this.input.addEventListener("keydown", this.handleKeydown)
    }

    removeEventListeners() {
        this.input.removeEventListener("change", this.handleChange)
        this.input.removeEventListener("keydown", this.handleKeydown)

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return

        if (name === "name") {
            this.input?.setAttribute("name", newValue ?? "")
        }
    }

    // MARK: get/set
    get name() {
        return this.getAttribute("name")
    }

    set name(val) {
        if (val) {
            this.setAttribute("name", val)
        } else {
            this.removeAttribute("name")
        }
    }

    get input() {
        return this.shadowRoot.querySelector("input")
    }

    get value() {
        return this.input.value
    }

    set value(val) {
        this.input.value = val
    }

    get options() {
        return this.getAttribute("options")?.split(";") ?? []
    }

    get commonOptions() {
        return this.getAttribute("common-options")?.split(";") ?? []
    }

    get defaultOption() {
        return this.commonOptions?.[0] ?? this.options?.[0]
    }

    get allOptions() {
        const common = this.commonOptions
        const all = this.options
        return [
            ...common,
            ...all.filter(code => !common.includes(code))
        ]
    }

    // MARK: handlers
    handleKeydown(event) {
        event.stopPropagation()
        if (event.key === "Escape") {
            this.clear()
        }
    }

    handleChange(event) {
        const inputValue = event.target.value
        const matchingOption = this.findMatchingOption(inputValue)

        if (matchingOption) {
            this.value = matchingOption
        } else {
            this.value = this.getAttribute("value") ?? this.defaultOption
        }
        this.dispatchEvent(new Event("change", { bubbles: true }))
    }

    // MARK: api
    findMatchingOption(value) {
        if (!value) return null

        const searchValue = value.toLowerCase()
        const options = this.allOptions

        // Try exact match first (case insensitive)
        const exactMatch = options.find(opt =>
            opt.toLowerCase() === searchValue
        )
        if (exactMatch) return exactMatch

        // Try starts with
        const startsWithMatch = options.find(opt =>
            opt.toLowerCase().startsWith(searchValue)
        )
        if (startsWithMatch) return startsWithMatch

        // Try includes
        const includesMatch = options.find(opt =>
            opt.toLowerCase().includes(searchValue)
        )
        if (includesMatch) return includesMatch

        return null
    }

    clear() {
        this.value = ""
        this.input.focus()
    }

    // MARK: render
    render() {
        const styles = `
            *,
            *::before,
            *::after {
                box-sizing: border-box
            }
            input {
                width: 100%;
                padding: 0.25rem
            }`

        const optionsHtml = this.allOptions
            .map(code => `<option value="${code}">`)
            .join("")

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <input list="list" type="text">
            <datalist id="list">${optionsHtml}</datalist>`
    }
}

customElements.define("flatbread-table-input-datalist", InputDatalist)
