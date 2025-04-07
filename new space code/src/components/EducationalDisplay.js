/**
 * EducationalDisplay.js
 * Provides detailed educational displays for physics calculations
 * with step-by-step explanations for mechanical engineering students
 */
import * as THREE from "three";

export class EducationalDisplay {
    /**
     * Create an educational display manager
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.displayLevel = options.displayLevel || 'detailed'; // 'basic', 'intermediate', 'detailed'

        // Create main display container
        this.displayPanel = document.createElement('div');
        this.displayPanel.className = 'educational-display';
        this.displayPanel.innerHTML = `
            <div class="educational-display-header">
                <h3>Educational Formulas</h3>
                <div class="educational-display-controls">
                    <select class="display-level-selector">
                        <option value="basic" ${this.displayLevel === 'basic' ? 'selected' : ''}>Basic</option>
                        <option value="intermediate" ${this.displayLevel === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                        <option value="detailed" ${this.displayLevel === 'detailed' ? 'selected' : ''}>Detailed</option>
                    </select>
                    <button class="educational-display-close">&times;</button>
                </div>
            </div>
            <div class="educational-display-content"></div>
        `;

        this.container.appendChild(this.displayPanel);

        // Get content container
        this.contentContainer = this.displayPanel.querySelector('.educational-display-content');

        // Set up event listeners
        this.setupEventListeners();

        // Hide initially
        this.hide();
    }

    /**
     * Set up event listeners for the display panel
     */
    setupEventListeners() {
        // Close button
        const closeButton = this.displayPanel.querySelector('.educational-display-close');
        closeButton.addEventListener('click', () => this.hide());

        // Display level selector
        const levelSelector = this.displayPanel.querySelector('.display-level-selector');
        levelSelector.addEventListener('change', (e) => {
            this.displayLevel = e.target.value;
            // Refresh current display with new level
            if (this._currentDisplayData) {
                this.showFormulas(this._currentDisplayData.type, this._currentDisplayData.data);
            }
        });
    }

    /**
     * Show the display panel
     */
    show() {
        this.displayPanel.style.display = 'block';
    }

    /**
     * Hide the display panel
     */
    hide() {
        this.displayPanel.style.display = 'none';
    }

    /**
     * Show formulas for a specific calculation type
     * @param {string} type - Type of calculation ('equilibrium', 'beam_forces', etc.)
     * @param {Object} data - Data for the calculation
     */
    showFormulas(type, data) {
        // Store current display data for refresh on level change
        this._currentDisplayData = { type, data };

        // Clear previous content
        this.contentContainer.innerHTML = '';

        // Generate content based on type
        let content = '';

        switch (type) {
            case 'equilibrium':
                content = this.generateEquilibriumFormulas(data);
                break;
            case 'beam_forces':
                content = this.generateBeamForceFormulas(data);
                break;
            case 'center_of_gravity':
                content = this.generateCenterOfGravityFormulas(data);
                break;
            case 'node_motion':
                content = this.generateNodeMotionFormulas(data);
                break;
            case 'beam_stress':
                content = this.generateBeamStressFormulas(data);
                break;
            default:
                content = '<div class="formula-error">Unknown formula type</div>';
        }

        // Add content to container
        this.contentContainer.innerHTML = content;

        // Show the panel
        this.show();
    }

