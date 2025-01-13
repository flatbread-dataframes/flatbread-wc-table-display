class Demo {
    constructor() {
        this.dataViewer = document.querySelector("data-viewer")
        this.eventDisplay = document.getElementById("event-display")
        this.setupEventListeners()
    }

    setupEventListeners() {
        // Settings elements
        document.getElementById("src").addEventListener("change", event => {
            const wrapper = document.getElementById("data-viewer-wrapper")

            // Remove existing viewer
            wrapper.querySelector("data-viewer")?.remove()

            // Create and configure new viewer
            const viewer = document.createElement("data-viewer")
            viewer.setAttribute("src", event.target.value)
            viewer.setAttribute("locale", this.getLocale())
            viewer.setAttribute("margin-labels", "Total;Totaal;Subtotal")

            wrapper.appendChild(viewer)
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

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => new Demo())
