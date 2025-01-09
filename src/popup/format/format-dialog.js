import { FormatBuilder } from "./format-builder.js"
import { NumberFormatSpec, DateFormatSpec } from "./format-specs.js"

export class FormatDialog extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: "open" })
        this.dataType = null
        this.columnName = ""
        this.currentOptions = {}

        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleChange = this.handleChange.bind(this)
        this.handleApply = this.handleApply.bind(this)
        this.handleCancel = this.handleCancel.bind(this)
    }

    // MARK: setup
    connectedCallback() {
        this.render()
        this.addEventListeners()
    }

    addEventListeners() {
        const form = this.shadowRoot.querySelector("form")
        form.addEventListener("submit", this.handleSubmit)
        form.addEventListener("change", this.handleChange)

        const applyBtn = this.shadowRoot.querySelector("[data-action='apply']")
        const cancelBtn = this.shadowRoot.querySelector("[data-action='cancel']")
        applyBtn?.addEventListener("click", this.handleApply)
        cancelBtn?.addEventListener("click", this.handleCancel)
    }

    // MARK: get/set
    get spec() {
        const specs = {
            float: NumberFormatSpec,
            int: NumberFormatSpec,
            datetime: DateFormatSpec,
            // Additional specs will be added here
        }
        return specs[this.dataType]
    }

    get form() {
        return this.shadowRoot.querySelector("form")
    }

    // MARK: api
    updateDependentFieldsets() {
        // Reset all dependent fieldsets to hidden
        this.form.querySelectorAll("[data-dependent]")
            .forEach(group => group.classList.remove("active"))

        // Show fieldsets for any selected options with targets
        this.form.querySelectorAll("[data-group-target]:checked")
            .forEach(option => {
                const fieldset = this.form.querySelector(`[data-group="${option.dataset.groupTarget}"]`)
                fieldset?.classList.add("active")
            })
    }

    getFormData() {
        const formData = {}
        const selector = "fieldset:where(:not([data-dependent]), [data-dependent].active) :where(input, select)"

        this.shadowRoot.querySelectorAll(selector).forEach(input => {
            let value
            if (input.type === "checkbox") {
                value = input.checked
            } else if (input.type === "number") {
                value = input.value ? Number(input.value) : null
            } else {
                value = input.value === "" || input.value === "none" ? undefined : input.value
            }

            if (value !== null) {
                formData[input.name] = value
            }
        })

        return formData
    }

    // MARK: handlers
    handleSubmit(event) {
        event.preventDefault()
    }

    handleChange(event) {
        if (!event.target.matches("select")) return
        this.updateDependentFieldsets()
    }

    handleApply() {
        const formData = this.getFormData()
        this.dispatchEvent(new CustomEvent("format-apply", {
            bubbles: true,
            composed: true,
            detail: {
                formatOptions: formData,
                columnIndex: this.columnIndex
            }
        }))

        this.dispatchEvent(new CustomEvent("dialog-close", {
            bubbles: true,
            composed: true
        }))
        this.remove()
    }

    handleCancel() {
        this.dispatchEvent(new CustomEvent("dialog-close", {
            bubbles: true,
            composed: true
        }))
        this.remove()
    }

    // MARK: render
    render() {
        const styles = `
            :host {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--background-color, white);
                border: 1px solid var(--border-color, currentColor);
                border-radius: 4px;
                padding: 1rem;
                min-width: 300px;
                z-index: 1001;
            }

            h3 {
                margin-top: 0;
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid var(--border-color, currentColor);
            }

            form {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            select, input[type="number"] {
                padding: 0.25rem;
            }

            .actions {
                display: flex;
                justify-content: flex-end;
                gap: 0.5rem;
                margin-top: 1rem;
            }

            button {
                padding: 0.5rem 1rem;
                cursor: pointer;
            }

            [data-dependent] {
                display: none;
            }

            [data-dependent].active {
                display: block;
            }
        `

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <h3>Format Settings: ${this.columnName}</h3>
            <form>
                <div class="form-content">
                    ${this.buildFormContent()}
                </div>
                <div class="actions">
                    <button type="button" data-action="apply">Apply</button>
                    <button type="button" data-action="cancel">Cancel</button>
                </div>
            </form>
        `
        this.updateDependentFieldsets()
    }

    buildFormContent() {
        if (!this.dataType || !this.spec) {
            return "No format options available for this type"
        }

        const builder = new FormatBuilder(this.spec, this.currentOptions)
        return builder.buildFormControls()
    }
}

customElements.define("format-dialog", FormatDialog)
