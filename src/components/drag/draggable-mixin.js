export const DraggableMixin = (superClass) => class extends superClass {
    constructor() {
        super()
        this.dragOffset = { x: 0, y: 0 }

        this.handleDragStart = this.handleDragStart.bind(this)
        this.handleDrag = this.handleDrag.bind(this)
        this.handleDragEnd = this.handleDragEnd.bind(this)
    }

    initializeDragHandle() {
        if (!this.handle) return

        this.handle.addEventListener("mousedown", this.handleDragStart)
        this.handle.addEventListener("touchstart", this.handleDragStart)
    }

    disconnectedCallback() {
        super.disconnectedCallback?.()

        if (this.handle) {
            this.handle.removeEventListener("mousedown", this.handleDragStart)
            this.handle.removeEventListener("touchstart", this.handleDragStart)
        }
        document.removeEventListener("mousemove", this.handleDrag)
        document.removeEventListener("mouseup", this.handleDragEnd)
        document.removeEventListener("touchmove", this.handleDrag, { passive: false })
        document.removeEventListener("touchend", this.handleDragEnd)
    }

    get handle() {
        return this.shadowRoot.querySelector("flatbread-table-drag-handle")
    }

    handleDragStart(event) {
        const point = event.touches ? event.touches[0] : event
        const rect = this.getBoundingClientRect()
        this.dragOffset = {
            x: point.clientX - rect.left,
            y: point.clientY - rect.top
        }

        if (event.touches) {
            document.addEventListener("touchmove", this.handleDrag, { passive: false })
            document.addEventListener("touchend", this.handleDragEnd)
        } else {
            document.addEventListener("mousemove", this.handleDrag)
            document.addEventListener("mouseup", this.handleDragEnd)
        }
        event.target.setAttribute("data-dragging", "")
    }

    handleDrag(event) {
        const point = event.touches ? event.touches[0] : event
        this.style.left = `${point.clientX - this.dragOffset.x}px`
        this.style.top = `${point.clientY - this.dragOffset.y}px`
        if (event.touches) event.preventDefault()
    }

    handleDragEnd() {
        document.removeEventListener("mousemove", this.handleDrag)
        document.removeEventListener("mouseup", this.handleDragEnd)
        document.removeEventListener("touchmove", this.handleDrag)
        document.removeEventListener("touchend", this.handleDragEnd)

        if (this.handle) {
            this.handle.removeAttribute("data-dragging")
        }
    }
}
