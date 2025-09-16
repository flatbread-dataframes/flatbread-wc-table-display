import { ModalElement } from "../components/modal-element.js"
import { FormatTable } from "./format/format-table.js"
import { MEDIA_QUERIES, BREAKPOINTS, PREFERRED_LOCALES, COMMON_LOCALES } from "../config.js"
import "../components/input-slider.js"
import "../components/input-datalist.js"
import "../components/locale-selector.js"
import "../components/tag-input.js"

export class SettingsPopup extends ModalElement {
    constructor(data, options, state) {
        super()
        this.data = data
        this.options = options
        this.state = state ?? {}

        this.handleInputChange = this.handleInputChange.bind(this)
        this.handleTabClick = this.handleTabClick.bind(this)
        this.handleSelectTab = this.handleSelectTab.bind(this)
    }

    // MARK: setup
    connectedCallback() {
        super.connectedCallback()
        this.addEventListeners()
    }

    addEventListeners() {
        this.shadowRoot.addEventListener("change", this.handleInputChange)
        this.shadowRoot.addEventListener("click", this.handleTabClick)
    }

    // MARK: get/set
    get tabs() {
        return this.shadowRoot.querySelectorAll("[role=tab]")
    }

    get panels() {
        return this.shadowRoot.querySelectorAll("[role=tabpanel]")
    }

    // MARK: handlers
    handleInputChange(event) {
        const input = event.target

        const valueMap = {
            number: input => input.value,
            text: input => input.value,
            checkbox: input => input.checked,
            range: input => input.value,
            "flatbread-table-slider-input": input => input.value,
            "flatbread-table-input-datalist": input => input.value,
            "flatbread-table-tag-input": input => input.value.join(";"),
            "flatbread-table-locale-selector": input => input.value,
        }

        const getValue = valueMap[input.type] || valueMap[input.tagName.toLowerCase()]
        if (!getValue) return

        this.dispatchEvent(new CustomEvent("setting-change", {
            bubbles: true,
            composed: true,
            detail: {
                setting: input.id,
                value: getValue(input)
            }
        }))
    }

    handleTabClick(event) {
        const tab = event.target.closest("[role=tab]")
        if (!tab) return
        this.handleSelectTab(tab)
    }

    handleSelectTab(tab) {
        this.state.selectedTab = tab.getAttribute("aria-controls")

        this.tabs.forEach(tab => tab.setAttribute("aria-selected", "false"))
        this.panels.forEach(panel => panel.removeAttribute("selected"))

        tab.setAttribute("aria-selected", "true")
        const panel = this.shadowRoot.getElementById(this.state.selectedTab)
        panel.setAttribute("selected", "")

        this.dispatchEvent(new CustomEvent("select-tab", {
            bubbles: true,
            composed: true,
            detail: {
                selectedTab: this.state.selectedTab,
            }
        }))
    }

    // MARK: api
    position() {
        if (!MEDIA_QUERIES.POPUP_MOBILE.matches) return
        if (!this.triggerElement) return

        const trigger = this.triggerElement.getBoundingClientRect()
        // Position left edge of popup so its right edge aligns with trigger
        this.style.top = `${trigger.top}px`
        this.style.left = `${trigger.left - this.offsetWidth - 8}px`
    }

    // MARK: render
    getComponentStyles() {
        return `
            :host {
                display: grid;
                grid-template-rows: auto auto 1fr;  /* header, nav, main */
                grid-template-columns: minmax(0, 1fr);
                max-height: 67vh;
                overflow: hidden;

                @media (max-width: ${BREAKPOINTS.POPUP_MOBILE}) {
                    min-width: 0;
                }
            }
            nav {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 1rem;
                border-bottom: 1px solid var(--border-color, currentColor);
            }
            main {
                min-height: 0;
                display: grid;
                grid-template-rows: 1fr;
            }

            [role="tab"] {
                padding: 0.5rem 1rem;
                border: none;
                background: none;
                color: inherit;
                cursor: pointer;
                border-bottom: 2px solid transparent;
                margin-bottom: -1px;
                overflow-y: auto;
            }
            [role="tab"][aria-selected="true"] {
                border-bottom-color: currentColor;
            }
            [role="tabpanel"] {
                visibility: hidden;
                display: grid;
                gap: .5em;
                grid-column: 1;
                grid-row: 1;
                align-content: start;
                min-height: 0;
                overflow: auto;

                fieldset {
                    display: grid;
                    min-width: 0;
                }

                &#general {
                    fieldset:not(:last-of-type) {
                        grid-template-columns: auto minmax(0, 1fr);
                        gap: 0.5rem;
                        align-items: center;
                    }
                    #truncation-max {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        gap: 0.5rem;

                        label { font-size: 0.8em; }
                    }
                }
                &#styling {
                    label {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        margin-bottom: 0.5rem;
                    }
                }
            }
            [role="tabpanel"][selected] {
                visibility: visible;
            }

            input[type="number"] {
                width: 3.5rem;
                padding: 0.25rem;
            }
            input[type="text"] {
                min-width: 0;
                padding: 0.25rem;
            }
        `
    }

