/**
 * FormulaRenderer.js
 * Renders mathematical formulas and physics calculations with explanations
 */

export class FormulaRenderer {
    /**
     * Render a physics formula with explanation
     * @param {string} type - Type of formula to render
     * @param {Object} data - Data for the formula
     * @returns {string} HTML content with formula explanation
     */
    static renderPhysicsFormula(type, data) {
        switch (type) {
            case 'acceleration':
                return this.renderAccelerationFormula(data);
            case 'beam_tension':
                return this.renderBeamTensionFormula(data);
            case 'beam_compression':
                return this.renderBeamCompressionFormula(data);
            case 'center_of_gravity':
                return this.renderCenterOfGravityFormula(data);
            case 'equilibrium':
                return this.renderEquilibriumFormula(data);
            case 'reaction_forces':
                return this.renderReactionForcesFormula(data);
            default:
                return '<div class="formula-error">Unknown formula type</div>';
        }
    }

    /**
     * Render acceleration formula
     * @param {Object} data - Formula data
     * @returns {string} HTML content
     */
    static renderAccelerationFormula(data) {
        const { force, mass } = data;
        const acceleration = force / mass;

        return `
            <div class="vector-formula">
                <div class="formula-title">Acceleration Calculation</div>
                <div class="formula-definition">a = F / m</div>
                <div class="formula-calculation">
                    a = ${force.toFixed(2)} N / ${mass.toFixed(2)} kg
                    = ${acceleration.toFixed(2)} m/s²
                </div>
                <div class="formula-steps">
                    <div class="formula-step">1. Identify the force (F) and mass (m)</div>
                    <div class="formula-step">2. Divide force by mass to find acceleration</div>
                    <div class="formula-step">3. Units: N/kg = m/s²</div>
                </div>
                <div class="formula-result">
                    Acceleration = ${acceleration.toFixed(2)} m/s²
                </div>
            </div>
        `;
    }

    /**
     * Render beam tension formula
     * @param {Object} data - Formula data
     * @returns {string} HTML content
     */
    static renderBeamTensionFormula(data) {
        const { force, angle = 0 } = data;

        return `
            <div class="beam-force-formula">
                <div class="formula-title">Beam Tension Analysis</div>
                <div class="formula-definition">
                    Tension occurs when forces pull the beam apart
                </div>
                <div class="formula-calculation">
                    Tension Force = ${force.toFixed(2)} N
                </div>
                <div class="formula-steps">
                    <div class="formula-step">1. Analyze forces at beam endpoints</div>
                    <div class="formula-step">2. When forces pull away from each other, the beam is in tension</div>
                    <div class="formula-step">3. Tension can cause the beam to stretch</div>
                </div>
                <div class="formula-result">
                    This beam is experiencing ${force.toFixed(2)} N of tension
                </div>
            </div>
        `;
    }

    /**
     * Render beam compression formula
     * @param {Object} data - Formula data
     * @returns {string} HTML content
     */
    static renderBeamCompressionFormula(data) {
        const { force, angle = 0 } = data;

        return `
            <div class="beam-force-formula">
                <div class="formula-title">Beam Compression Analysis</div>
                <div class="formula-definition">
                    Compression occurs when forces push the beam together
                </div>
                <div class="formula-calculation">
                    Compression Force = ${force.toFixed(2)} N
                </div>
                <div class="formula-steps">
                    <div class="formula-step">1. Analyze forces at beam endpoints</div>
                    <div class="formula-step">2. When forces push toward each other, the beam is in compression</div>
                    <div class="formula-step">3. Compression can cause the beam to buckle if force is too high</div>
                </div>
                <div class="formula-result">
                    This beam is experiencing ${force.toFixed(2)} N of compression
                </div>
            </div>
        `;
    }

