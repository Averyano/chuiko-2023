// Three & GSAP
import * as THREE from 'three';
import GSAP from 'gsap';
import each from 'lodash/each';
import map from 'lodash/map';
import normalizeWheel from 'normalize-wheel';

// Classes
import Component from '../../../classes/Component';
import GalleryItem from './GalleryItem';

// Utils
import { threeCover } from '../../../utils/threeCover';
import { lerp } from '../../../utils/utils';
import { clamp } from 'three/src/math/MathUtils';

export default class Gallery extends Component {
	constructor({ scene, sizes }) {
		super({
			element: '.cover',
			elements: {
				wrapper: '.cover__wrapper',
				images: '.cover__image',
			},
		});

		this.scene = scene;
		this.sizes = sizes;
		this.extraSpeed = 200;
		this.textureLoader = new THREE.TextureLoader();

		this.isBoundReady = false;

		this.items = [];

		// Animation related
		this.speed = {
			current: 0,
			target: 0,
			lerp: 0.1,
		};

		this.velocity = 1;
		this.direction = -1;

		this.maxHeight = 0;

		this.isMobile = this.sizes.width < 768;

		this.padding = !this.isMobile ? 300 : -200;

		this.active = false;
		this.previous = null;
		this.isAnimating = false;
		this.isShowing = false;
		this.isRescaling = false;
		this.isPlayed = false;

		this.addEventListeners();
	}

	checkMaxHeight(bounds) {
		this.maxHeight = Math.max(this.maxHeight, bounds.height + bounds.top);
	}

	getBounds() {
		this.wrapperBounds = this.element.getBoundingClientRect();

		return new Promise((resolve) => {
			// Create Images Array
			if (!this.imagesArray) {
				this.imagesArray = new Array(this.elements.images.length);
				each(this.elements.images, (image, i) => {
					this.imagesArray[i] = {
						bounds: image.getBoundingClientRect(),
						src: image.dataset.pre,
					};
					this.checkMaxHeight(this.imagesArray[i].bounds);
				});
			}

			// Update Existing Images Array
			if (this.imagesArray) {
				this.imagesArray.map(
					(image, i) =>
						(image.bounds = this.elements.images[i].getBoundingClientRect())
				);
			}

			// Return bounds
			this.imageBounds = this.imagesArray;

			resolve(this.imagesArray);
		});
	}

	// getBounds() {
	// 	each(this.elements.images, (image) => {
	// 		const bounds = image.getBoundingClientRect();
	// 		this.imageBounds.push({ bounds, src: image.src });
	// 	});
	// }

	createItems(imageBounds) {
		return new Promise((res) => {
			this.getBounds().then((imageBounds) => {
				this.uniforms = {
					uSpeed: { value: 0 },
					uOffset: {
						value: new THREE.Vector2(0.0, 0.0),
					},
				};

				// Load all textures in the correct order
				const loadTexturesPromises = this.imageBounds.map((obj, index) => {
					return new Promise((resolve) => {
						this.textureLoader.load(obj.src, (texture) => {
							const aspect = threeCover(
								texture,
								obj.bounds.width / obj.bounds.height
							);

							resolve({ obj, texture, aspect, index });
						});
					});
				});

				// Create a mesh for each image and add it to the scene
				Promise.all(loadTexturesPromises).then((loadedData) => {
					loadedData.forEach(({ obj, texture, aspect, index }) => {
						const item = new GalleryItem({
							obj,
							texture,
							aspect,
							sizes: this.sizes,
							uniforms: this.uniforms,
						});

						// Add to scene
						this.scene.add(item.mesh);

						// Also to arrays for later usage
						this.items.push(item);
					});

					if (this.items.length === imageBounds.length) {
						this.isReady = true;
						res();
						this.scene.traverse((obj) => (obj.frustumCulled = false)); // Workaround to avoid lag, renders all objects at all times. Not the best performance
						this.onResize();
					} // fin
				});

				this.isBoundReady = true;
				GSAP.set(this.elements.wrapper, { autoAlpha: 0 }); // hides the DOM element
			});
		});
	}

	updateItems(imageBounds) {
		this.items.map((item, i) => {
			const x = (imageBounds[i].bounds.left + imageBounds[i].bounds.right) / 2;
			const y =
				(imageBounds[i].bounds.top +
					imageBounds[i].bounds.bottom +
					window.scrollY * 2) /
				2;

			const pos = new THREE.Vector3(
				x - this.sizes.width / 2,
				-y + this.sizes.height / 2,
				-1
			);

			item.original.position = pos;
			item.mesh.position.copy(pos);

			item.bounds = imageBounds[i].bounds;

			item.getParams();
		});
	}

