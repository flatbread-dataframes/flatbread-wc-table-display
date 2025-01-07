import { BaseTableBuilder } from "./base-builder.js"

export class DefaultTableBuilder extends BaseTableBuilder {
    // MARK: Stylesheet
    getStyleSheet() {
        const styleBlocks = {
            sectionLevels: `
                [section-header] {
                    padding-top: var(--section-spacing-top, 1.25em);
                    padding-left: calc(var(--section-indent, 1rem) * var(--indent-level, 0));
                }
                tbody:has([section-header]) + tbody [section-header] {
                    padding-top: 0
                }
            ${this.getSectionHeaderSizingRules()}
            ${this.getSectionIndentRules()}
            `,
            columnBorders: `
                [column-edge] {
                    border-left: 1px solid var(--border-color, currentColor);
                }
            `,
            rowBorders: `
                tbody tr:not(:first-of-type):has(th[rowspan]) :where(th, td) {
                    border-top: 1px solid var(--border-color, currentColor);
                }
                tbody[section-group]:not(:has(+ tbody[section-group])) :where(th, td) {
                    border-bottom: 1px solid var(--border-color, currentColor)
                }
            `,
            hoverEffect: `
                tbody tr:hover :where(td, th:not([rowspan])) {
                    background-color: var(--hover-color, #f4f3ee);
                }
            `,
            theadBorder: `
                thead tr:last-of-type :where(th, td) {
                    border-bottom: var(--axes-width, 2px) solid var(--border-color, currentColor);
                }
            `,
            indexBorder: `
                [index-edge] {
                    border-left: var(--axes-width, 2px) solid var(--border-color, currentColor);
                }
            `,
            marginBorders: `
                [margin-edge-idx] {
                    border-top: 1px solid var(--border-color, currentColor);
                }
                [margin-edge-col] {
                    border-left: 1px solid var(--border-color, currentColor);
                }
            `
        }

        const composedStyles = Object.entries(styleBlocks)
            .filter(([key]) => this.options.styling[key])
            .map(([, style]) => style)
            .join("\n")

        return `<style>${this.getBaseStyles()}\n${composedStyles}</style>`
    }

    /**
     * Generates CSS rules for section header font sizing based on hierarchy level
     * Creates a visual hierarchy for section headers with appropriate scaling
     *
     * Uses CSS variables with fallback values:
     * --section-base-size: base font size for lowest level (defaults to 1.125em)
     * --section-increment: size increase per level (defaults to 0.125em)
     *
     * For multi-level sections, creates a size progression where:
     * - The top level (0) is largest
     * - Each lower level decreases by the increment
     * - The bottom level uses the base size
     *
     * @example
     * // With styling.sectionLevels = 2, generates:
     * // [section-header][data-level="0"] { font-size: calc(var(--section-base-size, 1.125em) + var(--section-increment, 0.125em)) }
     * // [section-header][data-level="1"] { font-size: var(--section-base-size, 1.125em) }
     *
     * @returns {string} CSS rules for section header sizing or empty string if no sections
     */
    getSectionHeaderSizingRules() {
        const levels = this.options.styling.sectionLevels
        if (!levels) return ""

        return Array(levels)
            .fill(null)
            .map((_, level) => {
                const increments = levels - level - 1  // Higher level = fewer increments
                return `[section-header][data-level="${level}"] {
                    font-size: calc(var(--section-base-size, 1.125em) + (var(--section-increment, 0.125em) * ${increments}))
                }`
            })
            .join("\n")
    }

    /**
     * Generates CSS rules for section header indentation based on hierarchy level
     * Creates a visual hierarchy through consistent indentation steps
     *
     * Uses CSS variables with fallback values:
     * --section-indent: base indentation unit (defaults to 1em)
     *
     * @returns {string} CSS rules for section indentation
     */
    getSectionIndentRules() {
        const levels = this.options.styling.sectionLevels
        if (!levels) return ""

        // Rules for section headers using existing attributes
        const sectionRules = Array(levels)
            .fill(null)
            .map((_, level) => `
                [section-header][data-level="${level}"] {
                    padding-left: calc(${level} * var(--section-indent, 1rem));
                }
            `)
            .join("\n")

        // Rule for first index cell in each row
        const maxLevel = levels - 1
        const indexRule = `
            tbody:not([section-group]) tr:has(th[data-level="0"]) th,
            tbody:not([section-group]) tr:not(:has(th[data-level])) th {
                padding-left: calc(${maxLevel} * var(--section-indent, 1rem));
            }
        `

        return `${sectionRules}\n${indexRule}`
    }

