export class HTMLBuilder {
    constructor(data, options) {
        this.data = data
        this.options = options
    }

    buildTable() {
        return `
            <table>
                <thead>${this.buildThead()}</thead>
                <tbody>${this.buildTbody()}</tbody>
            </table>
        `
    }

    buildThead() {
        if (!this.data.columns.isMultiIndex) return this.buildColumnsRow()

        const theadLevelRows = this.data.columns.ilevels
            .slice(0, -1)
            .map(level => this.buildTheadLevelRow(level))
            .join("")
        return `${theadLevelRows}${this.buildColumnsRow()}`
    }

    buildTbody() {
        const indexRows = this.buildIndexRows()
        this.data.values.forEach((row, idx) => {
            const rowElements = row.map((value, colIdx) => `<td>${this.formatValue(value, colIdx)}</td>`)
            indexRows[idx] = indexRows[idx].concat(rowElements)
        })
        return indexRows.map(row => `<tr>${row.join("")}</tr>`).join("")
    }

    buildColumnsRow() {
        const indexLabels = this.data.indexNames
            ? this.data.indexNames.map(this.buildAxisHeader)
            : this.data.index.ilevels.map(() => "<th></th>")
        const columnHeaders = this.data.columns.values.map(this.buildAxisHeader)
        return `<tr>${indexLabels.join("")}${columnHeaders.join("")}</tr>`
    }

    buildTheadLevelRow(level) {
        const idxFill = this.data.index.ilevels.map(() => "<th></th>").join("")
        const headers = this.data.columns.spans[level].map((span, idx) =>
            `<th colspan="${span.count}" data-level="${level}" data-group="${idx}">${span.value[level]}</th>`
        ).join("")
        return `<tr>${idxFill}${headers}</tr>`
    }

    buildIndexRows() {
        const indexRows = this.data.index.values.map(value => [this.buildAxisHeader(value)])
        this.data.index.ilevels.slice(0, -1).forEach(level => {
            this.data.index.spans[level].forEach((span, idx) => {
                indexRows[span.iloc].unshift(`<th rowspan="${span.count}" data-level="${level}" data-group="${idx}">${span.value[level]}</th>`)
            })
        })
        return indexRows
    }

    buildAxisHeader(headerValue) {
        const value = Array.isArray(headerValue) ? headerValue.at(-1) : headerValue
        return `<th>${value}</th>`
    }

    formatValue(value, idx) {
        if (value === null || value === "") return this.options.naRep
        if (!this.data.dtypes) return value

        const dtype = this.data.dtypes[idx]
        const formatOptions = this.data.formatOptions?.[idx] ?? this.options

        switch (dtype) {
            case 'int':
            case 'float':
                return this.formatNumber(value, formatOptions)
            case 'datetime':
                return this.formatDate(value, formatOptions)
            default:
                return value.toString()
        }
    }

    formatNumber(value, options) {
        return value.toLocaleString(this.options.locale, options)
    }

    formatDate(value, options) {
        return new Date(value).toLocaleString(this.options.locale, options)
    }
}
