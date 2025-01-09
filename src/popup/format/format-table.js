import { FormatDialog } from "./format-dialog.js"

export class FormatTable extends HTMLElement {
    constructor(data) {
        super()
        this.attachShadow({ mode: "open" })
        this.data = data

        this.handleEditClick = this.handleEditClick.bind(this)
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
    }

    removeEventListeners() {
        this.shadowRoot.removeEventListener("click", this.handleEditClick)
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
    }

    // MARK: api
    update() {
        if (!this.tbody) return

        this.tbody.innerHTML = this.data.columns.values.map((col, idx) => {
            const attrs = this.data.columns.attrs[idx]
            return `
                <tr data-column-index="${idx}">
                    <td>${Array.isArray(col) ? col.at(-1) : col}</td>
                    <td>${attrs.dtype ?? "-"}</td>
                    <td>${this.getFormatSummary(attrs.formatOptions)}</td>
                    <td>
                        <button data-action="edit">Edit</button>
                    </td>
                </tr>
            `
        }).join("")
    }

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

    getFormatSummary(options) {
        if (!options) return "-"

        const summaries = []
        if (options.style === "currency") summaries.push("€")
        if (options.notation !== "standard") summaries.push(options.notation)
        if (options.useGrouping) summaries.push("thousands")

        return summaries.length ? summaries.join(", ") : "-"
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
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `
        this.update()
    }
}

customElements.define("format-table", FormatTable)
