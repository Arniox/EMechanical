/**
 * PhysicsEngine.js
 * Handles advanced physics calculations for the mechanical engineering calculator
 */
import * as THREE from "three";
import { FormulaRenderer } from "./FormulaRenderer.js";

export class PhysicsEngine {
    /**
     * Create a physics engine
     * @param {Object} options - Configuration options
     * @param {Object} options.nodeManager - The node manager
     */
    constructor(options) {
        this.nodeManager = options.nodeManager;
        this.equilibriumTolerance = 0.01; // N, tolerance for equilibrium check
    }

    /**
     * Calculate the center of gravity of the system
     * @returns {Object} Center of gravity information
     */
    calculateCenterOfGravity() {
        const nodes = this.nodeManager.nodes;

        // Skip if no nodes
        if (nodes.length === 0) {
            return {
                position: new THREE.Vector3(0, 0, 0),
                totalMass: 0,
                formula: ''
            };
        }

        // Calculate total mass and weighted position sum
        let totalMass = 0;
        const weightedSum = new THREE.Vector3(0, 0, 0);

        nodes.forEach(node => {
            totalMass += node.mass;
            weightedSum.add(
                new THREE.Vector3(
                    node.position.x * node.mass,
                    node.position.y * node.mass,
                    node.position.z * node.mass
                )
            );
        });

        // Calculate center of gravity
        const position = totalMass > 0 ?
            weightedSum.divideScalar(totalMass) :
            new THREE.Vector3(0, 0, 0);

        // Generate formula explanation
        const formula = FormulaRenderer.renderPhysicsFormula('center_of_gravity', {
            position: position,
            totalMass: totalMass,
            nodes: nodes
        });

        return {
            position: position,
            totalMass: totalMass,
            nodes: nodes,
            formula: formula
        };
    }

    /**
     * Check if the system is in equilibrium
     * @returns {Object} Equilibrium check result
     */
    checkEquilibrium() {
        const nodes = this.nodeManager.nodes;

        // Skip if no nodes
        if (nodes.length === 0) {
            return {
                isEquilibrium: true,
                netForce: new THREE.Vector3(0, 0, 0),
                netMoment: new THREE.Vector3(0, 0, 0),
                formula: ''
            };
        }

        // Calculate net force
        const netForce = new THREE.Vector3(0, 0, 0);
        nodes.forEach(node => {
            netForce.add(node.force.vector);
        });

        // Calculate center of gravity
        const cogResult = this.calculateCenterOfGravity();
        const centerOfGravity = cogResult.position;

        // Calculate net moment about center of gravity
        const netMoment = new THREE.Vector3(0, 0, 0);
        nodes.forEach(node => {
            // Calculate position vector relative to center of gravity
            const relativePos = new THREE.Vector3().subVectors(node.position, centerOfGravity);

            // Calculate moment (cross product of position and force)
            const moment = new THREE.Vector3().crossVectors(relativePos, node.force.vector);

            // Add to net moment
            netMoment.add(moment);
        });

        // Check if system is in equilibrium
        const isEquilibrium =
            netForce.length() < this.equilibriumTolerance &&
            netMoment.length() < this.equilibriumTolerance;

        // Generate formula explanation
        const formula = FormulaRenderer.renderPhysicsFormula('equilibrium', {
            netForce: netForce,
            netMoment: netMoment,
            isEquilibrium: isEquilibrium
        });

        return {
            isEquilibrium: isEquilibrium,
            netForce: netForce,
            netMoment: netMoment,
            nodes: nodes,
            centerOfGravity: centerOfGravity,
            formula: formula
        };
    }

    /**
     * Calculate missing forces to achieve equilibrium
     * @returns {Object} Missing forces calculation result
     */
    calculateMissingForces() {
        const nodes = this.nodeManager.nodes;

        // Skip if no nodes
        if (nodes.length === 0) {
            return {
                success: false,
                message: 'No nodes in the system',
                formula: ''
            };
        }

        // Get fixed nodes
        const fixedNodes = nodes.filter(node => node.isFixed);

        // Skip if no fixed nodes
        if (fixedNodes.length === 0) {
            return {
                success: false,
                message: 'No fixed nodes to apply reaction forces',
                formula: ''
            };
        }

        // Calculate net force on non-fixed nodes
        const netForce = new THREE.Vector3(0, 0, 0);
        nodes.forEach(node => {
            if (!node.isFixed) {
                netForce.add(node.force.vector);
            }
        });

        // Calculate reaction force (negative of net force)
        const reactionForce = netForce.clone().negate();

        // Distribute reaction force among fixed nodes
        const reactionPerNode = reactionForce.clone().divideScalar(fixedNodes.length);

        // Generate formula explanation
        const formula = FormulaRenderer.renderPhysicsFormula('reaction_forces', {
            reactionForce: reactionForce,
            fixedNodes: fixedNodes,
            reactionPerNode: reactionPerNode
        });

        return {
            success: true,
            reactionForce: reactionForce,
            fixedNodes: fixedNodes,
            reactionPerNode: reactionPerNode,
            formula: formula
        };
    }

    /**
     * Calculate forces in all beams
     * @returns {Array} Array of beam force information
     */
    calculateBeamForces() {
        const beams = this.nodeManager.beams;
        const results = [];

        beams.forEach(beam => {
            // Calculate beam force
            beam.calculateForce();

            // Add to results
            results.push({
                beam: beam,
                startNode: beam.parents[0],
                endNode: beam.parents[1],
                forceType: beam.forceType,
                forceValue: beam.forceValue,
                stress: beam.stress,
                formula: FormulaRenderer.renderPhysicsFormula(
                    beam.forceType === 'tension' ? 'beam_tension' : 'beam_compression',
                    {
                        force: beam.forceValue,
                        angle: 0 // Assuming force is along beam axis
                    }
                )
            });
        });

        return results;
    }

    /**
     * Calculate node motion based on forces
     * @param {Object} node - The node to calculate motion for
     * @param {number} timeStep - Time step for calculation
     * @returns {Object} Node motion information
     */
    calculateNodeMotion(node, timeStep) {
        // Skip if node is fixed
        if (node.isFixed) {
            return {
                node: node,
                force: node.force.vector.clone(),
                mass: node.mass,
                acceleration: new THREE.Vector3(0, 0, 0),
                velocity: new THREE.Vector3(0, 0, 0),
                timeStep: timeStep,
                formula: ''
            };
        }

        // Calculate acceleration from force: a = F / m
        const acceleration = node.force.vector.clone().divideScalar(node.mass);

        // Calculate velocity change: Δv = a * Δt
        const velocityChange = acceleration.clone().multiplyScalar(timeStep);

        // Update velocity: v = v0 + Δv
        const newVelocity = node.velocity.vector.clone().add(velocityChange);

        // Generate formula explanation
        const formula = FormulaRenderer.renderPhysicsFormula('acceleration', {
            force: node.force.vector.length(),
            mass: node.mass
        });

        return {
            node: node,
            force: node.force.vector.clone(),
            mass: node.mass,
            acceleration: acceleration,
            velocity: newVelocity,
            timeStep: timeStep,
            formula: formula
        };
    }
}
