export const NumberFormatSpec = {
    options: {
        format: {
            style: {
                type: "select",
                label: "Style",
                options: ["decimal", "currency", "percent"],
                default: "decimal",
                controlMapping: {
                    currency: "currencyOptions",
                    percent: "percentOptions"
                }
            },
            notation: {
                type: "select",
                label: "Notation",
                options: ["standard", "compact", "engineering", "scientific"],
                default: "standard",
            },
            useGrouping: {
                type: "boolean",
                label: "Show thousands separator",
                default: true
            },
            signDisplay: {
                type: "select",
                label: "Sign display",
                options: ["auto", "always", "never", "exceptZero"],
                default: "auto"
            },
            roundingMode: {
                type: "select",
                label: "Rounding mode",
                options: ["halfExpand", "ceil", "floor", "expand", "trunc"],
                default: "halfExpand"
            }
        },
        decimalOptions: {
            sectionLabel: "Decimal Format",
            minimumFractionDigits: {
                type: "number",
                label: "Minimum decimals",
                min: 0,
                max: 20,
                default: 2
            },
            maximumFractionDigits: {
                type: "number",
                label: "Maximum decimals",
                min: 0,
                max: 20,
                default: 2
            },
            trailingZeroDisplay: {
                type: "select",
                label: "Trailing zeros",
                options: ["auto", "stripIfInteger"],
                default: "auto"
            }
        },
        currencyOptions: {
            sectionLabel: "Currency Format",
            currency: {
                type: "select",
                label: "Currency",
                options: ["EUR", "USD", "GBP"],
                default: "EUR"
            },
            currencyDisplay: {
                type: "select",
                label: "Currency display",
                options: ["symbol", "narrowSymbol", "code", "name"],
                default: "symbol"
            },
            currencySign: {
                type: "select",
                label: "Sign display",
                options: ["standard", "accounting"],
                default: "standard"
            }
        },
        percentOptions: {
            sectionLabel: "Percent Format",
            scale: {
                type: "number",
                label: "Scale factor",
                min: 1,
                max: 100,
                default: 1
            }
        }
    }
}

export const DateFormatSpec = {
    options: {
        format: {
            formatType: {
                type: "select",
                label: "Format type",
                options: ["preset", "custom"],
                default: "preset",
                controlMapping: {
                    preset: "presetOptions",
                    custom: "customOptions"
                }
            }
        },
        presetOptions: {
            sectionLabel: "Preset Format",
            dateStyle: {
                type: "select",
                label: "Date style",
                options: ["full", "long", "medium", "short", "none"],
                default: "short"
            },
            timeStyle: {
                type: "select",
                label: "Time style",
                options: ["full", "long", "medium", "short", "none"],
                default: "none"
            }
        },
        customOptions: {
            sectionLabel: "Custom Format",
            weekday: {
                type: "select",
                label: "Weekday",
                options: ["long", "short", "narrow", "none"],
                default: "none"
            },
            era: {
                type: "select",
                label: "Era",
                options: ["long", "short", "narrow", "none"],
                default: "none"
            },
            year: {
                type: "select",
                label: "Year",
                options: ["numeric", "2-digit", "none"],
                default: "numeric"
            },
            month: {
                type: "select",
                label: "Month",
                options: ["numeric", "2-digit", "long", "short", "narrow", "none"],
                default: "numeric"
            },
            day: {
                type: "select",
                label: "Day",
                options: ["numeric", "2-digit", "none"],
                default: "numeric"
            },
            hour: {
                type: "select",
                label: "Hour",
                options: ["numeric", "2-digit", "none"],
                default: "none"
            },
            minute: {
                type: "select",
                label: "Minute",
                options: ["numeric", "2-digit", "none"],
                default: "none"
            },
            second: {
                type: "select",
                label: "Second",
                options: ["numeric", "2-digit", "none"],
                default: "none"
            },
            hourCycle: {
                type: "select",
                label: "Hour cycle",
                options: ["h11", "h12", "h23", "h24"],
                default: "h23"
            }
        }
    }
}
