// src/computation.js
import * as THREE from "three";
import { nodes, members, createForceVisualization } from './objects.js';

// Conversion factors from meter to the desired unit.
const unitConversion = {
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

export function runComputations() {
    // This could be triggered by the "Calculate Forces" button
    // For now, it's just a placeholder
}

// Function to get all nodes in the scene
export function getAllNodes() {
    return nodes.filter(obj => obj.userData.type === 'node');
}

// Function to get all members in the scene
export function getAllMembers() {
    return members.filter(obj => obj.userData.type === 'member');
}

// Function to calculate the forces in each member
export function calculateMemberForces() {
    const membersList = getAllMembers();
    const results = [];

    for (const member of membersList) {
        const startNode = member.userData.startNode;
        const endNode = member.userData.endNode;
        const currentLength = startNode.position.distanceTo(endNode.position);
        // If you need an original length, make sure to store it when creating the member.
        const originalLength = member.userData.originalLength || currentLength;
        const strain = (currentLength - originalLength) / originalLength;
        const stress = strain * member.userData.stiffness; // Simple Hooke's law

        const direction = new THREE.Vector3().subVectors(endNode.position, startNode.position).normalize();
        const forceVector = direction.multiplyScalar(stress);

        results.push({
            member: member,
            strain: strain,
            stress: stress,
            force: forceVector
        });
    }

    return results;
}

// Function to analyze the entire structure
export function analyzeStructure() {
    const nodesList = getAllNodes();
    const membersList = getAllMembers();

    if (nodesList.length < 2 || membersList.length < 1) {
        return {
            valid: false,
            message: "Structure needs at least 2 nodes and 1 member"
        };
    }

    const fixedNodes = nodesList.filter(node => node.userData.isFixed);
    if (fixedNodes.length === 0) {
        return {
            valid: false,
            message: "Structure needs at least one fixed node"
        };
    }

    const memberResults = calculateMemberForces();

    return {
        valid: true,
        message: "Analysis complete",
        results: {
            memberResults: memberResults
        }
    };
}

// Function to toggle whether a node is fixed
export function toggleNodeFixed(node) {
    if (node && node.userData.type === 'node') {
        node.userData.isFixed = !node.userData.isFixed;
        if (node.userData.isFixed) {
            node.material.color.set(0xff0000); // Red for fixed nodes
            node.scale.set(1.5, 1.5, 1.5);
        } else {
            node.material.color.set(0x4287f5); // Default blue color
            node.scale.set(1, 1, 1);
        }
        return node.userData.isFixed;
    }
    return false;
}

// Function to apply a force vector to a node
export function applyForceToNode(node, forceVector) {
    if (node && node.userData.type === 'node') {
        // Further constrain the force vector to be within a quarter of the world size
        node.userData.forces = {
            x: forceVector.x,
            y: forceVector.y,
            z: forceVector.z
        };
        createForceVisualization(node);
        return true;
    }
    return false;
}

// Math functionality
/**
 * Returns the raw world size value (from the slider)
 * @returns 
 */
export function getWorldSize() {
    const slider = document.getElementById("worldSizeInput");
    return slider ? parseFloat(slider.value) : 1;
}
/**
 * Converts a raw world size value to scaled units based on the provided unit.
 * rawValue is in the base meter units.
 * @param {string} unit 
 * @param {number} rawValue 
 * @returns 
 */
export function convertUnit(unit, rawValue) {
    const factor = unitConversion[unit] || 1;
    return rawValue * factor;
}
/**
 * Returns the effective world scale: raw world size multiplied by the conversion factor.
 * @returns 
 */
export function getWorldScale() {
    const select = document.getElementById("unitSelect");
    const unit = select ? select.value : "m";
    const raw = getWorldSize();
    return convertUnit(unit, raw);
}
/**
 * This function converts a number into scientific notation (using toExponential) and then adjusts the significand (mantissa) 
 * so that it is no longer than 5 characters (excluding the "e…")—leaving room for the exponent.
 * @param {number} num 
 * @returns 
 */
export function stringifiyUnit(num) {
    // First, check the plain string version.
    let plain = num.toString();
    if (!plain.includes("e") && plain.length <= 7) {
        return plain;
    }

    // Otherwise, try exponential notation with decreasing fraction digits.
    for (let frac = 6; frac >= 0; frac--) {
        let expStr = num.toExponential(frac); // e.g., "1.234560e+3"
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
    return num.toExponential(0);
}
function mapRangeToRange(n, start1, stop1, start2, stop2, withinBounds) {
    const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
    if (!withinBounds) {
        return newval;
    }
    if (start2 < stop2) {
        return constrainNumber(newval, start2, stop2);
    } else {
        return constrainNumber(newval, stop2, start2);
    }
}
export function constrainNumber(n, low, high) {
    return Math.max(Math.min(n, high), low);
}