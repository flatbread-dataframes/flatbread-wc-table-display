export class Data {
    constructor(data) {
        this.columns = new Axis(data.columns)
        this.index = new Axis(data.index)
        this.values = data.data
        this.indexNames = data?.indexNames
        this.dtypes = data?.dtypes
        this.formatOptions = data?.formatOptions
    }
}


class Axis {
    constructor(values) {
        this.values = values
        this.spans = this.getSpans()
    }

    // Returns length of values on axis as int
    get length() { return this.values.length }
    // Returns number of levels on index as int
    get nlevels() { return this.values[0].length }
    // Returns levels on index as array of ints
    get ilevels() { return [...Array(this.nlevels).keys()] }
    // Returns positions on axis as array of ints
    get ilocs() { return [...Array(this.length).keys()] }
    // Returns whether axis has multiple levels
    get isMultiIndex() { return Array.isArray(this.values[0]) }

    // Returns axis spans as array of span objects
    getSpans() {
        if ( !this.isMultiIndex ) return null
        const levels = []
        this.ilevels.forEach(
            level => {
                if (level === this.nlevels - 1) { return } // skip final level
                const keys = this.values.map(i => i.slice(0, level + 1))
                const spans = Axis.getContiguousValueCounts(keys)
                levels.push(spans)
            }
        )
        return levels
    }

    // Reduces the values in an array to the number of contiguous occurrences
    static getContiguousValueCounts(arr) {
        const compareArrays = (arr1, arr2) => arr1.every((item, idx) => item === arr2[idx])
        let prev = []
        return arr.reduce((acc, cur, idx) => {
            if ( prev.length === 0 || !compareArrays(prev, cur) ) {
                acc.push({ iloc: idx, value: cur, count: 1 })
            } else { acc[acc.length - 1].count += 1 }
            prev = cur
            return acc
        }, [])
    }
}
