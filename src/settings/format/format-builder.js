import { InputDatalist } from "../../components/input-datalist.js"

export class FormatBuilder {
    constructor(spec, currentOptions = {}) {
        this.spec = spec
        this.currentOptions = currentOptions
    }

    buildFormControls() {
        if (!this.spec) return "No format options available"

        return Object.entries(this.spec.options)
            .map(([group, controls]) => this.buildFieldset(group, controls))
            .join("\n")
    }

    buildFieldset(group, controls) {
        const legend = controls.sectionLabel ?? group
        const formControls = Object.entries(controls)
            .filter(([key]) => key !== "sectionLabel")
            .map(([key, config]) => this.buildControl(key, config))
            .join("\n")

        // Only add dependent attribute if this fieldset is triggered by another control
        const isDependentGroup = this.isGroupDependent(group)
        const dependentAttr = isDependentGroup ? "data-dependent" : ""

        return `
            <fieldset data-group="${group}" ${dependentAttr}>
                <legend>${legend}</legend>
                ${formControls}
            </fieldset>`
    }

    isGroupDependent(group) {
        // Check all controls in all groups for any that target this group
        return Object.values(this.spec.options).some(controls =>
            Object.values(controls).some(config =>
                Object.values(config.controlMapping || {}).includes(group)
            )
        )
    }

    buildControl(key, config) {
        const builders = {
            select: this.buildSelect.bind(this),
            number: this.buildNumber.bind(this),
            boolean: this.buildCheckbox.bind(this),
            datalist: this.buildDatalist.bind(this),
        }

        const builder = builders[config.type]
        if (!builder) return ""

        return builder(key, config)
    }

    buildSelect(key, config) {
        const current = this.currentOptions[key]
        const options = config.options.map(opt => {
            const selected = opt === current ? "selected" : ""
            // Add data-group-target if this option triggers a dependent group
            const targetGroup = config.controlMapping?.[opt]
            const targetAttr = targetGroup ? `data-group-target="${targetGroup}"` : ""
            return `<option value="${opt}" ${targetAttr} ${selected}>${opt}</option>`
        }).join("")

        return `
            <label>
                ${config.label}
                <select name="${key}">
                    ${options}
                </select>
            </label>`
    }

    buildNumber(key, config) {
        const current = this.currentOptions[key]
        const min = config.min ? `min="${config.min}"` : ""
        const max = config.max ? `max="${config.max}"` : ""

        return `
            <label>
                ${config.label}
                <input type="number"
                    name="${key}"
                    value="${current ?? ""}"
                    ${min}
                    ${max}
                >
            </label>`
    }

    buildCheckbox(key, config) {
        const current = this.currentOptions[key]
        const checked = current ? "checked" : ""

        return `
            <label>
                <input type="checkbox"
                    name="${key}"
                    ${checked}
                >
                ${config.label}
            </label>`
    }

    buildDatalist(key, config) {
        const current = this.currentOptions[key]

        return `
            <label>
                ${config.label}
                <input-datalist
                    name="${key}"
                    common-options="${config.commonOptions.join(";")}"
                    options="${config.options.join(";")}"
                    value="${current}"
                >
                </select>
            </label>`
    }
}