	calculateAspect(imageResolution, meshSize) {
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

	animateMesh(item, camera, canvas, isActive) {
		this.isAnimating = true;

		if (this.active) {
			GSAP.to(item.mesh.material.uniforms.uZoomScale.value, {
				x: item.modified.uZoomScale.x,
				y: item.modified.uZoomScale.y,
			});

			GSAP.to(item.mesh.material.uniforms.uResolution.value, {
				x: item.modified.uResolution.x,
				y: item.modified.uResolution.y,
			});
		} else {
			GSAP.to(item.mesh.material.uniforms.uZoomScale.value, {
				x: item.original.uZoomScale.x,
				y: item.original.uZoomScale.y,
			});

			GSAP.to(item.mesh.material.uniforms.uResolution.value, {
				x: item.original.uResolution.x,
				y: item.original.uResolution.y,
			});
		}

		GSAP.to(item.mesh.material.uniforms.uProgress, {
			value: this.active ? 1 : 0,
		});

		if (this.active) {
			GSAP.to(item.mesh.position, {
				x: camera.position.x,
				y: camera.position.y,
				z: 1,
				onComplete: () => (this.isAnimating = false),
			});
		} else {
			GSAP.to(item.mesh.position, {
				x: item.original.position.x,
				y: item.original.position.y,
				z: item.original.position.z,
			});
		}

		this.isAnimating = false;
	}

	show() {
		this.isShowing = true;

		if (this.items.length > 0) {
			GSAP.fromTo(
				this.speed,
				{
					target: -180,
				},
				{
					target: -2,
					duration: 3,
					ease: 'power4.inOut',
					// ease: 'in.expo',
					onComplete: () => {
						this.isShowing = false;
						this.isPlayed = true;
					},
				}
			);
		}
	}

	update() {
		if (this.isRescaling || !this.isBoundReady) return;

		this.speed.current = lerp(
			this.speed.current,
			this.speed.target,
			this.speed.lerp
		);

		if (!this.isShowing)
			this.speed.current = clamp(this.speed.current, -120, 120);

		this.speed.target = 2 * this.velocity * this.direction;

		map(this.items, (item) => {
			item.update();
			item.extraY += this.speed.current;

			// up

			if (this.direction === 1) {
				// down
				if (item.mesh.position.y > this.sizes.height + item.bounds.height) {
					item.extraY -= this.maxHeight;
					// console.log(item.mesh.position.y);
					// console.log('------------------');
				}
			} else if (this.direction === -1) {
				// up
				if (
					item.mesh.position.y <
					-this.maxHeight + this.sizes.height + item.bounds.height
				) {
					item.extraY += this.maxHeight;
					// console.log(item.mesh.position.y);
					// console.log('------------------');
				}
			}
		});
	}

	setActive(item, camera) {
		// get data from item
		this.emit('active'); // calls this.scroll.stop(); at app.js
		this.active = true;

		this.animateMesh(item, camera, null);
		this.previous = item;
		clearTimeout(this.timer);
	}

	setInactive(canvas) {
		this.emit('inactive'); // calls this.scroll.start(); at app.js
		this.active = false;

		this.animateMesh(this.previous, null, canvas);
		this.previous = null;
		this.timer = setTimeout(() => canvas.classList.remove('dg', 'ac'), 1000); // canvas z-index 99999
	}

	onResize() {
		this.isRescaling = true;
		// Gets bounds, updates meshes positions and scaling
		if (this.imageBounds) {
			this.getBounds().then(() => {
				this.updateItems(this.imageBounds);
				this.isRescaling = false;

				if (!this.isPlayed) {
					this.show();
					console.log('show WebGL');
				}
			});
		}
	}

	addEventListeners() {}

	onTouchDown({ x, y }) {
		// this.speed.target = this.speed.current - yDistance;
		this.speedCurrent = this.speed.current;
	}

	onTouchMove({ y }) {
		if (!this.isPlayed) return;
		const yDistance = y.start - y.end;
		this.direction = yDistance < 0 ? -1 : 1;
		// this.speed.target = this.speed.current - yDistance;
		this.speed.target = this.speedCurrent + yDistance;
	}

	onTouchUp({ x, y }) {
		if (!this.isPlayed) return;
		this.speed.target = 2 * this.velocity * this.direction;
	}

	onWheel(direction, pixelY) {
		if (!this.isPlayed) return;
		this.direction = direction;
		this.speed.target += pixelY * 3;
	}

	destroy() {
		map(this.items, (item) => {
			this.scene.remove(item.mesh);
			item.destroy();
		});
	}
}
