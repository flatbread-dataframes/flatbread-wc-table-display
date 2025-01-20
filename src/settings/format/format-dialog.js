import { ModalElement } from "../../components/modal-element.js"
import { FormatBuilder } from "./format-builder.js"
import { getFormatSpec } from "./format-specs.js"

export class FormatDialog extends ModalElement {
    constructor(state) {
        super()
        const { dtype, columnName, formatOptions, columnIndex } = state

        this.dtype = dtype ?? null
        this.columnName = columnName ?? ""
        this.currentOptions = formatOptions ?? {}
        this.columnIndex = columnIndex ?? null

        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleChange = this.handleChange.bind(this)
        this.handleApply = this.handleApply.bind(this)
        this.handleCancel = this.handleCancel.bind(this)
    }

    // MARK: setup
    connectedCallback() {
        super.connectedCallback()
        this.addEventListeners()
    }

    addEventListeners() {
        const form = this.form
        form.addEventListener("submit", this.handleSubmit)
        form.addEventListener("change", this.handleChange)

        const applyBtn = this.shadowRoot.querySelector("[data-action='apply']")
        const cancelBtn = this.shadowRoot.querySelector("[data-action='cancel']")
        applyBtn?.addEventListener("click", this.handleApply)
        cancelBtn?.addEventListener("click", this.handleCancel)
    }

    // MARK: get/set
    get spec() {
        return getFormatSpec(this.dtype)
    }

    get form() {
        return this.shadowRoot.querySelector("form")
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
                columnIndex: this.columnIndex,
                dtype: this.dtype,
            }
        }))
        this.handleClose()
    }

    handleCancel() {
        this.handleClose()
    }

    // MARK: api
    updateDependentFieldsets() {
        this.form.querySelectorAll("[data-dependent]")
            .forEach(group => group.classList.remove("active"))

        this.form.querySelectorAll("[data-group-target]:checked")
            .forEach(option => {
                const fieldset = this.form.querySelector(`[data-group="${option.dataset.groupTarget}"]`)
                fieldset?.classList.add("active")
            })
    }

    getFormData() {
        const formData = {}
        const selector = `
            fieldset:where(:not([data-dependent]),
            [data-dependent].active) :where(input, select, input-datalist)
        `

        this.shadowRoot.querySelectorAll(selector).forEach(input => {
            if (!input.name) return

            let value
            if (input.tagName.toLowerCase() === "input-datalist") {
                value = input.value === "" || input.value === "none"
                    ? undefined
                    : input.value
            } else if (input.type === "checkbox") {
                value = input.checked
            } else if (input.type === "number") {
                value = input.value !== "" ? Number(input.value) : null
            } else {
                value = input.value === "" || input.value === "none"
                    ? undefined
                    : input.value
            }

            if (value !== null) {
                formData[input.name] = value
            }
        })

        return formData
    }

    // MARK: render
    getStyles() {
        return `
            ${this.getBaseStyles()}
            form {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            label {
                display: grid;
                grid-template-columns: 1fr 1fr;
                align-items: center;
                gap: 0.5rem;
                &:has([type="checkbox"]) {
                    display: flex;
                }
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
    }

    buildContent() {
        const formContent = !this.dtype || !this.spec
            ? "No format options available for this type"
            : new FormatBuilder(this.spec, this.currentOptions).buildFormControls()

        return `
            <style>${this.getStyles()}</style>
            ${this.buildHeader(`Format Settings: ${this.columnName}`)}
            <form>
                <div class="form-content">
                    ${formContent}
                </div>
                <div class="actions">
                    <button type="button" data-action="apply">Apply</button>
                    <button type="button" data-action="cancel">Cancel</button>
                </div>
            </form>
        `
    }

    render() {
        super.render()
        this.updateDependentFieldsets()
    }
}

customElements.define("format-dialog", FormatDialog)
