export const DraggableMixin = (superClass) => class extends superClass {
    constructor() {
        super()
        this.dragOffset = { x: 0, y: 0 }

        this.handleDragStart = this.handleDragStart.bind(this)
        this.handleDrag = this.handleDrag.bind(this)
        this.handleDragEnd = this.handleDragEnd.bind(this)
    }

    initializeDragHandle() {
        const handle = this.shadowRoot.querySelector("drag-handle")
        if (!handle) return

        handle.addEventListener("mousedown", this.handleDragStart)
        return handle
    }

    disconnectedCallback() {
        super.disconnectedCallback?.()

        const handle = this.shadowRoot.querySelector("drag-handle")
        if (handle) {
            handle.removeEventListener("mousedown", this.handleDragStart)
        }
        document.removeEventListener("mousemove", this.handleDrag)
        document.removeEventListener("mouseup", this.handleDragEnd)
    }

    get handle() {
        return this.shadowRoot.querySelector("drag-handle")
    }

    handleDragStart(event) {
        const rect = this.getBoundingClientRect()
        this.dragOffset = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        }

        document.addEventListener("mousemove", this.handleDrag)
        document.addEventListener("mouseup", this.handleDragEnd)
        event.target.setAttribute("data-dragging", "")
    }

    handleDrag(event) {
        this.style.left = `${event.clientX - this.dragOffset.x}px`
        this.style.top = `${event.clientY - this.dragOffset.y}px`
    }

    handleDragEnd() {
        document.removeEventListener("mousemove", this.handleDrag)
        document.removeEventListener("mouseup", this.handleDragEnd)

        if (this.handle) {
            this.handle.removeAttribute("data-dragging")
        }
    }
}
