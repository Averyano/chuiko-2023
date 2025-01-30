// Three
import * as THREE from 'three';

export default class Raycaster {
	constructor({ meshes }) {
		this.el = new THREE.Raycaster();
		this.dbg3 = document.querySelector('.dbg3');

		this.currentIntersect = null;
		this.intersect = {
			current: null,
			previous: null,
		};

		this.galleryMeshes = meshes;

		this.isIntersecting = false;
		this.isFullscreen = false;
		this.isCleared = false;

		this.addEventListeners();
	}

	clearMeshes() {
		// Clear
		// for (let i = 0; i < this.galleryMeshes.length; i++) {
		// 	this.galleryMeshes[i].material.uniforms.uDarken.value = 1;
		// }
		this.isCleared = true;
	}

	update() {
		const intersects = this.el.intersectObjects(this.galleryMeshes);
		if (intersects.length && !this.isFullscreen) {
			// show
			// if (!this.currentIntersect) console.log('mouse enter');
			this.currentIntersect = intersects[0];

			// if (!window.isMobile)
			// 	this.currentIntersect.object.material.uniforms.uDarken.value = 1.05;

			this.isIntersecting = true;
		} else {
			// hide
			this.isIntersecting = false;

			if (this.currentIntersect) {
				this.currentIntersect = null;
				this.isIntersecting = false;
			}
		}

		if (this.isIntersecting && !this.isCleared)
			requestIdleCallback(this.clearMeshes.bind(this));

		this.dbg3.innerHTML = `isIntersecting: ${this.isIntersecting}`;
	}

	addEventListeners() {
		window.addEventListener('mousemove', () => {
			if (this.currentIntersect) this.isCleared = false;
		});
	}
}
