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
            maximumFractionDigits: 2,
            useGrouping: true,
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
    },
    diffs: {
        label: "Difference",
        options: {
            signDisplay: "always",
            useGrouping: true,
        }
    },
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
    return presets[dtype] ?? {}
}

export function isCustomFormat(options, presets) {
    if (!options) return false
    return !Object.values(presets)
        .some(preset => JSON.stringify(preset.options) === JSON.stringify(options))
}

export function matchPreset(options, presets) {
    if (!options) return "standard"
    return Object.entries(presets)
        .find(([, preset]) =>
            JSON.stringify(preset.options) === JSON.stringify(options)
        )?.[0] ?? ""
}
