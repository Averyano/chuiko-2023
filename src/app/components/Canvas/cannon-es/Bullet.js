import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default class Bullet {
	constructor({ bodyMaterial, position = { x: 0, y: 0, z: 3 } }) {
		this.bodyMaterial = bodyMaterial;
		this.position = position;

		this.createObject();
		this.createPhysics();
	}

	createObject() {
		this.material = new THREE.MeshBasicMaterial();
		this.geometry = new THREE.SphereGeometry(0.25, 16, 16);
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.position.copy(this.position);
	}

	createPhysics() {
		this.shape = new CANNON.Sphere(0.5);
		this.body = new CANNON.Body({
			mass: 1,
			position: new CANNON.Vec3(0, 0, -3),
			shape: this.shape,
			material: this.bodyMaterial,
		});
		this.body.position.copy(this.position);
	}
}
