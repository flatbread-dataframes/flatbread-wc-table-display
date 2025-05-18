import { DataViewer } from "../viewer.js"


export class DatasetSelector extends HTMLElement {
    static get defaults() {
        return {
            controlThresholds: {
                radioMaxOptions: 4
            },
        }
    }

    constructor() {
        super()
        this.attachShadow({ mode: "open" })

        this.handleFilterChange = this.handleFilterChange.bind(this)

        this.options = { ...DatasetSelector.defaults }
        this.datasets = []          // All available datasets
        this.filters = {}           // Current filter configuration
        this.filterOptions = {}     // Available options for each filter
        this.dataCache = new Map()  // Cache for fetched datasets
    }

    // MARK: setup
    static get observedAttributes() {
        // Combine our attributes with DataViewer's
        const ownAttributes = ["src"]
        return [...ownAttributes, ...DataViewer.observedAttributes]
    }

    connectedCallback() {
        if (this.hasAttribute("src")) {
            this.loadSpecFromSrc(this.getAttribute("src"))
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "src" && oldValue !== newValue) {
            this.loadSpecFromSrc(newValue)
        } else if (this.dataViewer && DataViewer.observedAttributes.includes(name)) {
            // Forward DataViewer attributes
            if (newValue !== null) {
                this.dataViewer.setAttribute(name, newValue)
            } else {
                this.dataViewer.removeAttribute(name)
            }
        }
    }

    disconnectedCallback() {
        if (this.dataViewer) {
            this.dataViewer.remove()
        }
    }

    forwardInitialAttributes() {
        if (!this.dataViewer) return

        DataViewer.observedAttributes.forEach(attr => {
            if (attr === 'src') return
            if (this.hasAttribute(attr)) {
                this.dataViewer.setAttribute(attr, this.getAttribute(attr))
            }
        })
    }

    // Load spec and initialize
    async loadSpecFromSrc(src) {
        try {
            const response = await fetch(src)
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const spec = await response.json()
            this.initializeFromSpec(spec)
        } catch (error) {
            console.error("Failed to fetch dataset selector spec:", error)
        }
    }

