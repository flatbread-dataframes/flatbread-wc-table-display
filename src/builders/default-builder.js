import { BaseTableBuilder } from "./base-builder.js"

export class DefaultTableBuilder extends BaseTableBuilder {
    // MARK: Stylesheet
    getStyleSheet() {
        const styleBlocks = {
            groupBorders: `
                [group-edge] {
                    border-left: 1px solid var(--border-color, currentColor)
                }
            `,
            rowBorders: `
                tbody tr:not(:first-of-type):has(th[rowspan]) :where(th, td) {
                    border-top: 1px solid var(--border-color, currentColor)
                }
            `,
            hoverEffect: `
                tbody tr:hover :where(td, th:not([rowspan])) {
                    background-color: var(--hover-color, #f4f3ee)
                }
            `,
            theadBorder: `
                tbody tr:first-of-type :where(th, td) {
                    border-top: var(--axes-width, 2px) solid var(--border-color, currentColor)
                }
            `,
            indexBorder: `
                [index-edge] {
                    border-left: var(--axes-width, 2px) solid var(--border-color, currentColor)
                }
            `,
            marginBorders: `
                [margin-edge-idx] {
                    border-top: 1px solid var(--border-color, currentColor)
                }
                [margin-edge-col] {
                    border-left: 1px solid var(--border-color, currentColor)
                }
            `
        }

        const composedStyles = Object.entries(styleBlocks)
            .filter(([key]) => this.options.styling[key])
            .map(([, style]) => style)
            .join("\n")

        return `<style>${this.getBaseStyles()}\n${composedStyles}</style>`
    }

    // MARK: Thead
    /**
     * Builds the table header with support for single and multi-level column structures
     * The header structure changes based on whether columns are collapsed
     * @returns {string} HTML string for the complete table header
     */
    buildThead() {
        return this.data.columns.isMultiIndex
            ? this.buildMultiLevelHeader()
            : this.buildSingleLevelHeader()
    }

    /**
     * Builds header for tables with a single level of columns
     * @returns {string} HTML string for single-level header
     * @private
     */
    buildSingleLevelHeader() {
        const { collapseColumns } = this.options.styling
        const columnGroups = this.buildColumnGroupsRow(0)

        return collapseColumns
            ? this.buildColumnsRow()
            : `${columnGroups}${this.buildIndexNamesRow()}`
    }

    /**
     * Builds header for tables with multiple levels of columns
     * @returns {string} HTML string for multi-level header
     * @private
     */
    buildMultiLevelHeader() {
        const { collapseColumns } = this.options.styling
        const levels = this.getLevelsForHeader()

        const groupRows = levels
            .map(level => this.buildColumnGroupsRow(level))
            .join("")

        const finalRow = collapseColumns
            ? this.buildColumnsRow()
            : this.buildIndexNamesRow()

        return `${groupRows}${finalRow}`
    }

    /**
     * Determines which levels to include in the header based on collapse setting
     * @returns {number[]} Array of level indices to include
     * @private
     */
    getLevelsForHeader() {
        const { collapseColumns } = this.options.styling
        const allLevels = this.data.columns.ilevels

        return collapseColumns
            ? allLevels.slice(0, -1)  // Exclude last level when collapsed
            : allLevels               // Include all levels when not collapsed
    }

    /**
     * Builds a row with index labels and column values
     * Represents the bottom row of the header showing actual column names
     * @returns {string} HTML string for the row
     */
    buildColumnsRow() {
        return this.buildHeaderRow(value => value)
    }

    /**
     * Builds a row with index labels and empty column headers
     * Used when column labels need their own dedicated row
     * @returns {string} HTML string for the row
     */
    buildIndexNamesRow() {
        return this.buildHeaderRow(() => "")
    }

    /**
     * Shared helper to build header rows with consistent structure
     * @param {Function} valueMapper - Function to transform column values
     * @returns {string} HTML string for the row
     * @private
     */
    buildHeaderRow(valueMapper) {
        const indexLabels = this.buildIndexLabels()
        const columnHeaders = this.data.columns
            .map((value, idx) => this.buildColumnLabel(value, valueMapper(value), idx))
            .join("")

        return `<tr>${indexLabels}${columnHeaders}</tr>`
    }

    /**
     * Creates the index label cells for header rows
     * @returns {string} Concatenated HTML string of index label cells
     * @private
     */
    buildIndexLabels() {
        const labels = this.data.indexNames
            ? this.data.indexNames
            : Array(this.data.index.ilevels.length).fill(null)

        return labels
            .map(name => `<th class="indexLabel">${name ?? ""}</th>`)
            .join("")
    }

