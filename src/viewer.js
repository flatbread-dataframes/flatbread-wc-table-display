import { Data } from "./data.js"
import { SettingsContainer } from "./settings/settings-container.js"
import { DataTable } from "./table.js"

export class DataViewer extends HTMLElement {
    static get observedAttributes() {
        return [
            "src", "type", "hide-settings-menu",
            "locale", "na-rep",
            "hide-column-borders", "hide-row-borders",
            "hide-thead-border", "hide-index-border",
            "show-hover", "margin-labels",
            "collapse-columns", "section-levels",
            "max-rows", "max-columns", "trim-size", "separator",
        ]
    }

    static get defaults() {
        return {
            locale: "default",
            naRep: "-",
            buffer: 30,
            marginLabels: [],
            type: "default",
            settingsMenu: true,
            truncation: {
                maxRows: 30,
                maxColumns: 30,
                trimSize: 5,
                separator: "...",
            },
            styling: {
                sectionLevels: 0,
                collapseColumns: null,
                hoverEffect: false,
                theadBorder: true,
                indexBorder: true,
                columnBorders: null,
                rowBorders: true,
                marginBorders: true,
            }
        }
    }

    constructor() {
        super()
        this.attachShadow({ mode: "open" })
        this.options = { ...DataViewer.defaults }

        this.handleDataChange = this.handleDataChange.bind(this)
        this.handleTableClick = this.handleTableClick.bind(this)
        this.handleSettingChange = this.handleSettingChange.bind(this)

        this._data = new Data()
        this._isConnected = false
        this.render()
    }

    // MARK: setup
    connectedCallback() {
        this.data.addEventListener("data-changed", this.handleDataChange)
        this.addEventListeners()
        this._isConnected = true
    }

    disconnectedCallback() {
        this.data.removeEventListener("data-changed", this.handleDataChange)
        this.removeEventListeners()
    }

    addEventListeners() {
        this.table.shadowRoot.addEventListener("click", this.handleTableClick)
        this.shadowRoot.addEventListener("setting-change", this.handleSettingChange)
    }

    removeEventListeners() {
        this.table.shadowRoot.removeEventListener("click", this.handleTableClick)
        this.shadowRoot.removeEventListener("setting-change", this.handleSettingChange)
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return
        switch (name) {
            case "src":
                this.loadDataFromSrc(newValue)
                return
            case "type":
                this.options.type = newValue ?? DataViewer.defaults.type
                break
            case "hide-settings-menu":
                // currently handled only with css (see styles)
                this.options.settingsMenu = !this.getBooleanAttribute(newValue) ?? DataViewer.defaults.settingsMenu
                break
            case "locale":
                this.options.locale = newValue ?? DataViewer.defaults.locale
                break
            case "na-rep":
                this.options.naRep = newValue ?? DataViewer.defaults.naRep
                break
            case "hide-column-borders":
                this.options.styling.columnBorders = !this.getBooleanAttribute(newValue)
                break
            case "hide-row-borders":
                this.options.styling.rowBorders = !this.getBooleanAttribute(newValue)
                break
            case "hide-index-border":
                this.options.styling.indexBorder = !this.getBooleanAttribute(newValue)
                break
            case "hide-thead-border":
                this.options.styling.theadBorder = !this.getBooleanAttribute(newValue)
                break
            case "show-hover":
                this.options.styling.hoverEffect = this.getBooleanAttribute(newValue)
                break
            case "collapse-columns":
                this.options.styling.collapseColumns = this.getBooleanAttribute(newValue)
                break
            case "margin-labels":
                const labels = newValue.split(";")
                this.options.marginLabels = labels
                break
            case "section-levels":
                const level = Math.max(0, parseInt(newValue) ?? DataViewer.defaults.styling.sectionLevels)
                this.options.styling.sectionLevels = level
                break
            case "max-rows":
                this.options.truncation.maxRows = parseInt(newValue) ?? DataViewer.defaults.maxRows
                break
            case "max-columns":
                this.options.truncation.maxColumns = parseInt(newValue) ?? DataViewer.defaults.maxColumns
                break
            case "trim-size":
                this.options.truncation.trimSize = parseInt(newValue) ?? DataViewer.defaults.trimSize
                break
            case "separator":
                this.options.truncation.separator = newValue ?? DataViewer.defaults.separator
                break
        }
        this.update()
    }

    async loadDataFromSrc(src) {
        try {
            const response = await fetch(src)
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const rawData = await response.json()
            this.data.setData(rawData)
        } catch (error) {
            console.error("Failed to fetch data:", error)
            this.showErrorMessage("Failed to load data")
        }
    }

    // MARK: get/set
    get data() { return this._data }
    set data(value) {
        if (this.hasAttribute("src")) {
            this.removeAttribute("src")
        }
        this._data.setData(value)
        // Only call update explicitly if we haven't connected yet
        if (!this.isConnected) {
            this.update()
        }
    }