    // Generate a consistent ID from a dataset's filter values
    generateDatasetId(dataset) {
        if (!dataset.filters) return "default"

        // Sort keys to ensure consistent order
        const filterEntries = Object.entries(dataset.filters)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))

        // Create ID by joining key-value pairs
        return filterEntries.map(([key, filter]) =>
            `${key}:${filter.value}`
        ).join("|")
    }

    initializeFromSpec(spec) {
        this.spec = spec

        // Apply custom thresholds if provided
        if (spec.controlThresholds) {
            this.options.controlThresholds = {
                ...this.options.controlThresholds,
                ...spec.controlThresholds
            }
        }

        // Create a deep clone of the datasets
        this.datasets = structuredClone(spec.datasets ?? [])

        // Normalize filter values to {value, label} objects
        this.datasets.forEach(dataset => {
            if (!dataset.filters) return

            // Convert each filter value to normalized format
            Object.entries(dataset.filters).forEach(([key, val]) => {
                // Check if it's already an object with a value property
                if (val?.value !== undefined) {
                    // Ensure it has a label property (using value as default if missing)
                    dataset.filters[key] = {
                        value: val.value,
                        label: val.label ?? val.value,
                    }
                } else {
                    // Convert primitive to object format
                    dataset.filters[key] = {
                        value: val,
                        label: val,
                    }
                }
            })

            // Generate ID if not provided
            if (!dataset.id) {
                dataset.id = this.generateDatasetId(dataset)
            }
        })

        // Extract all filter options
        this.extractFilterOptions()

        // Set default filters if provided
        if (spec.defaultFilters) {
            // Map the filter values, extracting 'value' property if it's an object with that property
            this.filters = Object.fromEntries(
                Object.entries(spec.defaultFilters).map(([key, value]) => [
                    key,
                    value?.value !== undefined ? value.value : value
                ])
            )
        } else {
            // Otherwise set first option for each filter
            this.filters = Object.fromEntries(
                Object.keys(this.filterOptions).map(key => [
                    key,
                    this.filterOptions[key][0]?.value
                ])
            )
        }

        // Extract global options if provided
        this.globalOptions = spec.options ?? {}

        this.render()
        this.updateViewer()
    }

    // Extract all possible filter options from datasets
    extractFilterOptions() {
        // Reset filter options
        this.filterOptions = {}

        // Go through each dataset and collect unique filter options
        this.datasets.forEach(dataset => {
            if (!dataset.filters) return

            Object.entries(dataset.filters).forEach(([key, filterObj]) => {
                // Initialize array if this is first encounter of this filter key
                this.filterOptions[key] ??= []

                // Add option if it doesn't exist yet
                const exists = this.filterOptions[key].some(opt => opt.value === filterObj.value)
                if (!exists) {
                    this.filterOptions[key].push(filterObj)
                }
            })
        })
    }

    // MARK: get/set
    set data(spec) {
        this.initializeFromSpec(spec)
    }

    get data() {
        return this.spec
    }

    // Access to the underlying DataViewer
    getViewer() {
        return this.dataViewer
    }

    // Access to the underlying data
    getViewerData() {
        return this.dataViewer ? this.dataViewer.data : null
    }

    setViewerData(data) {
        if (this.dataViewer) {
            this.dataViewer.data = data
        }
    }

    // Update specific parts of the data
    updateViewerValues(newValues) {
        if (this.dataViewer && this.dataViewer.data) {
            this.dataViewer.data.values = newValues
        }
    }

    // MARK: handlers
    // Handle when user changes a filter
    handleFilterChange(event) {
        const { name, value } = event.target
        this.filters[name] = value
        this.updateViewer()
    }

    // Find the right dataset based on current filters
    findMatchingDataset() {
        // Generate an ID based on current filter selections
        const currentId = Object.entries(this.filters)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, value]) => `${key}:${value}`)
            .join('|')

        // Find dataset with matching ID or matching filters
        return this.datasets.find(dataset =>
            dataset.id === currentId || this.doFiltersMatch(dataset)
        )
    }

    doFiltersMatch(dataset) {
        if (!dataset.filters) return false

        return Object.entries(this.filters).every(([key, value]) =>
            dataset.filters[key]?.value === value
        )
    }

    // MARK: render
    // Update the data-viewer with the currently selected dataset
    async updateViewer() {
        const dataset = this.findMatchingDataset()

        if (!dataset) {
            this.dataViewer.data = { values: [], columns: [], index: [] }
            return
        }

        // Handle data from URL if specified
        if (dataset.dataUrl && !dataset.data) {
            // Check cache first
            if (this.dataCache.has(dataset.dataUrl)) {
                dataset.data = this.dataCache.get(dataset.dataUrl)
            } else {
                try {
                    // Show loading state if desired
                    const response = await fetch(dataset.dataUrl)
                    if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
                    dataset.data = await response.json()
                    // Cache the result
                    this.dataCache.set(dataset.dataUrl, dataset.data)
                } catch (error) {
                    console.error(`Failed to fetch dataset from ${dataset.dataUrl}:`, error)
                    // Show error state or fallback data
                    dataset.data = { values: [], columns: [], index: [] }
                }
            }
        }

        this.dataViewer.data = dataset.data

        // Apply global options first
        if (this.globalOptions) {
            for (const [key, value] of Object.entries(this.globalOptions)) {
                this.dataViewer.setAttribute(key, value)
            }
        }

        // Apply options if specified
        if (dataset.options) {
            for (const [key, value] of Object.entries(dataset.options)) {
                this.dataViewer.setAttribute(key, value)
            }
        }
    }

    // Render filter controls
    // Main filter controls renderer that determines which specific renderer to use
    renderFilterControls() {
        return Object.entries(this.filterOptions).map(([filterName, options]) => {
            // Determine control type (override or automatic)
            const controlType = this.determineControlType(filterName, options)

            // Render the fieldset with the appropriate control inside
            return this.renderFilterGroup(filterName, options, controlType)
        }).join("")
    }

    // Determine what type of control to use for a filter
    determineControlType(filterName, options) {
        // Check for explicit control type override
        const overrideType = this.spec?.filterControlTypes?.[filterName]

        if (overrideType) {
            return overrideType
        }

        // Use the options object
        return options.length <= this.options.controlThresholds.radioMaxOptions
            ? "radio"
            : "select"
    }

    // Render the container for a filter group with appropriate control inside
    renderFilterGroup(filterName, options, controlType) {
        // Choose the appropriate control renderer based on type
        let controlsHtml

        switch (controlType) {
            case "radio":
                controlsHtml = this.renderRadioOptions(filterName, options)
                break
            case "select":
                controlsHtml = this.renderSelectOptions(filterName, options)
                break
            default:
                controlsHtml = this.renderRadioOptions(filterName, options)
        }

        return `
            <fieldset class="filter-group filter-type-${controlType}">
                <legend>${this.formatFilterName(filterName)}</legend>
                <div class="filter-options">
                    ${controlsHtml}
                </div>
            </fieldset>
        `
    }

    // Render radio button controls for a filter
    renderRadioOptions(filterName, options) {
        return options.map(option => {
            const checked = this.filters[filterName] === option.value ? "checked" : ""
            return `
                <label class="radio-label">
                    <input type="radio" name="${filterName}"
                        value="${option.value}" ${checked}>
                    ${option.label}
                </label>
            `
        }).join("")
    }

    // Render select dropdown for a filter
    renderSelectOptions(filterName, options) {
        const optionsHtml = options.map(option => {
            const selected = this.filters[filterName] === option.value ? "selected" : ""
            return `<option value="${option.value}" ${selected}>${option.label}</option>`
        }).join("")

        return `
            <select name="${filterName}" class="filter-select">
                ${optionsHtml}
            </select>
        `
    }

    // Add event listeners based on rendered control types
    addFilterEventListeners() {
        // Add event listeners to radio controls
        this.shadowRoot.querySelectorAll(`input[type="radio"]`).forEach(input => {
            input.addEventListener("change", this.handleFilterChange)
        })

        // Add event listeners to select controls
        this.shadowRoot.querySelectorAll("select.filter-select").forEach(select => {
            select.addEventListener("change", this.handleFilterChange)
        })
    }

    // Helper to format filter names for display (e.g., "program_type" -> "Program Type")
    formatFilterName(name) {
        return name
            .replace(/_/g, " ")
            .replace(/\b\w/g, l => l.toUpperCase())
    }

    // Render the component
    render() {
        const filterControlsHtml = this.renderFilterControls()

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: grid;
                    gap: 1rem;
                }
                .filter-controls {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                /* Base styles for all filter groups */
                .filter-group {
                    border: 1px solid var(--border-color, currentColor);
                    border-radius: 4px;
                    padding: 0.5rem;
                    margin: 0;
                }

                /* Filter options container */
                .filter-options {
                    display: flex;
                    gap: 0.5rem;
                }

                /* Styles specific to radio button groups */
                .filter-type-radio .filter-options {
                    flex-wrap: wrap;
                }

                .radio-label {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                /* Styles specific to select groups */
                .filter-type-select .filter-options {
                    display: block;
                }

                .filter-select {
                    width: 100%;
                    padding: 0.25rem;
                }
            </style>
            <div class="filter-controls">
                ${filterControlsHtml}
            </div>
            <div class="viewer-container"></div>
        `

        this.addFilterEventListeners()

        // Create and append the data-viewer
        const viewer = document.createElement("data-viewer")
        this.shadowRoot.querySelector(".viewer-container").appendChild(viewer)
        this.dataViewer = viewer
        this.forwardInitialAttributes()
    }
}

customElements.define("dataset-selector", DatasetSelector)
