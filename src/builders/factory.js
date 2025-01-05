import { DefaultTableBuilder } from "./default-builder.js"

export class TableBuilderFactory {
    static create(type, data, options) {
        const builders = {
            default: DefaultTableBuilder
            // Add more builders as needed
        }

        const BuilderClass = builders[type]
        if (!BuilderClass) {
            throw new Error(`Unknown table type: ${type}`)
        }

        return new BuilderClass(data, options)
    }
}
