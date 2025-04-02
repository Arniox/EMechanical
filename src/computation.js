// src/computation.js
import * as THREE from "three";
import { nodes, members } from './objects.js';

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

export function applyForceToNode(node, forceVector) {
    if (node && node.userData.type === 'node') {
        node.userData.forces = {
            x: forceVector.x,
            y: forceVector.y,
            z: forceVector.z
        };
        updateForceVisualization(node);
        return true;
    }
    return false;
}

function updateForceVisualization(node) {
    if (node.userData.forceArrow) {
        // Remove existing arrow
        node.parent.remove(node.userData.forceArrow);
    }
    const force = new THREE.Vector3(
        node.userData.forces.x,
        node.userData.forces.y,
        node.userData.forces.z
    );
    if (force.length() === 0) {
        return;
    }
    const arrowHelper = new THREE.ArrowHelper(
        force.clone().normalize(),
        node.position,
        force.length() * 0.1,
        0xffff00,
        0.05,
        0.02
    );
    node.parent.add(arrowHelper);
    node.userData.forceArrow = arrowHelper;
}