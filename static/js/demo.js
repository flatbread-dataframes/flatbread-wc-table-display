class Demo {
    constructor() {
        // Remove handleDataSourceChange since DatasetSelector handles this
        this.handleCellClick = this.handleCellClick.bind(this)
        this.handleDataChanged = this.handleDataChanged.bind(this)

        this.setupEventListeners()
    }

    // MARK: setup
    setupEventListeners() {
        // Don't need to set up source change event anymore
        document.getElementById("n").addEventListener("change", event => {
            this.updateTable(event.target.value)
        })

        // Set up event listeners for the DataViewer events
        this.setupViewerEvents()
    }

    setupViewerEvents() {
        if (!this.datasetSelector) return

        this.datasetSelector.addEventListener("cell-click", this.handleCellClick)
        this.datasetSelector.addEventListener("data-changed", this.handleDataChanged)
    }

    // MARK: get/set
    get wrapper() { return document.getElementById("flatbread-table-wrapper") }
    get datasetSelector() { return this.wrapper.querySelector("dataset-selector") }
    get eventDisplay() { return document.getElementById("event-display") }

    // MARK: handlers
    handleCellClick(event) {
        this.eventDisplay.querySelector("code").innerText = JSON.stringify(event.detail)
    }

    handleDataChanged(event) {
        const JSONString = JSON.stringify(event.detail._rawData)
        const truncatedContent = this.truncateJSONString(JSONString)
        this.eventDisplay.querySelector("code").innerText = truncatedContent
    }

    // MARK: helpers
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
        const viewer = this.datasetSelector.getViewer()

        if (viewer && viewer.data && viewer.data.values) {
            const newValues = viewer.data.values.map(row => row.map(op))
            viewer.data.values = newValues
        }
    }
}

document.addEventListener("DOMContentLoaded", () => new Demo())
