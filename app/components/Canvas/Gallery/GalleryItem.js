// Three & GSAP
import * as THREE from 'three';

// Shaders
import imageVertex from '../../../../shared/shaders/image.vert';
import imageFragment from '../../../../shared/shaders/image.frag';

export default class GalleryItem {
	constructor({ obj, texture, aspect, sizes, uniforms, dataW, dataH }) {
		// obj = { src, bounds }
		this.sizes = sizes;
		this.uniforms = uniforms;
		this.bounds = obj.bounds;
		this.extraX = 0;
		this.dataW = dataW;
		this.dataH = dataH;

		this.thumbnailSrc = obj.src; // "/images/thumbnail/IMG_9163-thumbnail.jpg"
		this.fullSrc = obj.src
			.replace('thumbnail/', '1x/')
			.replace('-thumbnail', ''); // "/images/1x/IMG_9163.jpg"

		this.original = {
			position: null, // vec3
			uResolution: null, // vec2
			uZoomScale: null, // vec2
		};

		this.createMesh({ obj, texture, aspect });

		this.getParams(); // for onClick animation fullscreen
	}

	// update() {
	// 	this.mesh.position.y =
	// }

	createMesh({ obj, texture, aspect }) {
		const material = new THREE.ShaderMaterial({
			uniforms: {
				...this.uniforms, // uSpeed, uOffset
				uProgress: { value: 0 },

				// Texture
				uTexture: {
					value: texture,
				},
				// Scale Res
				uScale: { value: aspect },
				uZoomScale: { value: new THREE.Vector2(1.0, 1.0) },
				uResolution: { value: new THREE.Vector2(aspect.x, aspect.y) },
				uImageRes: {
					value: {
						x: texture.source.data.width, // full image width
						y: texture.source.data.height, // full image height
					},
				},
				uMouse: { value: new THREE.Vector2(0.0, 0.0) },
				uDarken: { value: 1.0 },
			},
			// wireframe: true,
			vertexShader: imageVertex,
			fragmentShader: imageFragment,
			// transparent: true,
		});

		const geometry = new THREE.PlaneGeometry(1, 1, 6, 6);

		this.mesh = new THREE.Mesh(geometry, material); 

		const x = (obj.bounds.left + obj.bounds.right) / 2;
		const y = (obj.bounds.top + obj.bounds.bottom) / 2;

		this.mesh.scale.set(obj.bounds.width, obj.bounds.height, 1);
		// Position
		this.mesh.position.set(
			x - this.sizes.width / 2,
			-y + this.sizes.height / 2,
			-1
		);
	}

	updateMeshPosition() {
		const x = (this.bounds.left + this.bounds.right) / 2;
		const y = (this.bounds.top + this.bounds.bottom) / 2;

		this.mesh.scale.set(this.bounds.width, this.bounds.height, 1);
		// Position
		this.mesh.position.set(
			x - this.sizes.width / 2,
			y + this.sizes.height / 2,
			-1
		);
	}

	calculateAspect(imageResolution, meshSize) {
		// Creates an effect similar to css background-position: cover;
		const padding = 10; // adjust this value to change the amount of padding
		const imageAspect = imageResolution.x / imageResolution.y;
		const screenAspect =
			(this.sizes.width - 2 * padding) / (this.sizes.height - 2 * padding);

		if (imageAspect > screenAspect) {
			// image is wider relative to the screen (with padding) - scale based on width
			return {
				x: (this.sizes.width - 2 * padding) / meshSize.width,
				y: (this.sizes.width - 2 * padding) / meshSize.width / imageAspect,
			};
		} else {
			// image is taller relative to the screen (with padding) - scale based on height
			return {
				x: ((this.sizes.height - 2 * padding) / meshSize.height) * imageAspect,
				y: (this.sizes.height - 2 * padding) / meshSize.height,
			};
		}
	}

	getParams() {
		// This function calculates the size of the mesh when enlarged (when you click on it)
		const meshWidth = this.mesh.geometry.parameters.width;
		const meshHeight = this.mesh.geometry.parameters.height;

		const scaledValue = this.calculateAspect(
			this.mesh.material.uniforms.uImageRes.value,
			{
				width: meshWidth,
				height: meshHeight,
			}
		);

		this.original.uResolution = new THREE.Vector2().copy(
			this.mesh.material.uniforms.uResolution.value
		);

		this.original.uZoomScale = new THREE.Vector2().copy(
			this.mesh.material.uniforms.uZoomScale.value
		);

		this.modified = {
			uZoomScale: new THREE.Vector2().copy(scaledValue),
			uResolution: new THREE.Vector2().copy(scaledValue),
		};
	}

	update() {
		// prettier-ignore
		this.mesh.position.x =
			-((this.bounds.left + this.bounds.right) / 2) +
			this.sizes.width / 2 +
			this.extraX;
	}

	destroy() {
		this.mesh.geometry.dispose();
		this.mesh.material.dispose();
		// Dispose texture if it exists
		if (this.mesh.material.map) {
			this.mesh.material.map.dispose();
		}
	}
}