    /**
     * Creates a table header cell (<th>) for a column with appropriate data attributes and edge indicators
     * @param {*} value - The column value, can be an array or single value
     * @param {number} iloc - The column's integer location index
     * @returns {string} HTML string for the th element
     */
    buildColumnLabel(value, mappedValue, iloc) {
        const selectedValue = Array.isArray(mappedValue) ? mappedValue.at(-1) : mappedValue
        const attrs = this.data.columns.attrs[iloc]

        const attributes = {
            "data-col": iloc,
            "data-groups": attrs.groups.join(" "),
            "index-edge": iloc === 0,
            "group-edge": this.data.columns.edges.slice(1).includes(iloc),
            "margin-edge-col": this.testMarginEdge(value)
        }

        return `<th ${this.buildAttributeString(attributes)}>${selectedValue}</th>`
    }

    /**
     * Builds a table row that groups columns by a specific hierarchy level.
     * Each level represents a tier in a multi-level column structure.
     * @param {number} level - The hierarchy level (0 being top-most)
     * @returns {string} HTML string for the row containing column groups
     * @example
     * // Given data with columns grouped like:
     * // Products    |    Services    |
     * //  Car  Boat  |  Web   Mobile  |
     * // If level=0, creates the "Products | Services" row
     * // If level=1, creates the "Car Boat | Web Mobile" row
     */
    buildColumnGroupsRow(level) {
        const columnLabel = this.data.columnNames?.[level] ?? ""
        const columnSpan = this.data.index.nlevels

        const columnLabelElement = `<th colspan="${columnSpan}" class="columnLabel">${columnLabel}</th>`
        const groupHeaders = this.data.columns.spans[level]
            .map((span, iloc) => this.buildColumnGroupLabel(span, iloc, level))
            .join("")

        return `<tr>${columnLabelElement}${groupHeaders}</tr>`
    }

    /**
     * Creates a header cell for a group of columns at a specific hierarchy level
     * @param {Object} span - The span object containing grouping information
     * @param {number} span.count - Number of columns this group spans
     * @param {Array} span.value - Array of values for each level of the hierarchy
     * @param {number} iloc - Index location of this group
     * @param {number} level - Current hierarchy level being rendered
     * @returns {string} HTML string for the group header cell
     */
    buildColumnGroupLabel(span, iloc, level) {
        const attributes = {
            colspan: span.count,
            "data-level": level,
            "data-group": iloc,
            "index-edge": iloc === 0,
            "group-edge": iloc > 0,
            "margin-edge-col": this.testMarginEdge(span.value)
        }

        return `<th ${this.buildAttributeString(attributes)}>${span.value[level]}</th>`
    }

    // MARK: Tbody
    /**
     * Builds the table body by combining index cells with data cells
     * Each row consists of index labels followed by data values
     * @returns {string} HTML string for the table body
     */
    buildTbody() {
        const indexRows = this.buildIndexRows()

        this.data.values.forEach((row, irow) => {
            const dataCells = this.buildDataCells(row, irow)
            indexRows[irow] = indexRows[irow].concat(dataCells)
        })

        return this.wrapRowsInTr(indexRows)
    }

    /**
     * Creates data cells for a single row
     * @param {Array} row - Array of values for the row
     * @param {number} irow - Row index
     * @returns {string[]} Array of HTML strings for data cells
     * @private
     */
    buildDataCells(row, irow) {
        return row.map((value, icol) =>
            this.buildCell(value, irow, icol)
        )
    }

    /**
     * Wraps an array of row contents in tr tags
     * @param {string[][]} rows - Array of arrays containing cell HTML
     * @returns {string} Combined HTML string of all rows
     * @private
     */
    wrapRowsInTr(rows) {
        return rows
            .map(row => `<tr>${row.join("")}</tr>`)
            .join("")
    }

    /**
     * Builds the index columns of the table (leftmost columns)
     * Creates a hierarchical structure with proper row spanning
     * @returns {string[]} Array of HTML strings for each row's index cells
     */
    buildIndexRows() {
        const indexRows = this.data.index.map(value => [this.buildIndex(value)])
        const levelsReversed = this.data.index.ilevels.slice(0, -1).reverse()

        levelsReversed.forEach(level => this.addIndexSpans(level, indexRows))

        return indexRows
    }

    /**
     * Adds spanning index cells for a specific hierarchy level
     * @param {number} level - The hierarchy level to process
     * @param {string[][]} indexRows - Array of row arrays to modify
     * @private
     */
    addIndexSpans(level, indexRows) {
        for (const span of this.data.index.spans[level]) {
            const attributes = {
                rowspan: span.count,
                "data-level": level,
                "data-group": span.group,
                "margin-edge-idx": this.testMarginEdge(span.value)
            }

            const cell = `<th ${this.buildAttributeString(attributes)}>${span.value[level]}</th>`
            indexRows[span.iloc].unshift(cell)
        }
    }

    /**
     * Creates a table header cell for an index value
     * @param {*} value - The index value, can be an array or single value
     * @returns {string} HTML string for the index cell
     */
    buildIndex(value) {
        const selectedValue = Array.isArray(value) ? value.at(-1) : value

        const attributes = {
            "margin-edge-idx": this.testMarginEdge(value)
        }

        return `<th ${this.buildAttributeString(attributes)}>${selectedValue}</th>`
    }
}
