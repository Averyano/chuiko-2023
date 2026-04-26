import * as THREE from 'three';
import bgblurVert from '../../../../shared/shaders/bgblur.vert';
import bgblurFrag from '../../../../shared/shaders/bgblur.frag';

export default class BgBlurItem {
	constructor({ scene, sizes, texture }) {
		this.scene = scene;
		this.sizes = sizes;
		this._createMesh(texture);
	}

	_createMesh(texture) {
		this.material = new THREE.ShaderMaterial({
			uniforms: {
				uTexture: { value: texture },
				uResolution: { value: new THREE.Vector2(this.sizes.width, this.sizes.height) },
				uImageRes: {
					value: new THREE.Vector2(
						texture.source.data.width,
						texture.source.data.height
					),
				},
				uOpacity: { value: 0 },
			},
			vertexShader: bgblurVert,
			fragmentShader: bgblurFrag,
			transparent: true,
			depthWrite: false,
		});

		this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material);
		this.mesh.scale.set(this.sizes.width, this.sizes.height, 1);
		this.mesh.position.set(0, 0, -2);
		this.mesh.frustumCulled = false;
		this.scene.add(this.mesh);

		this.darkOverlay = new THREE.Mesh(
			new THREE.PlaneGeometry(1, 1),
			new THREE.MeshBasicMaterial({
				color: 0x050505,
				opacity: 0.8,
				transparent: true,
				depthWrite: false,
			})
		);
		this.darkOverlay.scale.set(this.sizes.width, this.sizes.height, 1);
		this.darkOverlay.position.set(0, 0, -1.9);
		this.darkOverlay.frustumCulled = false;
		this.scene.add(this.darkOverlay);
	}

	updateTexture(texture) {
		this.material.uniforms.uTexture.value = texture;
		this.material.uniforms.uImageRes.value.set(
			texture.source.data.width,
			texture.source.data.height
		);
	}

	show() {
		this.material.uniforms.uOpacity.value = 1;
	}

	onResize(sizes) {
		this.sizes = sizes;
		this.mesh.scale.set(sizes.width, sizes.height, 1);
		this.material.uniforms.uResolution.value.set(sizes.width, sizes.height);
		this.darkOverlay.scale.set(sizes.width, sizes.height, 1);
	}

	destroy() {
		this.scene.remove(this.mesh);
		this.mesh.geometry.dispose();
		this.mesh.material.dispose();
		this.scene.remove(this.darkOverlay);
		this.darkOverlay.geometry.dispose();
		this.darkOverlay.material.dispose();
	}
}