    // MARK: Thead
    /**
     * Builds the complete table header structure based on column configuration
     * @returns {string} HTML string for table header
     */
    buildThead() {
        return this.data.columns.isMultiIndex
            ? this.buildMultiLevelHeader()
            : this.buildSingleLevelHeader()
    }

    /**
     * Builds header for tables with a single level of columns
     * @returns {string} HTML string for single-level header
     */
    buildSingleLevelHeader() {
        const columnGroups = this.buildColumnGroupsRow(0)

        return this.shouldCollapseColumns()
            ? this.buildColumnsRow()
            : `${columnGroups}${this.buildIndexNamesRow()}`
    }

    /**
     * Builds header for tables with multiple levels of columns
     * @returns {string} HTML string for multi-level header
     */
    buildMultiLevelHeader() {
        const levels = this.getLevelsForHeader()
        const groupRows = levels
            .map(level => this.buildColumnGroupsRow(level))
            .join("")

        return this.shouldCollapseColumns()
        ? `${groupRows}${this.buildColumnsRow()}`
        : `${groupRows}${this.buildIndexNamesRow()}`
    }

    /**
     * Determines which levels to include in the header based on collapse setting
     * @returns {number[]} Array of level indices to include
     */
    getLevelsForHeader() {
        const allLevels = this.data.columns.ilevels

        return this.shouldCollapseColumns()
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
     */
    buildIndexLabels() {
        // Get base index names (or create array of nulls if none exist)
        const allLabels = this.data.indexNames
            ? this.data.indexNames
            : Array(this.data.index.nlevels).fill(null)

        // Remove the number of levels that are being shown as sections
        const sectionLevels = this.options.styling.sectionLevels || 0
        const remainingLabels = allLabels.slice(sectionLevels)

        return remainingLabels
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
            "column-edge": this.data.columns.edges.slice(1).includes(iloc),
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

        // Adjust colspan to account for section levels
        const sectionLevels = this.options.styling.sectionLevels
        const columnSpan = this.data.index.nlevels - sectionLevels

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
            "column-edge": iloc > 0,
            "margin-edge-col": this.testMarginEdge(span.value)
        }

        return `<th ${this.buildAttributeString(attributes)}>${span.value[level]}</th>`
    }

    /**
     * Determines whether columns should be collapsed based on explicit settings
     * or automatic conditions.
     *
     * Columns are collapsed if:
     * - An explicit collapse setting was provided via attribute, or
     * - No column names are defined (or is an empty array), or
     * - For multi-index columns, the name of the last level is null
     *
     * @returns {boolean} True if columns should be collapsed, false otherwise
     */
    shouldCollapseColumns() {
        const { collapseColumns } = this.options.styling
        if (collapseColumns !== null) return collapseColumns

        if (!this.data.columnNames?.length) return true

        if (this.data.columns.isMultiIndex) {
            if (this.data.columnNames.at(-1) == null) return true
        }

        return false
    }

    // MARK: Body
    /**
     * Builds the complete table body structure, handling sections if needed
     */
    buildBody() {
        const sectionLevels = this.options.styling.sectionLevels

        // If no sections requested or not a multiindex, build single tbody
        if (!sectionLevels || !this.data.index.isMultiIndex) {
            return this.buildTbody(this.data)
        }

        // Get section groups and build content
        const groups = this.createDataGroupsFromSpans(sectionLevels)
        return groups.map(group => {
            const sections = [this.buildSectionHeader(group)]

            if (group.dataSlice) {
                const { start, end, dropLevels } = group.dataSlice
                const sectionData = this.data.createSlicedView(start, end, dropLevels)
                sections.push(this.buildTbody(sectionData))
            }

            return sections.join("")
        }).join("")
    }