    /**
     * Generate formulas for equilibrium calculations
     * @param {Object} data - Equilibrium calculation data
     * @returns {string} HTML content
     */
    generateEquilibriumFormulas(data) {
        const { netForce, netMoment, isEquilibrium, nodes, centerOfGravity } = data;

        let content = `
            <div class="formula-section">
                <h4>Equilibrium Conditions</h4>
                <div class="formula-definition">
                    <p>A system is in equilibrium when the sum of all forces and the sum of all moments are zero:</p>
                    <div class="formula-math">
                        ΣF = 0 and ΣM = 0
                    </div>
                </div>
            </div>
        `;

        // Force equilibrium section
        content += `
            <div class="formula-section">
                <h4>Force Equilibrium</h4>
                <div class="formula-explanation">
                    <p>The sum of all forces must equal zero for a system to be in static equilibrium.</p>
                    <div class="formula-math">
                        ΣF = F₁ + F₂ + ... + Fₙ = 0
                    </div>
                </div>
        `;

        // Add force calculations based on detail level
        if (this.displayLevel !== 'basic') {
            content += `<div class="calculation-steps"><h5>Calculation Steps:</h5>`;

            // Show individual node forces
            if (nodes && nodes.length > 0) {
                content += `<div class="step-list">`;
                nodes.forEach((node, index) => {
                    const force = node.force.vector;
                    content += `
                        <div class="calculation-step">
                            <span class="step-number">${index + 1}</span>
                            <div class="step-content">
                                <div>Node ${index + 1} Force: (${force.x.toFixed(2)}, ${force.y.toFixed(2)}, ${force.z.toFixed(2)}) N</div>
                            </div>
                        </div>
                    `;
                });
                content += `</div>`;
            }

            // Show sum calculation
            content += `
                <div class="calculation-step">
                    <span class="step-number">${(nodes?.length || 0) + 1}</span>
                    <div class="step-content">
                        <div>Sum all force vectors:</div>
                        <div class="formula-math">
                            ΣF = (${netForce.x.toFixed(2)}, ${netForce.y.toFixed(2)}, ${netForce.z.toFixed(2)}) N
                        </div>
                        <div>Magnitude: ${netForce.length().toFixed(3)} N</div>
                    </div>
                </div>
            `;

            content += `</div>`;
        }

        content += `</div>`;

        // Moment equilibrium section
        content += `
            <div class="formula-section">
                <h4>Moment Equilibrium</h4>
                <div class="formula-explanation">
                    <p>The sum of all moments about any point must equal zero for a system to be in static equilibrium.</p>
                    <div class="formula-math">
                        ΣM = M₁ + M₂ + ... + Mₙ = 0
                    </div>
                    <p>Moment is calculated as the cross product of position vector and force vector:</p>
                    <div class="formula-math">
                        M = r × F
                    </div>
                </div>
        `;

        // Add moment calculations based on detail level
        if (this.displayLevel !== 'basic') {
            content += `<div class="calculation-steps"><h5>Calculation Steps:</h5>`;

            // Show center of gravity
            content += `
                <div class="calculation-step">
                    <span class="step-number">1</span>
                    <div class="step-content">
                        <div>Center of gravity (reference point for moments):</div>
                        <div class="formula-math">
                            CoG = (${centerOfGravity.x.toFixed(2)}, ${centerOfGravity.y.toFixed(2)}, ${centerOfGravity.z.toFixed(2)})
                        </div>
                    </div>
                </div>
            `;

            // Show individual node moments
            if (nodes && nodes.length > 0 && this.displayLevel === 'detailed') {
                nodes.forEach((node, index) => {
                    const force = node.force.vector;
                    const position = node.position;
                    const relativePos = new THREE.Vector3().subVectors(position, centerOfGravity);
                    const moment = new THREE.Vector3().crossVectors(relativePos, force);

                    content += `
                        <div class="calculation-step">
                            <span class="step-number">${index + 2}</span>
                            <div class="step-content">
                                <div>Node ${index + 1} Moment:</div>
                                <div class="formula-math">
                                    r = (${relativePos.x.toFixed(2)}, ${relativePos.y.toFixed(2)}, ${relativePos.z.toFixed(2)}) m
                                </div>
                                <div class="formula-math">
                                    F = (${force.x.toFixed(2)}, ${force.y.toFixed(2)}, ${force.z.toFixed(2)}) N
                                </div>
                                <div class="formula-math">
                                    M = r × F = (${moment.x.toFixed(2)}, ${moment.y.toFixed(2)}, ${moment.z.toFixed(2)}) N·m
                                </div>
                            </div>
                        </div>
                    `;
                });
            }

            // Show sum calculation
            content += `
                <div class="calculation-step">
                    <span class="step-number">${(nodes?.length || 0) + 2}</span>
                    <div class="step-content">
                        <div>Sum all moment vectors:</div>
                        <div class="formula-math">
                            ΣM = (${netMoment.x.toFixed(2)}, ${netMoment.y.toFixed(2)}, ${netMoment.z.toFixed(2)}) N·m
                        </div>
                        <div>Magnitude: ${netMoment.length().toFixed(3)} N·m</div>
                    </div>
                </div>
            `;

            content += `</div>`;
        }

        content += `</div>`;

        // Conclusion section
        content += `
            <div class="formula-section">
                <h4>Conclusion</h4>
                <div class="formula-result ${isEquilibrium ? 'success' : 'warning'}">
                    <p>The system is ${isEquilibrium ? '' : 'NOT'} in equilibrium.</p>
                    <p>For equilibrium, both net force and net moment should be zero.</p>
                    <ul>
                        <li>Net Force: ${netForce.length().toFixed(3)} N ${isEquilibrium ? '≈ 0 ✓' : '≠ 0 ✗'}</li>
                        <li>Net Moment: ${netMoment.length().toFixed(3)} N·m ${isEquilibrium ? '≈ 0 ✓' : '≠ 0 ✗'}</li>
                    </ul>
                </div>
            </div>
        `;

        return content;
    }

