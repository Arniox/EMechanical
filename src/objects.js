// src/objects.js
import * as THREE from "three";

let scene = null;
export function setScene(s) {
    scene = s;
}

export let nodes = [];
export let members = [];

export function createNode(position) {
    const geometry = new THREE.SphereGeometry(0.015, 16, 16);
    const material = new THREE.MeshStandardMaterial({
        color: 0xa0f0f0, // default blue
        roughness: 0.25,
        metalness: 0.5
    });
    const node = new THREE.Mesh(geometry, material);
    node.position.copy(position);
    node.castShadow = true;
    node.userData.type = 'node';
    scene.add(node);
    nodes.push(node);
    return node;
}

// Create a member (beam) connecting two nodes.
// A unit cylinder is created and then scaled along Y to match the node distance.
export function createMember(startNode, endNode, color = 0xcccccc) {
    const geometry = new THREE.CylinderGeometry(0.0025, 0.0025, 1, 8);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.3
    });
    const member = new THREE.Mesh(geometry, material);
    member.castShadow = true;
    member.userData.type = 'member';
    member.userData.startNode = startNode;
    member.userData.endNode = endNode;
    updateMember(member);
    scene.add(member);
    members.push(member);
    return member;
}

// Update a beam's (member's) position, scale, and rotation based on its nodes.
export function updateMember(member) {
    const startNode = member.userData.startNode;
    const endNode = member.userData.endNode;
    const newLength = startNode.position.distanceTo(endNode.position);
    // Since the geometry is unit height, scale Y to match the distance.
    member.scale.set(1, newLength, 1);
    // Position the beam at the midpoint.
    const midpoint = new THREE.Vector3().addVectors(startNode.position, endNode.position).multiplyScalar(0.5);
    member.position.copy(midpoint);
    // Orient the beam: align the unit Y axis to the direction between nodes.
    const direction = new THREE.Vector3().subVectors(endNode.position, startNode.position).normalize();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    member.setRotationFromQuaternion(quaternion);
}

// Update all beams in the structure.
export function updateAllMembers() {
    members.forEach(member => updateMember(member));
}

// Delete a node and remove all beams connected to it.
export function deleteNode(node) {
    scene.remove(node);
    const nodeIndex = nodes.indexOf(node);
    if (nodeIndex > -1) {
        nodes.splice(nodeIndex, 1);
    }
    // Remove all members attached to this node.
    for (let i = members.length - 1; i >= 0; i--) {
        const member = members[i];
        if (member.userData.startNode === node || member.userData.endNode === node) {
            deleteMember(member);
        }
    }
}

// Delete a beam (member) from the scene and the members array.
export function deleteMember(member) {
    scene.remove(member);
    const index = members.indexOf(member);
    if (index > -1) {
        members.splice(index, 1);
    }
}

// Add a selection outline to a node. This is a wireframe mesh that is slightly larger than the original node.
export function addSelectionOutline(node) {
    // If an outline already exists, do nothing.
    if (node.userData.selectionOutline) return;
    const outlineGeom = node.geometry.clone();
    const outlineMat = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
    });
    const outlineMesh = new THREE.Mesh(outlineGeom, outlineMat);
    // Position relative to the node (so it moves with it)
    outlineMesh.position.set(0, 0, 0);
    outlineMesh.rotation.set(0, 0, 0);
    outlineMesh.scale.copy(node.scale).multiplyScalar(1.1);
    node.add(outlineMesh); // Attach as child
    node.userData.selectionOutline = outlineMesh;
}

// Remove the selection outline from a node. This is called when the node is deselected or deleted.
export function removeSelectionOutline(node) {
    if (node.userData.selectionOutline) {
        // Remove the outline from the node rather than from the scene.
        node.remove(node.userData.selectionOutline);
        delete node.userData.selectionOutline;
    }
}