export class DragHandle extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: "open" })
    }

    connectedCallback() {
        this.render()
    }

    render() {
        const styles = `
            :host {
                display: inline-grid;
                place-items: center;
                padding: 0.5rem;
                cursor: grab;
                user-select: none;
            }

            :host([data-dragging]) {
                cursor: grabbing;
            }

            .grip {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 2px;
                opacity: 0.6;
            }

            .dot {
                width: 3px;
                height: 3px;
                background: currentColor;
                border-radius: 50%;
            }
        `

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div class="grip">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `
    }
}

customElements.define("drag-handle", DragHandle)
