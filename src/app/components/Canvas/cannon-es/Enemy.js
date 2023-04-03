import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default class Enemy {
	constructor({ meshMaterial, bodyMaterial, position = { x: 0, y: 0, z: 3 } }) {
		this.meshMaterial = meshMaterial;
		this.bodyMaterial = bodyMaterial;

		this.position = position;

		this.createObject();
		this.createPhysics();
	}

	createObject() {
		this.mesh = new THREE.Mesh(
			new THREE.BoxGeometry(1, 1, 1),
			this.meshMaterial
		);
		this.mesh.position.copy(this.position);
	}

	createPhysics() {
		this.shape = new CANNON.Box(new CANNON.Vec3(1 * 0.5, 1 * 0.5, 1 * 0.5));
		this.body = new CANNON.Body({
			mass: 1,
			position: new CANNON.Vec3(0, 0, -3),
			shape: this.shape,
			material: this.bodyMaterial,
		});
		this.body.position.copy(this.position);
	}
}
