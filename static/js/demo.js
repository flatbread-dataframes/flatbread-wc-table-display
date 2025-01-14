class Demo {
    constructor() {
        this.handleDataSourceChange = this.handleDataSourceChange.bind(this)
        this.handleCellClick = this.handleCellClick.bind(this)
        this.handleDataChanged = this.handleDataChanged.bind(this)

        this.setupEventListeners()
    }

    // MARK: setup
    setupEventListeners() {
        this.setupControlEvents()
        this.setupViewerEvents()
    }

    setupControlEvents() {
        document.getElementById("src").addEventListener("change", this.handleDataSourceChange)
        document.getElementById("n").addEventListener("change", event => {
            this.updateTable(event.target.value)
        })
    }

    setupViewerEvents() {
        if (!this.dataViewer) return

        this.dataViewer.addEventListener("cell-click", this.handleCellClick)
        this.dataViewer.addEventListener("data-changed", this.handleDataChanged)
    }

    // MARK: get/set
    get wrapper() { return document.getElementById("data-viewer-wrapper") }
    get dataViewer() { return this.wrapper.querySelector("data-viewer") }
    get eventDisplay() { return document.getElementById("event-display") }

    // MARK: handlers
    handleDataSourceChange() {
        this.dataViewer?.remove()

        const viewer = document.createElement("data-viewer")
        viewer.setAttribute("src", event.target.value)
        viewer.setAttribute("margin-labels", "Total;Totaal;Subtotal")

        this.wrapper.appendChild(viewer)
        this.addDataViewerEventListeners()
    }

    handleCellClick(event) {
        this.eventDisplay.querySelector("code").innerText = JSON.stringify(event.detail)
    }

    handleDataChanged(event) {
        const JSONString = JSON.stringify(event.detail._rawData)
        const truncatedContent = this.truncateJSONString(JSONString)
        this.eventDisplay.querySelector("code").innerText = truncatedContent
    }

    // MARK: helpers
    addDataViewerEventListeners() {
        this.dataViewer.addEventListener("cell-click", this.handleCellClick)
        this.dataViewer.addEventListener("data-changed", this.handleDataChanged)
    }

    truncateJSONString(JSONString, maxLength = 1500) {
        if (JSONString.length <= maxLength) return JSONString
        return JSONString.slice(0, maxLength) + "[...]"
    }

    getCalculation(n) {
        const op = document.getElementById("calc-op").value
        n = parseInt(n)
        const calculations = {
            multiply: value => value ? value * n : null,
            divide: value => value ? value / n : null,
            add: value => value ? value + n : null,
            subtract: value => value ? value - n : null
        }
        return calculations[op]
    }

    updateTable(n) {
        const op = this.getCalculation(n)
        const newValues = this.dataViewer.data.values.map(row => row.map(op))
        this.dataViewer.data.values = newValues
    }

    resetAttributes(element, attributesToKeep) {
        const attributes = [...element.attributes]
        attributes.forEach(attr => {
            if (!attributesToKeep.includes(attr.name)) {
                element.removeAttribute(attr.name)
            }
        })
        return element
    }
}

document.addEventListener("DOMContentLoaded", () => new Demo())
