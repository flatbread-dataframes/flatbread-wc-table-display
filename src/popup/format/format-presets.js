export const NumberPresets = {
    default: {
        label: "Standard",
        options: {}
    },
    currency: {
        label: "Currency (€)",
        options: {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    },
    percentage: {
        label: "Percentage",
        options: {
            style: "percent",
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    },
    compact: {
        label: "Compact",
        options: {
            notation: "compact",
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    }
}

export const DatePresets = {
    default: {
        label: "Standard",
        options: {}
    },
    date: {
        label: "Date only",
        options: {
            dateStyle: "short"
        }
    },
    datetime: {
        label: "Date & Time",
        options: {
            dateStyle: "short",
            timeStyle: "short"
        }
    }
}

export function getPresetsForType(dtype) {
    const presets = {
        float: NumberPresets,
        int: NumberPresets,
        datetime: DatePresets
    }
    return presets[dtype] || {}
}