    /**
     * Generate formulas for beam force calculations
     * @param {Object} data - Beam force calculation data
     * @returns {string} HTML content
     */
    generateBeamForceFormulas(data) {
        const { beam, startNode, endNode, forceType, forceValue } = data;

        let content = `
            <div class="formula-section">
                <h4>Beam Force Analysis</h4>
                <div class="formula-definition">
                    <p>Beams can experience different types of internal forces:</p>
                    <ul>
                        <li><strong>Tension:</strong> Forces pulling the beam apart</li>
                        <li><strong>Compression:</strong> Forces pushing the beam together</li>
                    </ul>
                </div>
            </div>
        `;

        // Beam direction and properties
        const direction = new THREE.Vector3().subVectors(
            endNode.position,
            startNode.position
        ).normalize();

        content += `
            <div class="formula-section">
                <h4>Beam Properties</h4>
                <div class="formula-explanation">
                    <ul>
                        <li>Length: ${beam.length.toFixed(3)} m</li>
                        <li>Material: ${beam.material.name}</li>
                        <li>Direction: (${direction.x.toFixed(3)}, ${direction.y.toFixed(3)}, ${direction.z.toFixed(3)})</li>
                    </ul>
                </div>
            </div>
        `;

        // Force calculation section
        content += `
            <div class="formula-section">
                <h4>Force Calculation</h4>
                <div class="formula-explanation">
                    <p>To determine if a beam is in tension or compression, we analyze the forces at its endpoints.</p>
                </div>
        `;

        if (this.displayLevel !== 'basic') {
            // Start node force
            const startForce = startNode.force.vector;
            const startProjection = startForce.dot(direction);

            // End node force
            const endForce = endNode.force.vector;
            const endProjection = endForce.dot(direction);

            content += `<div class="calculation-steps"><h5>Calculation Steps:</h5>`;

            content += `
                <div class="calculation-step">
                    <span class="step-number">1</span>
                    <div class="step-content">
                        <div>Project forces onto beam direction:</div>
                        <div class="formula-math">
                            F<sub>projection</sub> = F · direction
                        </div>
                    </div>
                </div>
                
                <div class="calculation-step">
                    <span class="step-number">2</span>
                    <div class="step-content">
                        <div>Start node force: (${startForce.x.toFixed(2)}, ${startForce.y.toFixed(2)}, ${startForce.z.toFixed(2)}) N</div>
                        <div class="formula-math">
                            F<sub>start_proj</sub> = F<sub>start</sub> · direction = ${startProjection.toFixed(3)} N
                        </div>
                        <div>End node force: (${endForce.x.toFixed(2)}, ${endForce.y.toFixed(2)}, ${endForce.z.toFixed(2)}) N</div>
                        <div class="formula-math">
                            F<sub>end_proj</sub> = F<sub>end</sub> · direction = ${endProjection.toFixed(3)} N
                        </div>
                    </div>
                </div>
            `;

            if (this.displayLevel === 'detailed') {
                content += `
                    <div class="calculation-step">
                        <span class="step-number">3</span>
                        <div class="step-content">
                            <div>Determine force type:</div>
                            <ul>
                                <li>If F<sub>start_proj</sub> > 0 and F<sub>end_proj</sub> < 0: <strong>Tension</strong> (forces pulling apart)</li>
                                <li>If F<sub>start_proj</sub> < 0 and F<sub>end_proj</sub> > 0: <strong>Compression</strong> (forces pushing together)</li>
                                <li>Otherwise: <strong>Neutral</strong> or complex loading</li>
                            </ul>
                            <div>In this case: F<sub>start_proj</sub> = ${startProjection.toFixed(3)} N and F<sub>end_proj</sub> = ${endProjection.toFixed(3)} N</div>
                            <div>Therefore, the beam is in <strong>${forceType}</strong></div>
                        </div>
                    </div>
                    
                    <div class="calculation-step">
                        <span class="step-number">4</span>
                        <div class="step-content">
                            <div>Calculate force magnitude:</div>
                            <div class="formula-math">
                                F = (|F<sub>start_proj</sub>| + |F<sub>end_proj</sub>|) / 2 = ${forceValue.toFixed(3)} N
                            </div>
                        </div>
                    </div>
                `;
            }

            content += `</div>`;
        }

        content += `</div>`;

        // Stress calculation
        if (this.displayLevel !== 'basic') {
            const area = Math.PI * Math.pow((beam.startRadius + beam.endRadius) / 2, 2);
            const stress = forceValue / area;

            content += `
                <div class="formula-section">
                    <h4>Stress Calculation</h4>
                    <div class="formula-explanation">
                        <p>Stress is the internal force per unit area:</p>
                        <div class="formula-math">
                            σ = F / A
                        </div>
                    </div>
                    
                    <div class="calculation-steps">
                        <div class="calculation-step">
                            <span class="step-number">1</span>
                            <div class="step-content">
                                <div>Calculate cross-sectional area:</div>
                                <div class="formula-math">
                                    A = π × r² = π × (${((beam.startRadius + beam.endRadius) / 2).toFixed(5)})² = ${area.toFixed(6)} m²
                                </div>
                            </div>
                        </div>
                        
                        <div class="calculation-step">
                            <span class="step-number">2</span>
                            <div class="step-content">
                                <div>Calculate stress:</div>
                                <div class="formula-math">
                                    σ = F / A = ${forceValue.toFixed(3)} N / ${area.toFixed(6)} m² = ${(stress / 1e6).toFixed(3)} MPa
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Conclusion section
        content += `
            <div class="formula-section">
                <h4>Conclusion</h4>
                <div class="formula-result ${forceType !== 'neutral' ? 'info' : ''}">
                    <p>The beam is in <strong>${forceType.toUpperCase()}</strong> with a force of ${forceValue.toFixed(3)} N.</p>
                    ${this.displayLevel !== 'basic' ? `<p>This creates a stress of ${(beam.stress / 1e6).toFixed(3)} MPa.</p>` : ''}
                    ${this.displayLevel === 'detailed' && forceType !== 'neutral' ?
                `<p>Material ${beam.material.name} has a ${forceType === 'tension' ? 'tensile' : 'compressive'} strength of 
                        ${(forceType === 'tension' ? beam.material.tensileStrength : beam.material.compressiveStrength) / 1e6} MPa.</p>` : ''}
                </div>
            </div>
        `;

        return content;
    }

    /**
     * Generate formulas for center of gravity calculations
     * @param {Object} data - Center of gravity calculation data
     * @returns {string} HTML content
     */
    generateCenterOfGravityFormulas(data) {
        const { position, totalMass, nodes } = data;

        let content = `
            <div class="formula-section">
                <h4>Center of Gravity</h4>
                <div class="formula-definition">
                    <p>The center of gravity (CoG) is the point where the weighted relative position of the distributed mass sums to zero.</p>
                    <div class="formula-math">
                        CoG = Σ(m<sub>i</sub> × r<sub>i</sub>) / Σm<sub>i</sub>
                    </div>
                    <p>Where:</p>
                    <ul>
                        <li>m<sub>i</sub> = mass of each node</li>
                        <li>r<sub>i</sub> = position vector of each node</li>
                    </ul>
                </div>
            </div>
        `;

        if (this.displayLevel !== 'basic' && nodes && nodes.length > 0) {
            content += `
                <div class="formula-section">
                    <h4>Calculation Steps</h4>
                    <div class="calculation-steps">
            `;

            // Show individual node contributions
            nodes.forEach((node, index) => {
                const weightedPos = new THREE.Vector3(
                    node.position.x * node.mass,
                    node.position.y * node.mass,
                    node.position.z * node.mass
                );

                content += `
                    <div class="calculation-step">
                        <span class="step-number">${index + 1}</span>
                        <div class="step-content">
                            <div>Node ${index + 1}:</div>
                            <div class="formula-math">
                                m<sub>${index + 1}</sub> = ${node.mass.toFixed(1)} kg
                            </div>
                            <div class="formula-math">
                                r<sub>${index + 1}</sub> = (${node.position.x.toFixed(3)}, ${node.position.y.toFixed(3)}, ${node.position.z.toFixed(3)}) m
                            </div>
                            <div class="formula-math">
                                m<sub>${index + 1}</sub> × r<sub>${index + 1}</sub> = (${weightedPos.x.toFixed(3)}, ${weightedPos.y.toFixed(3)}, ${weightedPos.z.toFixed(3)}) kg·m
                            </div>
                        </div>
                    </div>
                `;
            });

            // Sum of masses
            content += `
                <div class="calculation-step">
                    <span class="step-number">${nodes.length + 1}</span>
                    <div class="step-content">
                        <div>Sum of masses:</div>
                        <div class="formula-math">
                            Σm<sub>i</sub> = ${nodes.map(n => n.mass.toFixed(1)).join(' + ')} = ${totalMass.toFixed(1)} kg
                        </div>
                    </div>
                </div>
            `;

            // Final calculation
            content += `
                <div class="calculation-step">
                    <span class="step-number">${nodes.length + 2}</span>
                    <div class="step-content">
                        <div>Center of Gravity:</div>
                        <div class="formula-math">
                            CoG = Σ(m<sub>i</sub> × r<sub>i</sub>) / Σm<sub>i</sub> = (${position.x.toFixed(3)}, ${position.y.toFixed(3)}, ${position.z.toFixed(3)}) m
                        </div>
                    </div>
                </div>
            `;

            content += `
                    </div>
                </div>
            `;
        }

        // Conclusion section
        content += `
            <div class="formula-section">
                <h4>Result</h4>
                <div class="formula-result">
                    <p>Center of Gravity: (${position.x.toFixed(3)}, ${position.y.toFixed(3)}, ${position.z.toFixed(3)}) m</p>
                    <p>Total System Mass: ${totalMass.toFixed(1)} kg</p>
                </div>
            </div>
        `;

        return content;
    }

    /**
     * Generate formulas for node motion calculations
     * @param {Object} data - Node motion calculation data
     * @returns {string} HTML content
     */
    generateNodeMotionFormulas(data) {
        const { node, force, mass, acceleration, velocity, timeStep } = data;

        let content = `
            <div class="formula-section">
                <h4>Node Motion Analysis</h4>
                <div class="formula-definition">
                    <p>The motion of a node is governed by Newton's Second Law:</p>
                    <div class="formula-math">
                        F = m × a
                    </div>
                    <p>Where:</p>
                    <ul>
                        <li>F = force vector (N)</li>
                        <li>m = mass (kg)</li>
                        <li>a = acceleration vector (m/s²)</li>
                    </ul>
                </div>
            </div>
        `;

        // Acceleration calculation
        content += `
            <div class="formula-section">
                <h4>Acceleration Calculation</h4>
                <div class="formula-explanation">
                    <p>Acceleration is calculated from force and mass:</p>
                    <div class="formula-math">
                        a = F / m
                    </div>
                </div>
        `;

        if (this.displayLevel !== 'basic') {
            content += `
                <div class="calculation-steps">
                    <div class="calculation-step">
                        <span class="step-number">1</span>
                        <div class="step-content">
                            <div>Given:</div>
                            <div class="formula-math">
                                F = (${force.x.toFixed(3)}, ${force.y.toFixed(3)}, ${force.z.toFixed(3)}) N
                            </div>
                            <div class="formula-math">
                                m = ${mass.toFixed(1)} kg
                            </div>
                        </div>
                    </div>
                    
                    <div class="calculation-step">
                        <span class="step-number">2</span>
                        <div class="step-content">
                            <div>Calculate acceleration:</div>
                            <div class="formula-math">
                                a = F / m = (${force.x.toFixed(3)}, ${force.y.toFixed(3)}, ${force.z.toFixed(3)}) N / ${mass.toFixed(1)} kg
                            </div>
                            <div class="formula-math">
                                a = (${acceleration.x.toFixed(3)}, ${acceleration.y.toFixed(3)}, ${acceleration.z.toFixed(3)}) m/s²
                            </div>
                            <div>Magnitude: ${acceleration.length().toFixed(3)} m/s²</div>
                        </div>
                    </div>
                </div>
            `;
        }

        content += `</div>`;

        // Velocity calculation
        content += `
            <div class="formula-section">
                <h4>Velocity Calculation</h4>
                <div class="formula-explanation">
                    <p>Velocity change is calculated from acceleration and time step:</p>
                    <div class="formula-math">
                        v = v<sub>0</sub> + a × Δt
                    </div>
                </div>
        `;

        if (this.displayLevel !== 'basic') {
            content += `
                <div class="calculation-steps">
                    <div class="calculation-step">
                        <span class="step-number">1</span>
                        <div class="step-content">
                            <div>Given:</div>
                            <div class="formula-math">
                                a = (${acceleration.x.toFixed(3)}, ${acceleration.y.toFixed(3)}, ${acceleration.z.toFixed(3)}) m/s²
                            </div>
                            <div class="formula-math">
                                Δt = ${timeStep.toFixed(1)} s
                            </div>
                        </div>
                    </div>
                    
                    <div class="calculation-step">
                        <span class="step-number">2</span>
                        <div class="step-content">
                            <div>Calculate velocity change:</div>
                            <div class="formula-math">
                                Δv = a × Δt = (${acceleration.x.toFixed(3)}, ${acceleration.y.toFixed(3)}, ${acceleration.z.toFixed(3)}) m/s² × ${timeStep.toFixed(1)} s
                            </div>
                            <div class="formula-math">
                                Δv = (${(acceleration.x * timeStep).toFixed(3)}, ${(acceleration.y * timeStep).toFixed(3)}, ${(acceleration.z * timeStep).toFixed(3)}) m/s
                            </div>
                        </div>
                    </div>
                    
                    <div class="calculation-step">
                        <span class="step-number">3</span>
                        <div class="step-content">
                            <div>Update velocity:</div>
                            <div class="formula-math">
                                v = v<sub>0</sub> + Δv = (${velocity.x.toFixed(3)}, ${velocity.y.toFixed(3)}, ${velocity.z.toFixed(3)}) m/s
                            </div>
                            <div>Magnitude: ${velocity.length().toFixed(3)} m/s</div>
                        </div>
                    </div>
                </div>
            `;
        }

        content += `</div>`;

        // Position calculation (if detailed)
        if (this.displayLevel === 'detailed') {
            content += `
                <div class="formula-section">
                    <h4>Position Update</h4>
                    <div class="formula-explanation">
                        <p>Position change is calculated from velocity and time step:</p>
                        <div class="formula-math">
                            p = p<sub>0</sub> + v × Δt
                        </div>
                    </div>
                    
                    <div class="calculation-steps">
                        <div class="calculation-step">
                            <span class="step-number">1</span>
                            <div class="step-content">
                                <div>Given:</div>
                                <div class="formula-math">
                                    v = (${velocity.x.toFixed(3)}, ${velocity.y.toFixed(3)}, ${velocity.z.toFixed(3)}) m/s
                                </div>
                                <div class="formula-math">
                                    Δt = ${timeStep.toFixed(1)} s
                                </div>
                            </div>
                        </div>
                        
                        <div class="calculation-step">
                            <span class="step-number">2</span>
                            <div class="step-content">
                                <div>Calculate position change:</div>
                                <div class="formula-math">
                                    Δp = v × Δt = (${velocity.x.toFixed(3)}, ${velocity.y.toFixed(3)}, ${velocity.z.toFixed(3)}) m/s × ${timeStep.toFixed(1)} s
                                </div>
                                <div class="formula-math">
                                    Δp = (${(velocity.x * timeStep).toFixed(3)}, ${(velocity.y * timeStep).toFixed(3)}, ${(velocity.z * timeStep).toFixed(3)}) m
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Conclusion section
        content += `
            <div class="formula-section">
                <h4>Results</h4>
                <div class="formula-result">
                    <p>Force: (${force.x.toFixed(3)}, ${force.y.toFixed(3)}, ${force.z.toFixed(3)}) N</p>
                    <p>Acceleration: (${acceleration.x.toFixed(3)}, ${acceleration.y.toFixed(3)}, ${acceleration.z.toFixed(3)}) m/s²</p>
                    <p>Velocity: (${velocity.x.toFixed(3)}, ${velocity.y.toFixed(3)}, ${velocity.z.toFixed(3)}) m/s</p>
                </div>
            </div>
        `;

        return content;
    }

    /**
     * Generate formulas for beam stress calculations
     * @param {Object} data - Beam stress calculation data
     * @returns {string} HTML content
     */
    generateBeamStressFormulas(data) {
        const { beam, forceValue, forceType, stress, strain } = data;

        let content = `
            <div class="formula-section">
                <h4>Beam Stress Analysis</h4>
                <div class="formula-definition">
                    <p>Stress is the internal force per unit area:</p>
                    <div class="formula-math">
                        σ = F / A
                    </div>
                    <p>Where:</p>
                    <ul>
                        <li>σ = stress (Pa)</li>
                        <li>F = force (N)</li>
                        <li>A = cross-sectional area (m²)</li>
                    </ul>
                </div>
            </div>
        `;

        // Material properties
        content += `
            <div class="formula-section">
                <h4>Material Properties</h4>
                <div class="formula-explanation">
                    <p>Material: ${beam.material.name}</p>
                    <ul>
                        <li>Young's Modulus (E): ${(beam.material.youngsModulus / 1e9).toFixed(0)} GPa</li>
                        <li>Tensile Strength: ${(beam.material.tensileStrength / 1e6).toFixed(0)} MPa</li>
                        <li>Compressive Strength: ${(beam.material.compressiveStrength / 1e6).toFixed(0)} MPa</li>
                    </ul>
                </div>
            </div>
        `;

        // Stress calculation
        const area = Math.PI * Math.pow((beam.startRadius + beam.endRadius) / 2, 2);

        content += `
            <div class="formula-section">
                <h4>Stress Calculation</h4>
                <div class="formula-explanation">
                    <p>The beam is in ${forceType} with a force of ${forceValue.toFixed(3)} N.</p>
                </div>
        `;

        if (this.displayLevel !== 'basic') {
            content += `
                <div class="calculation-steps">
                    <div class="calculation-step">
                        <span class="step-number">1</span>
                        <div class="step-content">
                            <div>Calculate cross-sectional area:</div>
                            <div class="formula-math">
                                A = π × r² = π × (${((beam.startRadius + beam.endRadius) / 2).toFixed(5)})² = ${area.toFixed(6)} m²
                            </div>
                        </div>
                    </div>
                    
                    <div class="calculation-step">
                        <span class="step-number">2</span>
                        <div class="step-content">
                            <div>Calculate stress:</div>
                            <div class="formula-math">
                                σ = F / A = ${forceValue.toFixed(3)} N / ${area.toFixed(6)} m² = ${(stress / 1e6).toFixed(3)} MPa
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        content += `</div>`;

        // Strain calculation (if detailed)
        if (this.displayLevel === 'detailed') {
            content += `
                <div class="formula-section">
                    <h4>Strain Calculation</h4>
                    <div class="formula-explanation">
                        <p>Strain is the relative deformation of the material:</p>
                        <div class="formula-math">
                            ε = σ / E
                        </div>
                        <p>Where:</p>
                        <ul>
                            <li>ε = strain (dimensionless)</li>
                            <li>σ = stress (Pa)</li>
                            <li>E = Young's modulus (Pa)</li>
                        </ul>
                    </div>
                    
                    <div class="calculation-steps">
                        <div class="calculation-step">
                            <span class="step-number">1</span>
                            <div class="step-content">
                                <div>Given:</div>
                                <div class="formula-math">
                                    σ = ${(stress / 1e6).toFixed(3)} MPa = ${stress.toFixed(0)} Pa
                                </div>
                                <div class="formula-math">
                                    E = ${(beam.material.youngsModulus / 1e9).toFixed(0)} GPa = ${beam.material.youngsModulus.toFixed(0)} Pa
                                </div>
                            </div>
                        </div>
                        
                        <div class="calculation-step">
                            <span class="step-number">2</span>
                            <div class="step-content">
                                <div>Calculate strain:</div>
                                <div class="formula-math">
                                    ε = σ / E = ${stress.toFixed(0)} Pa / ${beam.material.youngsModulus.toFixed(0)} Pa = ${strain.toExponential(4)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Safety factor (if detailed)
        if (this.displayLevel === 'detailed') {
            const relevantStrength = forceType === 'tension' ?
                beam.material.tensileStrength :
                beam.material.compressiveStrength;

            const safetyFactor = relevantStrength / stress;

            content += `
                <div class="formula-section">
                    <h4>Safety Factor</h4>
                    <div class="formula-explanation">
                        <p>The safety factor is the ratio of material strength to actual stress:</p>
                        <div class="formula-math">
                            SF = Strength / Stress
                        </div>
                    </div>
                    
                    <div class="calculation-steps">
                        <div class="calculation-step">
                            <span class="step-number">1</span>
                            <div class="step-content">
                                <div>Given:</div>
                                <div class="formula-math">
                                    ${forceType === 'tension' ? 'Tensile' : 'Compressive'} Strength = ${(relevantStrength / 1e6).toFixed(0)} MPa
                                </div>
                                <div class="formula-math">
                                    Actual Stress = ${(stress / 1e6).toFixed(3)} MPa
                                </div>
                            </div>
                        </div>
                        
                        <div class="calculation-step">
                            <span class="step-number">2</span>
                            <div class="step-content">
                                <div>Calculate safety factor:</div>
                                <div class="formula-math">
                                    SF = ${(relevantStrength / 1e6).toFixed(0)} MPa / ${(stress / 1e6).toFixed(3)} MPa = ${safetyFactor.toFixed(1)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Conclusion section
        content += `
            <div class="formula-section">
                <h4>Results</h4>
                <div class="formula-result ${(stress > 0 && stress < beam.material.tensileStrength / 3) ? 'success' : 'warning'}">
                    <p>Stress: ${(stress / 1e6).toFixed(3)} MPa</p>
                    ${this.displayLevel !== 'basic' ? `<p>Strain: ${strain.toExponential(4)}</p>` : ''}
                    ${this.displayLevel === 'detailed' ?
                `<p>Safety Factor: ${safetyFactor.toFixed(1)} ${safetyFactor >= 2 ? '(Safe)' : '(Warning: Low safety factor)'}</p>` : ''}
                </div>
            </div>
        `;

        return content;
    }
}
