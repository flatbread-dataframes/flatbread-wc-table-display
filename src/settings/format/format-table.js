import { FormatDialog } from "./format-dialog.js"
import { getFormatSpec } from "./format-specs.js"
import { getPresetsForType, isCustomFormat, matchPreset } from "./format-presets.js"

export class FormatTable extends HTMLElement {
    constructor(data) {
        super()
        this.attachShadow({ mode: "open" })
        this.data = data

        this.handleEditClick = this.handleEditClick.bind(this)
        this.handlePresetChange = this.handlePresetChange.bind(this)
        this.handleDialogOpen = this.handleDialogOpen.bind(this)
        this.handleDialogClose = this.handleDialogClose.bind(this)
        this.handleDialogFormatApply = this.handleDialogFormatApply.bind(this)

        this.hasOpenDialog = false
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
        this.shadowRoot.addEventListener("click", this.handleEditClick)
        this.shadowRoot.addEventListener("change", this.handlePresetChange)
    }

    removeEventListeners() {
        this.shadowRoot.removeEventListener("click", this.handleEditClick)
        this.shadowRoot.removeEventListener("change", this.handlePresetChange)
    }

    // MARK: get/set
    get tbody() {
        return this.shadowRoot.querySelector("tbody")
    }

    get dialog() {
        return this.shadowRoot.querySelector("format-dialog")
    }

    // MARK: handlers
    handleEditClick(event) {
        const editButton = event.target.closest("button[data-action='edit']")
        if (!editButton || this.hasOpenDialog) return

        const row = editButton.closest("tr")
        const columnIndex = parseInt(row.dataset.columnIndex)
        this.openDialog(columnIndex)
    }

    handlePresetChange(event) {
        if (!event.target.matches("[data-action='preset']")) return

        const select = event.target
        const row = select.closest("tr")
        const columnIndex = parseInt(row.dataset.columnIndex)
        const presetKey = select.value

        if (!presetKey) return // "Custom" selected

        const attrs = this.data.columns.attrs[columnIndex]
        const presets = getPresetsForType(attrs.dtype)
        const preset = presets[presetKey]

        if (preset) {
            const currentFormatOptions = [...(this.data.formatOptions ?? [])]
            currentFormatOptions[columnIndex] = preset.options
            this.data.formatOptions = currentFormatOptions
        }
    }

    handleDialogOpen() {
        this.hasOpenDialog = true
        this.dispatchEvent(new CustomEvent("dialog-open", {
            bubbles: true,
            composed: true
        }))
    }

    handleDialogClose() {
        this.hasOpenDialog = false
        this.dialog?.remove()
    }

    handleDialogFormatApply(event) {
        const { formatOptions, columnIndex } = event.detail
        const currentFormatOptions = [...(this.data.formatOptions ?? [])]
        currentFormatOptions[columnIndex] = formatOptions
        this.data.formatOptions = currentFormatOptions
        this.update()
    }

    // MARK: api
    openDialog(columnIndex) {
        const column = this.data.columns.values[columnIndex]
        const attrs = this.data.columns.attrs[columnIndex]
        const columnName = Array.isArray(column) ? column.at(-1) : column

        const dialog = document.createElement("format-dialog")
        dialog.columnIndex = columnIndex
        dialog.columnName = columnName
        dialog.dataType = attrs.dtype
        dialog.currentOptions = attrs.formatOptions ?? {}

        dialog.addEventListener("dialog-close", this.handleDialogClose)
        dialog.addEventListener("dialog-open", this.handleDialogOpen)
        dialog.addEventListener("format-apply", this.handleDialogFormatApply)

        this.shadowRoot.appendChild(dialog)
        this.handleDialogOpen()
    }

    getFormatSummary(options, dtype) {
        if (!options) return "-"

        const spec = getFormatSpec(dtype)
        if (!spec) return "-"

        const summaries = Object.entries(options)
            .map(([key, value]) => {
                const optionSpec = this.getSpecForOption(key, spec)
                return optionSpec?.summary?.(value)
            })
            .filter(Boolean)

        return summaries.length ? summaries.join(", ") : "-"
    }

    getSpecForOption(key, spec) {
        for (const group of Object.values(spec.options)) {
            if (key in group) return group[key]
        }
        return null
    }

    // MARK: render
    render() {
        const styles = `
            :host {
                display: block;
            }

            table {
                width: 100%;
                border-collapse: collapse;
            }

            th, td {
                text-align: left;
                padding: 0.5rem;
                border-bottom: 1px solid var(--border-color, currentColor);
            }

            button {
                padding: 0.25rem 0.5rem;
                cursor: pointer;
            }
        `

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Format</th>
                        <th>Preset</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `
        this.update()
    }

    update() {
        if (!this.tbody) return

        this.tbody.innerHTML = this.data.columns.values
            .map((col, idx) => this.buildRow(col, idx))
            .join("")
    }

    buildRow(col, idx) {
        const attrs = this.data.columns.attrs[idx]
        const presets = getPresetsForType(attrs.dtype)
        const isCustom = isCustomFormat(attrs.formatOptions, presets)
        const currentPreset = matchPreset(attrs.formatOptions, presets)

        const presetOptions = Object.entries(presets)
            .map(([key, preset]) => {
                const selected = key === currentPreset ? "selected" : ""
                return `<option value="${key}" ${selected}>${preset.label}</option>`
            })
            .join("")

        return `
            <tr data-column-index="${idx}">
                <td>${Array.isArray(col) ? col.at(-1) : col}</td>
                <td>${attrs.dtype ?? "-"}</td>
                <td>${this.getFormatSummary(attrs.formatOptions, attrs.dtype)}</td>
                <td>
                    <select data-action="preset">
                        <option value="" disabled ${isCustom ? "selected" : ""}>Custom</option>
                        ${presetOptions}
                    </select>
                </td>
                <td>
                    <button data-action="edit">Edit</button>
                </td>
            </tr>
        `
    }
}

customElements.define("format-table", FormatTable)
