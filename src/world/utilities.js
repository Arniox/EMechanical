export default class Utilities {
    static ui = {
        // Panels
        infoPanel: document.getElementById('selectedObjectInfo'),
        forcePanel: document.getElementById('forceInput'),
        // Inputs
        worldSizeInput: document.getElementById("worldSizeInput"),
        unitSelect: document.getElementById("unitSelect"),
        forceXInput: document.getElementById('forceX'),
        forceYInput: document.getElementById('forceY'),
        forceZInput: document.getElementById('forceZ'),
        showGridCheckBox: document.getElementById("showGrid"),
        // Buttons
        addNodeButton: document.getElementById('addNode'),
        applyForceButton: document.getElementById('applyForce'),
        deleteButton: document.getElementById('deleteSelected'),
        linkButton: document.getElementById('addMember'),
        resetViewButton: document.getElementById("resetView"),
        // Outputs
        worldSizeOutput: document.getElementById("worldSizeValue"),
    };

    // Static Fields - Shared across all instances
    /**
     * @returns {number} The raw world size in units
     */
    static get worldSize() {
        return this.ui.worldSizeInput ? parseFloat(this.ui.worldSizeInput.value) : 1;
    }
    /**
     * @returns {string} The world size unit
     */
    static get unit() {
        return this.ui.unitSelect ? this.ui.unitSelect.value : "m";
    }
    /**
     * @returns {number} The world size scaled to the world unit
     */
    static get worldScale() {
        return this.convertUnit(this.worldSize);
    }

    static unitConversion = {
        "pm": 1e-12,
        "nm": 1e-9,
        "μm": 1e-6,
        "mm": 1e-3,
        "cm": 1e-2,
        "m": 1,
        "km": 1e3,
        "au": 149597870700,
        "ly": 9.4607e15,
        "pc": 3.08567758149137e16,
        "in": 0.0254,
        "ft": 0.3048,
        "yd": 0.9144,
        "mi": 1609.344,
        "ftm": 1.8288,
        "nmi": 1852,
    };
    static keyState = {}; // For key state tracking

    /**
     * Converts an input value to the currently selected unit
     * @param {number} value
     */
    static convertUnit(value) {
        if (this.unit in this.unitConversion) {
            return value * this.unitConversion[this.unit];
        } else {
            console.warn(`Unit "${this.unit}" not recognized. Returning original value.`);
            return value;
        }
    }

    /**
     * This function updates the world size and unit based on the input fields.
     */
    static updateInputs() {
        this.worldSize = this.ui.worldSizeInput ? parseFloat(this.ui.worldSizeInput.value) : 1;
        this.unit = this.ui.unitSelect ? this.ui.unitSelect.value : "m";
    }

    /**
     * This function converts a number into scientific notation (using toExponential) and then adjusts the significand (mantissa)
     * Such that it is no longer than 5 characters (excluding the "e…")—leaving room for the exponent.
     * @param {number} value 
     */
    static stringifiyUnit(value) {
        // First, check the plain string version.
        let plain = value.toString();
        if (!plain.includes("e") && plain.length <= 7) {
            return plain;
        }

        // Otherwise, try exponential notation with decreasing fraction digits.
        for (let frac = 6; frac >= 0; frac--) {
            let expStr = value.toExponential(frac); // e.g., "1.234560e+3"
            let [mantissa, exponent] = expStr.split("e");
            // Remove the decimal point to count only digits.
            let digits = mantissa.replace(".", "");
            if (digits.length <= 7) {
                // If the exponent is zero, return just the mantissa.
                if (parseInt(exponent, 10) === 0) {
                    return mantissa;
                }
                return mantissa + "e" + exponent;
            }
        }
        // Fallback
        return value.toExponential(0);
    }

    /**
     * Map a number from one range to another.
     * This function takes a number n and maps it from the range [start1, stop1] to the range [start2, stop2].
     * If withinBounds is true, the function will constrain the result to the new range.
     * If withinBounds is false, the function will return the mapped value without constraining it.
     * @param {number} value 
     * @param {number} start1 
     * @param {number} stop1 
     * @param {number} start2 
     * @param {number} stop2 
     * @param {boolean} withinBounds 
     * @returns 
     */
    static mapRangeToRange(value, start1, stop1, start2, stop2, withinBounds) {
        const newval = (value - start1) / (stop1 - start1) * (stop2 - start2) + start2;
        if (!withinBounds) {
            return newval;
        }
        if (start2 < stop2) {
            return constrainNumber(newval, start2, stop2);
        } else {
            return constrainNumber(newval, stop2, start2);
        }
    }

    /**
     * Constrain a number to a specific range (low to high).
     * This function ensures that the number does not exceed the specified limits.
     * If the number is less than low, it will return low.
     * If the number is greater than high, it will return high.
     * Otherwise, it will return the number itself.
     * @param {number} value 
     * @param {number} low 
     * @param {number} high 
     * @returns 
     */
    static constrainNumber(value, low, high) {
        return Math.max(Math.min(value, high), low);
    }
}