    buildContent() {
        return `
            ${this.buildHeader("Settings")}
            <nav role="tablist">
                <button role="tab"
                    aria-selected="true"
                    aria-controls="general">General</button>
                <button role="tab"
                    aria-selected="false"
                    aria-controls="styling">Styling</button>
                <button role="tab"
                    aria-selected="false"
                    aria-controls="format">Format</button>
            </nav>

            <main>
                <section role="tabpanel" id="general" selected>
                    ${this.buildGeneralPanel()}
                </section>

                <section role="tabpanel" id="styling">
                    ${this.buildStylingPanel()}
                </section>

                <section role="tabpanel" id="format"></section>
            </main>
        `
    }

    buildGeneralPanel() {
        const sectionLevelControls = this.data.index.isMultiIndex
            ? `<label>Section levels</label>
                <flatbread-table-slider-input
                    id="section-levels"
                    max="${this.data.index.nlevels - 1}"
                    value="${this.options.styling.sectionLevels}"
                ></flatbread-table-slider-input>`
            : ""

        return `
            <fieldset>
                ${sectionLevelControls}
                <label>Locale</label>
                <flatbread-table-locale-selector
                    id="locale"
                    value="${this.options.locale}"
                ></flatbread-table-locale-selector>
                <label>Na rep</label>
                <input type="text" id="na-rep" value="${this.options.naRep}">
            </fieldset>
            <fieldset>
                <legend>Truncation</legend>
                <label>Max</label>
                <div id="truncation-max">
                    <div>
                        <input type="number" id="max-rows" value="${this.options.truncation.maxRows}">
                        <label>rows</label>
                    </div>
                    <div>
                        <input type="number" id="max-columns" value="${this.options.truncation.maxColumns}">
                        <label>columns</label>
                    </div>
                </div>
                <label>Trim size</label>
                <input type="number" id="trim-size" value="${this.options.truncation.trimSize}">
                <label>Separator</label>
                <input type="text" id="separator" value="${this.options.truncation.separator}">
            </fieldset>
            <fieldset>
                <legend>Margin labels</legend>
                <flatbread-table-tag-input
                    id="margin-labels"
                    value="${this.options.marginLabels.join(";")}"
                ></flatbread-table-tag-input>
            </fieldset>
        `
    }

    buildStylingPanel() {
        return `
            <fieldset>
                <label for="column-border-levels">
                    Column border levels
                    <flatbread-table-slider-input
                        id="column-border-levels"
                        min="-1"
                        max="${this.data.columns.nlevels || 0}"
                        value="${this.options.styling.columnBorderLevels}"
                    ></flatbread-table-slider-input>
                </label>
                <label for="hide-column-borders">
                    <input type="checkbox" id="hide-column-borders" ${!this.options.styling.columnBorders ? "checked" : ""}>
                    Hide column borders
                </label>
                <label for="hide-row-borders">
                    <input type="checkbox" id="hide-row-borders" ${!this.options.styling.rowBorders ? "checked" : ""}>
                    Hide row borders
                </label>
                <label for="hide-index-border">
                    <input type="checkbox" id="hide-index-border" ${!this.options.styling.indexBorder ? "checked" : ""}>
                    Hide index border
                </label>
                <label for="hide-thead-border">
                    <input type="checkbox" id="hide-thead-border" ${!this.options.styling.theadBorder ? "checked" : ""}>
                    Hide thead border
                </label>
                <label for="show-hover">
                    <input type="checkbox" id="show-hover" ${this.options.styling.showHover ? "checked" : ""}>
                    Show hover effect
                </label>
                <label for="collapse-columns">
                    <input type="checkbox" id="collapse-columns" ${this.options.styling.collapseColumns ? "checked" : ""}>
                    Collapse columns
                </label>
            </fieldset>
        `
    }

    render() {
        super.render()
        const formatTable = new FormatTable(this.data)
        this.shadowRoot.getElementById("format").appendChild(formatTable)
        if (this.state.selectedTab) {
            const tab = this.shadowRoot.querySelector(`[aria-controls="${this.state.selectedTab}"]`)
            this.handleSelectTab(tab)
        }
    }
}

customElements.define("flatbread-table-settings-popup", SettingsPopup)