    /**
     * Render center of gravity formula
     * @param {Object} data - Formula data
     * @returns {string} HTML content
     */
    static renderCenterOfGravityFormula(data) {
        const { position, totalMass, nodes } = data;

        let nodesInfo = '';
        if (nodes && nodes.length > 0) {
            nodesInfo = nodes.map((node, i) =>
                `Node ${i + 1}: ${node.mass.toFixed(1)} kg at (${node.position.x.toFixed(2)}, ${node.position.y.toFixed(2)}, ${node.position.z.toFixed(2)})`
            ).join('<br>');
        }

        return `
            <div class="cog-formula">
                <div class="formula-title">Center of Gravity Calculation</div>
                <div class="formula-definition">
                    CoG = Σ(m<sub>i</sub> × r<sub>i</sub>) / Σm<sub>i</sub>
                </div>
                <div class="formula-calculation">
                    ${nodesInfo ? `<div class="nodes-info">${nodesInfo}</div>` : ''}
                    Total Mass = ${totalMass.toFixed(1)} kg
                </div>
                <div class="formula-steps">
                    <div class="formula-step">1. Multiply each node's mass by its position vector</div>
                    <div class="formula-step">2. Sum these weighted positions</div>
                    <div class="formula-step">3. Divide by the total mass of the system</div>
                </div>
                <div class="formula-result">
                    Center of Gravity = (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})
                </div>
            </div>
        `;
    }

    /**
     * Render equilibrium formula
     * @param {Object} data - Formula data
     * @returns {string} HTML content
     */
    static renderEquilibriumFormula(data) {
        const { netForce, netMoment, isEquilibrium } = data;

        return `
            <div class="equilibrium-formula">
                <div class="formula-title">Equilibrium Analysis</div>
                <div class="formula-definition">
                    For static equilibrium: ΣF = 0 and ΣM = 0
                </div>
                <div class="formula-calculation">
                    Net Force = (${netForce.x.toFixed(2)}, ${netForce.y.toFixed(2)}, ${netForce.z.toFixed(2)}) N<br>
                    Net Moment = (${netMoment.x.toFixed(2)}, ${netMoment.y.toFixed(2)}, ${netMoment.z.toFixed(2)}) N·m
                </div>
                <div class="formula-steps">
                    <div class="formula-step">1. Sum all forces in the system</div>
                    <div class="formula-step">2. Sum all moments about a reference point</div>
                    <div class="formula-step">3. Check if both sums are approximately zero</div>
                </div>
                <div class="formula-conclusion">
                    The system is ${isEquilibrium ? '' : 'NOT'} in equilibrium
                </div>
            </div>
        `;
    }

    /**
     * Render reaction forces formula
     * @param {Object} data - Formula data
     * @returns {string} HTML content
     */
    static renderReactionForcesFormula(data) {
        const { reactionForce, fixedNodes, reactionPerNode } = data;

        return `
            <div class="reaction-formula">
                <div class="formula-title">Reaction Forces Calculation</div>
                <div class="formula-definition">
                    For equilibrium, reaction forces must balance applied forces
                </div>
                <div class="formula-calculation">
                    Total Reaction Force = (${reactionForce.x.toFixed(2)}, ${reactionForce.y.toFixed(2)}, ${reactionForce.z.toFixed(2)}) N<br>
                    Number of Fixed Nodes = ${fixedNodes.length}<br>
                    Force per Fixed Node = (${reactionPerNode.x.toFixed(2)}, ${reactionPerNode.y.toFixed(2)}, ${reactionPerNode.z.toFixed(2)}) N
                </div>
                <div class="formula-steps">
                    <div class="formula-step">1. Calculate the net force on the system</div>
                    <div class="formula-step">2. Reaction force must equal negative of net force</div>
                    <div class="formula-step">3. Distribute reaction force among fixed nodes</div>
                </div>
                <div class="formula-result">
                    Reaction forces applied to ${fixedNodes.length} fixed node(s)
                </div>
            </div>
        `;
    }
}