    get table() {
        return this.shadowRoot.querySelector("data-table")
    }

    get settingsContainer() {
        return this.shadowRoot.querySelector("settings-container")
    }

    updateCalculatedOptions() {
        this.updateColumnBorders()
        this.updateColumnCollapse()
        this.updateSectionLevels()
    }

    updateColumnBorders() {
        if (this.options.styling.columnBorders !== null) return

        this.options.styling.columnBorders = this.data.columns.isMultiIndex
    }

    updateColumnCollapse() {
        if (this.options.styling.collapseColumns !== null) return

        const hasColumnNames = this.data.columnNames?.length
        const lastNameIsNull = this.data.columns.isMultiIndex &&
            this.data.columnNames?.at(-1) === null

        this.options.styling.collapseColumns = !hasColumnNames || lastNameIsNull || !this.data.columns.isMultiIndex
    }

    updateSectionLevels() {
        const maxLevels = Math.max(0, this.data.index.nlevels - 1)
        const requestedLevels = this.options.styling.sectionLevels

        this.options.styling.sectionLevels = Math.min(requestedLevels, maxLevels)
    }

    getBooleanAttribute(value) {
        // Return false if attribute is not present
        if (value === null) return false
        // Return true if attribute is present without value
        if (value === "") return true
        // Return boolean based on string value
        return value.toLowerCase() === "true"
    }

    invertCurrentColor() {
        // Get the computed currentColor value
        const temp = document.createElement("div")
        temp.style.color = "currentColor"
        document.body.appendChild(temp)
        const currentColor = window.getComputedStyle(temp).color
        document.body.removeChild(temp)

        // Get RGB values
        const [r, g, b] = currentColor.match(/\d+/g).map(Number)

        return `rgb(${255 - r}, ${255 - g}, ${255 - b})`
    }

    // MARK: render
    render() {
        console.log(this.invertCurrentColor())
        this.shadowRoot.innerHTML = `
            <style>
                *,
                *::before,
                *::after {
                    box-sizing: border-box
                }
                :host {
                    display: flex;
                    align-items: start;
                    gap: 8px;
                    position: relative;
                    --surface-color: ${this.invertCurrentColor()};
                }
                settings-container {
                    position: static;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                :host(:hover) settings-container {
                    opacity: .5;
                }
                :host(:hover) settings-container:hover {
                    opacity: 1;
                }
                :host settings-container[open] {
                    opacity: 1;
                }
                :host([hide-settings-menu]) settings-container {
                    display: none;
                }
                @media (hover: none) {
                    :host settings-container {
                        opacity: 1;
                    }
                }
            </style>
            <data-table></data-table>
        `
        const settingsContainer = new SettingsContainer(this.options)
        this.shadowRoot.appendChild(settingsContainer)
    }

    update() {
        if (this.data.isEmpty) {
            this.table.update(null, this.options)
            return
        }

        this.updateCalculatedOptions()
        const viewData = this.data.createTrimmedView(this.options)
        this.table.update(viewData, this.options)
        this.settingsContainer.data = viewData
    }

    // MARK: handlers
    handleDataChange() {
        this.update()
        this.dispatchEvent(new CustomEvent("data-changed", { detail: this.data }))
    }

    handleSettingChange(event) {
        const { setting, value } = event.detail
        this.setAttribute(setting, value)
    }

    handleTableClick(event) {
        const cell = event.target.closest("th, td")
        if (!cell) return

        const tr = cell.closest("tr")
        const isInHead = tr.closest("thead") !== null
        const isInBody = tr.closest("tbody") !== null

        let source, row, col

        if (isInHead) {
            source = "column"
            row = Array.from(tr.parentNode.children).indexOf(tr)
            col = Array.from(tr.children).indexOf(cell)
        } else if (isInBody) {
            if (cell.tagName === "TH") {
                source = "index"
                row = Array.from(tr.parentNode.children).indexOf(tr)
                col = Array.from(tr.children).filter(c => c.tagName === "TH").indexOf(cell)
            } else {
                source = "values"
                row = Array.from(tr.parentNode.children).indexOf(tr)
                col = Array.from(tr.children).filter(c => c.tagName === "TD").indexOf(cell)
            }
        } else {
            return // Not in thead or tbody, ignore
        }

        const value = cell.textContent

        this.dispatchEvent(new CustomEvent("cell-click", {
            detail: { value, source, row, col },
            bubbles: true,
            composed: true
        }))
    }

    showErrorMessage(message) {
        this.shadowRoot.innerHTML = `
            ${this.getStyleSheet()}
            <p style="color: red;">${message}</p>
        `
    }
}

window.customElements.define('data-viewer', DataViewer)
