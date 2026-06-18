import { Columns } from "./axis/columns.js"
import { Index } from "./axis/index.js"    // CHANGED: was Axis

export class Data extends EventTarget {
    constructor(data={}) {
        super()
        this._isUpdating = false
        this.setData(data)
    }

    // MARK: setter
    _setter(prop, value) {
        if (this[prop] !== value) {
            this[prop] = value
            if (!this._isUpdating) {
                this.dispatchEvent(new Event("data-changed"))
            }
        }
    }

    setData(data) {
        this._isUpdating = true
        this._rawData = data

        const { columns = {}, index = {}, values = [] } = data

        this._columns = columns instanceof Columns
            ? columns
            : new Columns(columns)
        this._index = index instanceof Index
            ? index
            : new Index(index)
        this._values = values

        this._isUpdating = false
        this.dispatchEvent(new Event("data-changed"))
    }

    // CHANGED: adopts data-viewer style update with nested changes
    update(changes) {
        this._isUpdating = true

        if ("columns" in changes) {
            this._columns = new Columns({
                values: this._columns.values,
                names: this._columns.names,
                dtypes: this._columns.dtypes,
                formatOptions: this._columns.formatOptions,
                ...changes.columns
            })
        }

        if ("index" in changes) {
            this._index = new Index({
                values: this._index.values,
                names: this._index.names,
                dtypes: this._index.dtypes,
                formatOptions: this._index.formatOptions,
                ...changes.index
            })
        }

        if ("values" in changes) {
            this._values = changes.values
        }

        this._isUpdating = false
        this.dispatchEvent(new Event("data-changed"))
    }

    get isEmpty() {
        return (
            this.index.isEmpty &&
            this.columns.isEmpty &&
            (!this.values?.length || !this.values.some(row => row.length))
        )
    }

    // MARK: columns
    // CHANGED: removed convenience getters/setters for
    //   columnNames, indexNames, dtypes, formatOptions
    //   access via columns.names, index.names, columns.dtypes, etc.
    get columns() { return this._columns }
    set columns(value) {
        const columns = value instanceof Columns ? value : new Columns(value)
        this._setter("_columns", columns)
    }

    // MARK: index
    get index() { return this._index }
    set index(value) {
        const index = value instanceof Index ? value : new Index(value)
        this._setter("_index", index)
    }

    // MARK: values
    get values() { return this._values }
    set values(value) { this._setter("_values", value) }

    // MARK: slice
    /**
     * Creates a new Data instance with a subset of rows and optionally fewer index levels
     * @param {number} startRow - Starting row index (inclusive)
     * @param {number} endRow - Ending row index (exclusive)
     * @param {number} dropLevels - Number of outer index levels to remove
     * @returns {Data} A new Data instance with the sliced view
     */
    // CHANGED: uses nested format
    createSlicedView(startRow, endRow, dropLevels = 0) {
        const slicedValues = this.values.slice(startRow, endRow)

        const indexValues = this.index.values
            .slice(startRow, endRow)
            .map(value =>
                Array.isArray(value)
                    ? value.slice(dropLevels)
                    : value
            )

        return new Data({
            values: slicedValues,
            columns: {
                values: this.columns.values,
                names: this.columns.names,
                dtypes: this.columns.dtypes,
                formatOptions: this.columns.formatOptions,
            },
            index: {
                values: indexValues,
                names: this.index.names?.slice(dropLevels),
                dtypes: this.index.dtypes?.slice(dropLevels),
                formatOptions: this.index.formatOptions?.slice(dropLevels),
            },
        })
    }

    // MARK: trim
    /**
     * Creates a trimmed view of the data that respects max rows/columns
     * @param {Object} options Trimming options
     * @returns {Data} New Data instance with trimmed view
     */
    // CHANGED: uses nested format, dtypes/formatOptions handled within columns object
    createTrimmedView(options) {
        const { maxRows, maxColumns, trimSize, separator } = options.truncation
        let values = this.values
        let indexValues = this.index.values
        let columnValues = this.columns.values

        // Handle rows if needed
        if (values.length > maxRows) {
            const head = values.slice(0, trimSize)
            const tail = values.slice(-trimSize)
            const sepRow = Array(this.columns.length).fill(separator)
            values = [...head, sepRow, ...tail]

            const headIdx = indexValues.slice(0, trimSize)
            const tailIdx = indexValues.slice(-trimSize)
            const sepIdx = Array.isArray(indexValues[0])
                ? Array(this.index.nlevels).fill(separator)
                : separator
            indexValues = [...headIdx, sepIdx, ...tailIdx]
        }

        // Handle columns if needed
        if (this.columns.length > maxColumns) {
            const headCols = columnValues.slice(0, trimSize)
            const tailCols = columnValues.slice(-trimSize)
            const sepCol = Array.isArray(columnValues[0])
                ? Array(this.columns.nlevels).fill(separator)
                : separator
            columnValues = [...headCols, sepCol, ...tailCols]

            values = values.map(row => {
                const headVals = row.slice(0, trimSize)
                const tailVals = row.slice(-trimSize)
                return [...headVals, separator, ...tailVals]
            })

            return new Data({
                values,
                columns: {
                    values: columnValues,
                    names: this.columns.names,
                    dtypes: this.columns.dtypes && [
                        ...this.columns.dtypes.slice(0, trimSize),
                        "[sep]",
                        ...this.columns.dtypes.slice(-trimSize)
                    ],
                    formatOptions: this.columns.formatOptions && [
                        ...this.columns.formatOptions.slice(0, trimSize),
                        null,
                        ...this.columns.formatOptions.slice(-trimSize)
                    ],
                },
                index: {
                    values: indexValues,
                    names: this.index.names,
                    dtypes: this.index.dtypes,
                    formatOptions: this.index.formatOptions,
                },
            })
        }

        // Row-only trimming or no trimming needed
        if (values !== this.values) {
            return new Data({
                values,
                columns: {
                    values: this.columns.values,
                    names: this.columns.names,
                    dtypes: this.columns.dtypes,
                    formatOptions: this.columns.formatOptions,
                },
                index: {
                    values: indexValues,
                    names: this.index.names,
                    dtypes: this.index.dtypes,
                    formatOptions: this.index.formatOptions,
                },
            })
        }

        return this
    }
}