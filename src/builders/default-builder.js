import { BaseTableBuilder } from "./base-builder.js"

export class DefaultTableBuilder extends BaseTableBuilder {
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

    buildThead() {
        const singleLevel = !this.data.columns.isMultiIndex
        const { collapseColumns } = this.options.styling

        const groupLevels = this.data.columns.ilevels.slice(0, -1)
        const collapsedLevels = this.data.columns.ilevels

        if (singleLevel) {
            const columnGroups = this.buildColumnGroupsRow(0)
            return collapseColumns
                ? this.buildColumnsRow()
                : `${columnGroups}${this.buildIndexNamesRow()}`
        }

        const levels = collapseColumns ? groupLevels : collapsedLevels
        const columnGroupsRows = levels
            .map(level => this.buildColumnGroupsRow(level))
            .join("")

        const finalRow = collapseColumns
            ? this.buildColumnsRow()
            : this.buildIndexNamesRow()

        return `${columnGroupsRows}${finalRow}`
    }

    buildColumnsRow() {
        const indexLabels = this.data.indexNames
            ? this.data.indexNames.map(name => `<th class="indexLabel">${name ?? ""}</th>`)
            : this.data.index.ilevels.map(() => `<th class="indexLabel"></th>`)
        const columnHeaders = this.data.columns.map((value, idx) => this.buildColumnLabel(value, idx))
        return `<tr>${indexLabels.join("")}${columnHeaders.join("")}</tr>`
    }

    buildIndexNamesRow() {
        const indexLabels = this.data.indexNames
            ? this.data.indexNames.map(name => `<th class="indexLabel">${name ?? ""}</th>`)
            : this.data.index.ilevels.map(() => `<th class="indexLabel"></th>`)
        const emptyHeaders = Array.from({ length: this.data.columns.length }, () => "")
        const columnHeaders = emptyHeaders.map((value, idx) => this.buildColumnLabel(value, idx))
        return `<tr>${indexLabels.join("")}${columnHeaders.join("")}</tr>`
    }

    buildColumnLabel(value, iloc) {
        const isMarginEdgeColumn = this.testMarginEdge(value)
        const attrs = this.data.columns.attrs[iloc]
        const selectedValue = Array.isArray(value) ? value.at(-1) : value
        const groups = attrs.groups.join(" ")
        const isIndexEdge = iloc === 0
        const isGroupEdge = this.data.columns.edges.slice(1).includes(iloc)
        return `<th
            data-col="${iloc}"
            data-groups="${groups}"
            ${isIndexEdge ? "index-edge" : ""}
            ${isGroupEdge ? "group-edge" : ""}
            ${isMarginEdgeColumn ? "margin-edge-col" : ""}
        >${selectedValue}</th>`
    }

    buildColumnGroupsRow(level) {
        const columnLabel = this.data.columnNames?.[level] ?? ""
        const columnLabelElement = `<th colspan="${this.data.index.nlevels}" class="columnLabel">${columnLabel}</th>`
        const headers = this.data.columns.spans[level]
            .map((span, iloc) => this.buildColumnGroupLabel(span, iloc, level))
            .join("")
        return `<tr>${columnLabelElement}${headers}</tr>`
    }

    buildColumnGroupLabel(span, iloc, level) {
        const isIndexEdge = iloc === 0
        const isGroupEdge = iloc > 0
        const isMarginEdgeColumn = this.testMarginEdge(span.value)
        return `<th
            colspan="${span.count}"
            data-level="${level}"
            data-group="${iloc}"
            ${isIndexEdge ? "index-edge" : ""}
            ${isGroupEdge ? "group-edge" : ""}
            ${isMarginEdgeColumn ? "margin-edge-col" : ""}
        >${span.value[level]}</th>`
    }

    buildTbody() {
        const indexRows = this.buildIndexRows()
        this.data.values.forEach((row, irow) => {
            const rowElements = row.map((value, icol) => this.buildCell(value, irow, icol))
            indexRows[irow] = indexRows[irow].concat(rowElements)
        })
        return indexRows.map(row => `<tr>${row.join("")}</tr>`).join("")
    }

    buildIndexRows() {
        const indexRows = this.data.index.map(value => [this.buildIndex(value)])
        const levelsReversed = this.data.index.ilevels.slice(0, -1).reverse()
        levelsReversed.forEach(level => {
            for (const span of this.data.index.spans[level]) {
                const isMarginEdgeIndex = this.testMarginEdge(span.value)
                const th = `<th
                    rowspan="${span.count}"
                    data-level="${level}"
                    data-group="${span.group}"
                    ${isMarginEdgeIndex ? "margin-edge-idx" : ""}
                >${span.value[level]}</th>`
                indexRows[span.iloc].unshift(th)
            }
        })
        return indexRows
    }

    buildIndex(value) {
        const isMarginEdgeIndex = this.testMarginEdge(value)
        value = Array.isArray(value) ? value.at(-1) : value
        return `<th ${isMarginEdgeIndex ? "margin-edge-idx" : ""}>${value}</th>`
    }
}
