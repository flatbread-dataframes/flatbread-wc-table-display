export class TagInput extends HTMLElement {
    static get observedAttributes() {
        return ["name", "value", "options", "common-options"]
    }

    constructor() {
        super()
        this.attachShadow({ mode: "open" })

        this.handleInputKeydown = this.handleInputKeydown.bind(this)
        this.handleTagKeydown = this.handleTagKeydown.bind(this)
        this.handleTagClick = this.handleTagClick.bind(this)
        this.handleInputChange = this.handleInputChange.bind(this)

        this.render()
    }

    // MARK: setup
    connectedCallback() {
        this.addEventListeners()
    }

    disconnectedCallback() {
        this.removeEventListeners()
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return

        switch (name) {
            case "name":
                this.input?.setAttribute("name", newValue ?? "")
                break
            case "value":
                this.value = newValue ?? ""
                break
            case "options":
                const datalist = this.shadowRoot.querySelector("datalist")
                if (datalist) {
                    datalist.innerHTML = (newValue ?? "")
                        .split(";")
                        .map(opt => `<option value="${opt}">`)
                        .join("")
                }
                break
            case "common-options":
                // If we need to handle common options differently from regular options
                // we can add that logic here
                break
        }
    }

    addEventListeners() {
        this.input.addEventListener("keydown", this.handleInputKeydown)
        this.input.addEventListener("change", this.handleInputChange)
        this.tagsContainer.addEventListener("click", this.handleTagClick)
        this.tagsContainer.addEventListener("keydown", this.handleTagKeydown)
    }

    removeEventListeners() {
        this.input.removeEventListener("keydown", this.handleInputKeydown)
        this.input.removeEventListener("change", this.handleInputChange)
        this.tagsContainer.removeEventListener("click", this.handleTagClick)
        this.tagsContainer.removeEventListener("keydown", this.handleTagKeydown)
    }

    // MARK: get/set
    get input() {
        return this.shadowRoot.querySelector("input")
    }

    get tagsContainer() {
        return this.shadowRoot.querySelector(".tags")
    }

    get value() {
        return this.getTags().map(tag => tag.firstChild.textContent.trim())
    }

    set value(val) {
        const tags = Array.isArray(val) ? val : val.split(";").filter(Boolean)
        this.tagsContainer.innerHTML = tags
            .map(tag => this.buildTag(tag))
            .join("")
    }

    // MARK: handlers
    handleInputKeydown(event) {
        if (event.key === "Backspace" && !this.input.value) {
            const tags = this.getTags()
            if (tags.length) {
                event.preventDefault()
                tags[tags.length - 1].focus()
            }
            return
        }

        if (event.key === "ArrowLeft" && !this.input.value) {
            const tags = this.getTags()
            if (tags.length) {
                event.preventDefault()
                tags[tags.length - 1].focus()
            }
            return
        }

        if (event.key === "Enter" && this.input.value) {
            event.preventDefault()
            this.addTag(this.input.value)
            this.input.value = ""
        }
    }

    handleTagKeydown(event) {
        const tag = event.target.closest(".tag")
        if (!tag) return

        switch(event.key) {
            case "Backspace":
            case "Delete":
                const nextTag = tag.previousElementSibling || tag.nextElementSibling
                this.removeTag(tag)
                if (nextTag) {
                    nextTag.focus()
                } else {
                    this.input.focus()
                }
                break
            case "ArrowLeft":
                tag.previousElementSibling?.focus()
                break
            case "ArrowRight":
                if (tag.nextElementSibling) {
                    tag.nextElementSibling.focus()
                } else {
                    this.input.focus()
                }
                break
        }
    }

    handleTagClick(event) {
        const removeButton = event.target.closest(".remove")
        if (!removeButton) return

        const tag = removeButton.closest(".tag")
        this.removeTag(tag)
        this.input.focus()
    }

    handleInputChange() {
        this.dispatchEvent(new Event("change", { bubbles: true }))
    }

    // MARK: api
    getTags() {
        return [...this.tagsContainer.querySelectorAll(".tag")]
    }

    addTag(value) {
        if (!value || this.hasTag(value)) return

        const tagHtml = this.buildTag(value)
        this.tagsContainer.insertAdjacentHTML("beforeend", tagHtml)
        this.dispatchEvent(new Event("change", { bubbles: true }))
    }

    removeTag(tag) {
        tag.remove()
        this.dispatchEvent(new Event("change", { bubbles: true }))
    }

    hasTag(value) {
        return this.value.includes(value)
    }

    buildTag(text) {
        return `
            <span class="tag" data-value="${text}" tabindex="0">
                ${text}
                <button class="remove" tabindex="-1" aria-label="Remove ${text}">×</button>
            </span>`
    }

    // MARK: render
    render() {
        const styles = `
            *,
            *::before,
            *::after {
                box-sizing: border-box;
            }
            :host {
                display: grid;
                gap: 0.5rem;
            }
            .tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.25rem;
            }
            .tag {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.25rem 0.5rem;
                border: 1px solid var(--border-color, currentColor);
                border-radius: 1rem;
                cursor: default;
                outline: none;
                font-size: 0.8em;
            }
            .tag:focus {
                outline: 2px solid var(--border-color, currentColor);
            }
            .remove {
                display: grid;
                place-items: center;
                width: 1rem;
                height: 1rem;
                padding: 0;
                border: none;
                background: none;
                border-radius: 50%;
                cursor: pointer;
                color: inherit;
                opacity: 0.6;
            }
            .remove:hover {
                opacity: 1;
                background: var(--hover-color, #eee);
            }
            input {
                padding: 0.25rem;
            }
        `

        const optionsHtml = this.getAttribute("options")?.split(";")
            .map(opt => `<option value="${opt}">`)
            .join("") ?? ""

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div class="tags" role="list"></div>
            <input list="list" type="text" placeholder="Type to add...">
            <datalist id="list">${optionsHtml}</datalist>
        `
    }
}

customElements.define("tag-input", TagInput)
