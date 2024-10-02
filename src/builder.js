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

        const formatters = {
            str: v => v,
            category: v => v,
            bool: v => v,
            int: v => this.formatNumber(v),
            float: v => this.formatNumber(v),
            datetime: v => this.formatDate(v)
        }

        const formatter = formatters[this.data.dtypes[idx]] || (v => v)
        return formatter(value)
    }

    formatNumber(value) {
        return new Intl.NumberFormat(this.options.locale).format(value)
    }

    formatDate(value) {
        const options = value.includes("T")
            ? {timeStyle: "short", dateStyle: "short"}
            : {dateStyle: "short"}
        return new Intl.DateTimeFormat(this.options.locale, options).format(new Date(value))
    }
}
