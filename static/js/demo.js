class Demo {
    constructor() {
        this.dataViewer = document.querySelector("data-viewer")
        this.eventDisplay = document.getElementById("event-display")
        this.setupEventListeners()
    }

    setupEventListeners() {
        // Settings elements
        document.getElementById("src").addEventListener("change", event => {
            this.dataViewer.setAttribute("src", event.target.value)
        })

        document.querySelectorAll('input[name="locale"]').forEach(radio => {
            radio.addEventListener("change", () => {
                const locale = this.getLocale()
                this.dataViewer.setAttribute("locale", locale)
            })
        })

        // Controls
        document.getElementById("n").addEventListener("change", event => {
            this.updateTable(event.target.value)
        })

        // Data viewer events
        this.dataViewer.addEventListener("cell-click", event => {
            this.eventDisplay.querySelector("code").innerText = JSON.stringify(event.detail)
        })

        this.dataViewer.addEventListener("data-changed", event => {
            const JSONString = JSON.stringify(event.detail._rawData)
            const truncatedContent = this.truncateJSONString(JSONString)
            this.eventDisplay.querySelector("code").innerText = truncatedContent
        })

        // Color scheme
        document.addEventListener("color-scheme-change", event => {
            event.detail.scheme === "dark"
                ? document.body.classList.add("dark-theme")
                : document.body.classList.remove("dark-theme")
        })
    }

    getLocale() {
        return document.querySelector('input[type="radio"]:checked')?.value
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
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => new Demo())