    /**
     * Builds a tbody element containing data rows
     * @param {Data} data - Data object to build tbody from
     * @returns {string} HTML string for the table body
     */
    buildTbody(data) {
        const indexRows = this.buildIndexRows(data)

        data.values.forEach((row, irow) => {
            const dataCells = this.buildDataCells(row, irow)
            indexRows[irow] = indexRows[irow].concat(dataCells)
        })

        return `<tbody>${this.wrapRowsInTr(indexRows)}</tbody>`
    }

    /**
     * Builds header row for a section
     * @param {Object} group - Group object from createDataGroupsFromSpans
     */
    buildSectionHeader(group) {
        // Calculate remaining index levels (total - sections)
        const remainingLevels = this.data.index.nlevels - this.options.styling.sectionLevels

        // Create section header that spans remaining index levels
        const attributes = {
            colspan: remainingLevels,
            "data-level": group.level,
            "section-header": true
        }

        const label = group.label ?? this.options.naRep
        const headerCell = `<th ${this.buildAttributeString(attributes)}>${label}</th>`

        // Create cells for data columns with proper attributes
        const dataCells = Array(this.data.columns.length)
            .fill(null)
            .map((_, icol) => this.buildCell("", 0, icol))
            .join("")

        return `
            <tbody section-group>
                <tr>${headerCell}${dataCells}</tr>
            </tbody>
        `
    }

    /**
     * Creates data cells for a single row
     * @param {Array} row - Array of values for the row
     * @param {number} irow - Row index
     * @returns {string[]} Array of HTML strings for data cells
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
     */
    wrapRowsInTr(rows) {
        return rows
            .map(row => `<tr>${row.join("")}</tr>`)
            .join("")
    }

    /**
     * Builds index columns for table rows
     * @param {Data} data - Data object to build index from
     */
    buildIndexRows(data) {
        const indexRows = data.index.map(value => [this.buildIndex(value)])
        const levelsReversed = data.index.ilevels.slice(0, -1).reverse()

        levelsReversed.forEach(level =>
            this.addIndexSpans(level, indexRows, data))

        return indexRows
    }

    /**
     * Adds spanning cells for an index level
     * @param {number} level - Index level to process
     * @param {Array} indexRows - Array of row arrays to modify
     * @param {Data} data - Data object containing the spans
     */
    addIndexSpans(level, indexRows, data) {
        for (const span of data.index.spans[level]) {
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

    /**
     * Creates groups from index spans by converting outer levels into headers
     * @param {number} groupingLevels - Number of index levels to convert to headers
     * @returns {Array} Flattened array of groups with their data slice information
     */
    createDataGroupsFromSpans(groupingLevels = 0) {
        // Handle base case
        if (!groupingLevels || groupingLevels < 1) {
            return [{
                dataSlice: { start: 0, end: this.data.values.length, dropLevels: 0 }
            }]
        }

        const groups = []

        // Track last seen path
        let lastPath = Array(groupingLevels).fill(null)

        // Process deepest level spans
        const deepestSpans = this.data.index.spans[groupingLevels - 1]

        deepestSpans.forEach(span => {
            // Check if we need new headers at any level
            for (let level = 0; level < groupingLevels - 1; level++) {
                if (this.isNewPath(span.value, lastPath, level)) {
                    groups.push({
                        label: span.value[level],
                        level,
                        dataSlice: null
                    })
                    lastPath = [...span.value]
                }
            }

            // Add the data group
            groups.push({
                label: span.value[groupingLevels - 1],
                level: groupingLevels - 1,
                dataSlice: {
                    start: span.iloc,
                    end: span.iloc + span.count,
                    dropLevels: groupingLevels
                }
            })
        })

        return groups
    }

    isNewPath(currentPath, lastPath, level) {
        for (let i = 0; i <= level; i++) {
            if (currentPath[i] !== lastPath[i]) return true
        }
        return false
    }
}
