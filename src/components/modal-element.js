import { DraggableMixin } from "./drag/draggable-mixin.js"
import { DragHandle } from "./drag/drag-handle.js"
import { MEDIA_QUERIES, BREAKPOINTS } from "../config.js"

export class ModalElement extends DraggableMixin(HTMLElement) {
    static modalStacks = new WeakMap()

    constructor() {
        super()
        this.attachShadow({ mode: "open" })

        this.handleOpen = this.handleOpen.bind(this)
        this.handleClose = this.handleClose.bind(this)
        this.handleEscape = this.handleEscape.bind(this)
        this.handleDocumentClick = this.handleDocumentClick.bind(this)
    }

    // MARK: setup
    connectedCallback() {
        // Find and store data-viewer reference first
        let node = this
        while (node) {
            if (node instanceof HTMLElement && node.tagName.toLowerCase() === "data-viewer") {
                this.dataViewer = node
                break
            }
            node = node.getRootNode().host
        }

        document.addEventListener("keydown", this.handleEscape)
        document.addEventListener("click", this.handleDocumentClick)
        this.modalStack.push(this)
        this.render()
        this.initializeDragHandle()
        this.position()
        this.handleOpen()
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        document.removeEventListener("keydown", this.handleEscape)
        document.removeEventListener("click", this.handleDocumentClick)

        const stack = this.modalStack
        const index = stack.indexOf(this)
        if (index > -1) {
            stack.splice(index, 1)
        }
    }

    // MARK: get/set
    get modalStack() {
        if (!this.dataViewer) {
            console.warn("Modal not connected to a data-viewer")
            return []
        }

        if (!ModalElement.modalStacks.has(this.dataViewer)) {
            ModalElement.modalStacks.set(this.dataViewer, [])
        }
        return ModalElement.modalStacks.get(this.dataViewer)
    }

    get isTopModal() {
        const stack = this.modalStack
        return stack.length > 0 && stack[stack.length - 1] === this
    }

    // MARK: handlers
    handleOpen() {
        this.dispatchEvent(new CustomEvent("modal-open", {
            bubbles: true,
            composed: true,
        }))
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent("modal-close", {
            bubbles: true,
            composed: true,
        }))
        this.remove()
    }

    handleEscape(event) {
        if (event.key === "Escape" && this.isTopModal) {
            this.handleClose()
        }
    }

    handleDocumentClick(event) {
        if (!this.isTopModal) return

        const path = event.composedPath()
        const isInModal = path.some(node => node === this ||
            (node instanceof Element && node.tagName.toLowerCase() === this.tagName.toLowerCase()))

        if (!isInModal) {
            this.handleClose()
        }
    }

    // MARK: api
    position() {
        if (!MEDIA_QUERIES.POPUP_MOBILE.matches) return
        const rect = this.getBoundingClientRect()
        this.style.left = `${(window.innerWidth - rect.width) / 2}px`
        this.style.top = `${(window.innerHeight - rect.height) / 2}px`
    }

    // MARK: render
    getBaseStyles() {
        return `
            *,
            *::before,
            *::after {
                box-sizing: border-box
            }
            :host {
                box-sizing: border-box;
                display: block;
                position: fixed;
                background-color: var(--background-color, var(--surface-color));
                border: 1px solid var(--border-color, currentColor);
                border-radius: 4px;
                padding: 1rem;
                z-index: 1000;

                @media (max-width: ${BREAKPOINTS.POPUP_MOBILE}) {
                    inset: 1rem 1rem auto 1rem;
                    min-width: 0;
                    max-height: calc(100vh - 2rem);
                }
            }

            header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                h3 {
                    margin-top: 0;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid var(--border-color, currentColor);
                }
            }
        `
    }

    getComponentStyles() {
        return ""
    }

    buildHeader(title) {
        return `
            <header>
                <h3>${title}</h3>
                <drag-handle></drag-handle>
            </header>
        `
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>${this.getBaseStyles()}${this.getComponentStyles()}</style>
            ${this.buildContent()}`
    }

    // To be implemented by child classes
    buildContent() {
        throw new Error("buildContent must be implemented by child class")
    }
}
