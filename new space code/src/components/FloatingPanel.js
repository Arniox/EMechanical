/**
 * FloatingPanel.js
 * A reusable component for creating floating UI panels in the 3D space
 */
import * as THREE from "three";

export class FloatingPanel {
    /**
     * Create a floating panel that follows a 3D object
     * @param {Object} options - Configuration options
     * @param {THREE.Object3D} options.target - The 3D object to follow
     * @param {THREE.Camera} options.camera - The camera for positioning
     * @param {THREE.Scene} options.scene - The scene to add the panel to
     * @param {string} options.title - Title of the panel
     * @param {Object} options.fields - Fields to display in the panel
     * @param {string} options.panelId - Unique ID for the panel
     * @param {function} options.onUpdate - Callback when values are updated
     */
    constructor(options) {
        this.target = options.target;
        this.camera = options.camera;
        this.scene = options.scene;
        this.title = options.title || "Panel";
        this.fields = options.fields || {};
        this.panelId = options.panelId || `panel-${Math.random().toString(36).substr(2, 9)}`;
        this.onUpdate = options.onUpdate || (() => { });
        this.visible = true;
        this.offset = options.offset || new THREE.Vector3(0, 0.1, 0);

        // Create DOM element
        this.createDOMElement();

        // Position the panel initially
        this.updatePosition();
    }

    /**
     * Create the DOM element for the floating panel
     */
    createDOMElement() {
        // Remove existing panel if it exists
        const existingPanel = document.getElementById(this.panelId);
        if (existingPanel) {
            existingPanel.remove();
        }

        // Create panel container
        this.element = document.createElement('div');
        this.element.id = this.panelId;
        this.element.className = 'floating-panel';

        // Create header
        const header = document.createElement('div');
        header.className = 'floating-panel-header';
        header.textContent = this.title;

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'floating-panel-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => this.hide());
        header.appendChild(closeBtn);

        this.element.appendChild(header);

        // Create content container
        const content = document.createElement('div');
        content.className = 'floating-panel-content';

        // Add fields
        this.inputElements = {};
        Object.entries(this.fields).forEach(([key, field]) => {
            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'floating-panel-field';

            const label = document.createElement('label');
            label.textContent = field.label || key;
            label.htmlFor = `${this.panelId}-${key}`;

            const input = document.createElement('input');
            input.id = `${this.panelId}-${key}`;
            input.type = field.type || 'text';
            input.value = field.value !== undefined ? field.value : '';
            input.step = field.step || 'any';
            input.min = field.min !== undefined ? field.min : '';
            input.max = field.max !== undefined ? field.max : '';
            input.readOnly = field.readOnly || false;

            if (field.readOnly) {
                input.className = 'read-only';
            }

            // Add event listener for input changes
            input.addEventListener('change', () => {
                this.onFieldChange(key, input.value);
            });

            // Store reference to input element
            this.inputElements[key] = input;

            fieldContainer.appendChild(label);
            fieldContainer.appendChild(input);

            // Add formula display if provided
            if (field.formula) {
                const formula = document.createElement('div');
                formula.className = 'floating-panel-formula';
                formula.innerHTML = field.formula;
                fieldContainer.appendChild(formula);
            }

            content.appendChild(fieldContainer);
        });

        this.element.appendChild(content);

        // Add to document
        document.body.appendChild(this.element);
    }

    /**
     * Handle field value changes
     * @param {string} key - Field key
     * @param {*} value - New value
     */
    onFieldChange(key, value) {
        if (this.fields[key]) {
            // Update the field value
            this.fields[key].value = value;

            // Call the update callback
            this.onUpdate(key, value, this.fields);
        }
    }

    /**
     * Update a field value programmatically
     * @param {string} key - Field key
     * @param {*} value - New value
     * @param {string} formula - Optional formula to display
     */
    updateField(key, value, formula = null) {
        if (this.fields[key] && this.inputElements[key]) {
            this.fields[key].value = value;
            this.inputElements[key].value = value;

            // Update formula if provided
            if (formula !== null) {
                this.fields[key].formula = formula;

                // Find and update the formula element
                const fieldContainer = this.inputElements[key].parentElement;
                let formulaElement = fieldContainer.querySelector('.floating-panel-formula');

                if (!formulaElement && formula) {
                    formulaElement = document.createElement('div');
                    formulaElement.className = 'floating-panel-formula';
                    fieldContainer.appendChild(formulaElement);
                }

                if (formulaElement) {
                    formulaElement.innerHTML = formula;
                }
            }
        }
    }

    /**
     * Update the position of the panel to follow the target
     */
    updatePosition() {
        if (!this.visible || !this.target || !this.element) return;

        // Get target position in world space
        const targetPosition = new THREE.Vector3();
        this.target.getWorldPosition(targetPosition);

        // Add offset
        targetPosition.add(this.offset);

        // Project to screen space
        const screenPosition = targetPosition.clone();
        screenPosition.project(this.camera);

        // Convert to CSS coordinates
        const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(screenPosition.y * 0.5) + 0.5) * window.innerHeight;

        // Apply position to element with transform for better performance
        this.element.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;

        // Check if behind camera and hide if necessary
        if (screenPosition.z > 1) {
            this.element.style.display = 'none';
        } else {
            this.element.style.display = 'block';
        }
    }

    /**
     * Show the panel
     */
    show() {
        this.visible = true;
        this.element.style.display = 'block';
        this.updatePosition();
    }

    /**
     * Hide the panel
     */
    hide() {
        this.visible = false;
        this.element.style.display = 'none';
    }

    /**
     * Remove the panel completely
     */
    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
