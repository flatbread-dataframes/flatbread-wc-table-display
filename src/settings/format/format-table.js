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
        this.handleDtypeChange = this.handleDtypeChange.bind(this)

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
        this.shadowRoot.addEventListener("change", this.handleDtypeChange)

        this.shadowRoot.addEventListener("modal-open", this.handleDialogOpen)
        this.shadowRoot.addEventListener("modal-close", this.handleDialogClose)
        this.shadowRoot.addEventListener("format-apply", this.handleDialogFormatApply)
    }

    removeEventListeners() {
        this.shadowRoot.removeEventListener("click", this.handleEditClick)
        this.shadowRoot.removeEventListener("change", this.handlePresetChange)
        this.shadowRoot.removeEventListener("change", this.handleDtypeChange)

        this.shadowRoot.removeEventListener("modal-open", this.handleDialogOpen)
        this.shadowRoot.removeEventListener("modal-close", this.handleDialogClose)
        this.shadowRoot.removeEventListener("format-apply", this.handleDialogFormatApply)
    }

    // MARK: get/set
    get tbody() {
        return this.shadowRoot.querySelector("tbody")
    }

    get dialog() {
        return this.shadowRoot.querySelector("format-dialog")
    }

    get selectedDtype() {
        return this.shadowRoot.querySelector("[data-action='select-dtype']").value
    }

    // MARK: handlers
    handleEditClick(event) {
        const button = event.target
        if (!button.matches("button[data-action|='edit']") || this.hasOpenDialog) return

        event.stopPropagation()

        if (button.matches("[data-action='edit-dtype']")) {
            if (this.selectedDtype) { this.openDtypeDialog(this.selectedDtype) }
        } else {
            const row = button.closest("tr")
            const columnIndex = parseInt(row.dataset.columnIndex)
            this.openColumnDialog(columnIndex)
        }
    }

    handlePresetChange(event) {
        const select = event.target
        if (!select.matches("[data-action^='preset']")) return

        const presetKey = select.value
        if (!presetKey) return

        if (select.matches("[data-action='preset-dtype']")) {
            const dtype = this.shadowRoot.querySelector("[data-action='select-dtype']").value
            this.applyDtypePreset(dtype, presetKey)
        } else {
            const row = select.closest("tr")
            const columnIndex = parseInt(row.dataset.columnIndex)
            this.applyColumnPreset(columnIndex, presetKey)
        }
    }

    handleDtypeChange(event) {
        const select = event.target
        if (!select.matches("[data-action='select-dtype']")) return

        const dtype = select.value
        const presetSelect = this.shadowRoot.querySelector("[data-action='preset-dtype']")
        const presets = getPresetsForType(dtype)

        presetSelect.innerHTML = Object.entries(presets)
            .map(([key, preset]) =>
                `<option value="${key}">${preset.label}</option>`
            ).join("")
    }

    handleDialogOpen() {
        this.hasOpenDialog = true
    }

    handleDialogClose(event) {
        event.stopPropagation()
        this.hasOpenDialog = false
    }

    handleDialogFormatApply(event) {
        const { formatOptions, columnIndex, dtype } = event.detail
        const currentFormatOptions = [...(this.data.formatOptions ?? [])]

        if (dtype) {
            this.data.columns.attrs.forEach((attr, idx) => {
                if (attr.dtype === dtype) {
                    currentFormatOptions[idx] = formatOptions
                }
            })
        } else if (columnIndex !== undefined) {
            currentFormatOptions[columnIndex] = formatOptions
        }

        this.data.formatOptions = currentFormatOptions
        this.update()
    }

    // MARK: api
    openColumnDialog(columnIndex) {
        const { dtype, formatOptions } = this.data.columns.attrs[columnIndex]
        const column = this.data.columns.values[columnIndex]
        const columnName = Array.isArray(column) ? column.at(-1) : column

        const state = { columnIndex, columnName, dtype, formatOptions }
        const dialog = new FormatDialog(state)
        dialog.triggerElement = this.shadowRoot.querySelector(`[data-column-index="${columnIndex}"] button`)
        this.shadowRoot.appendChild(dialog)
    }

    openDtypeDialog(dtype) {
        const state = {
            dtype,
            columnName: `All ${dtype} columns`,
            formatOptions: {},
        }
        const dialog = new FormatDialog(state)
        dialog.triggerElement = this.shadowRoot.querySelector("[data-action='edit-dtype']")
        this.shadowRoot.appendChild(dialog)
    }

    applyColumnPreset(columnIndex, presetKey) {
        const attrs = this.data.columns.attrs[columnIndex]
        const presets = getPresetsForType(attrs.dtype)
        const preset = presets[presetKey]

        if (preset) {
            const currentFormatOptions = [...(this.data.formatOptions ?? [])]
            currentFormatOptions[columnIndex] = preset.options
            this.data.formatOptions = currentFormatOptions
            this.update()
        }
    }

    applyDtypePreset(dtype, presetKey) {
        const presets = getPresetsForType(dtype)
        const preset = presets[presetKey]

        if (preset) {
            const currentFormatOptions = [...(this.data.formatOptions ?? [])]
            this.data.columns.attrs.forEach((attr, idx) => {
                if (attr.dtype === dtype) {
                    currentFormatOptions[idx] = preset.options
                }
            })
            this.data.formatOptions = currentFormatOptions
            this.update()
        }
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

    getDtypesInData() {
        const dtypes = new Set()
        this.data.columns.attrs.forEach(attr => {
            if (attr.dtype && attr.dtype !== "[sep]") {
                dtypes.add(attr.dtype)
            }
        })
        return Array.from(dtypes)
    }

    // MARK: render
    render() {
        const styles = `
            :host {
                display: block;
            }

            .bulk-format {
                display: grid;
                grid-template-columns: auto auto 1fr;
                gap: 0.5rem;
                align-items: center;
                margin-bottom: 1rem;
            }

            .actions {
                display: flex;
                gap: 0.5rem;
            }

            table {
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
                * {
                    pointer-events: none;
                }
            }

            select {
                padding: 0.25rem 0.5rem;
            }
        `

        const dtypes = this.getDtypesInData()
        const dtypeOptions = dtypes
            .map(dtype => `<option value="${dtype}">${dtype}</option>`)
            .join("")

        const bulkFormatControls = `
            <div class="bulk-format">
                <label for="dtype-select">Edit dtype:</label>
                <select data-action="select-dtype">
                    ${dtypeOptions}
                </select>
                <div class="actions">
                    <select data-action="preset-dtype">
                        ${Object.entries(getPresetsForType(dtypes[0]))
                            .map(([key, preset]) =>
                                `<option value="${key}">${preset.label}</option>`
                            ).join("")}
                    </select>
                    <button data-action="edit-dtype">Edit</button>
                </div>
            </div>
        `

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            ${bulkFormatControls}
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

    buildRow(col, idx) {
        const attrs = this.data.columns.attrs[idx]
        if (attrs.dtype === "[sep]") return ""
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

    update() {
        if (!this.tbody) return

        this.tbody.innerHTML = this.data.columns.values
            .map((col, idx) => this.buildRow(col, idx))
            .join("")
    }
}

customElements.define("format-table", FormatTable)
