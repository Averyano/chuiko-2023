// Three & GSAP
import * as THREE from 'three';
import GSAP from 'gsap';
import each from 'lodash/each';
import map from 'lodash/map';
import normalizeWheel from 'normalize-wheel';

import GlobalHandler from '../../../classes/GlobalHandler';

// Classes
// import Component from '@averyano/core/src/classes/Component';
import Component from '../../../classes/Component';
import GalleryItem from './GalleryItem';
import MainGalleryItem from './MainGalleryItem';

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
				images: '.gallery__image',
				wImg: '.main__image--w',
				hImg: '.main__image--h',
				main: '.main',
				thumb: '.thumb',
				coverBackground: '.cover__background',
			},
		});

		this.scene = scene;
		this.sizes = sizes;
		this.extraSpeed = 200;
		this.textureLoader = new THREE.TextureLoader();
		this.currentSrc = null;
		this.isBoundReady = false;

		this.isPlayed = false;

		this.meshes = [];
		this.items = [];
		this.mainItems = [];
		this.backgroundItem = null;
		// this.backgroundImage = {};

		// Animation related
		this.speed = {
			current: 0,
			target: 0,
			lerp: 0.1,
		};

		this.velocity = 0;
		this.scrollVelocity = 0;
		this.direction = 1;

		this.maxWidth = 0;

		this.isMobile = this.sizes.width < 768;

		this.padding = this.isMobile ? 6 : 120;

		this.active = false;
		this.previous = null;
		this.isAnimating = false;
		this.isShowing = false;
		this.isRescaling = false;
		this.isPlayed = false;
		this.isKeyDown = false;
		this.isAutoplay = false;
		this.time = {
			start: 0,
			current: 0,
			end: 0,
		};

		this.isPausedGlobally = false;
		this.speedMulti = 1;
		this.speedExtraMotion = 1;

		this.metricsLength = 0;
		this.metricsTargetBreakdown = -1;
		this.metricsBreakdowns = [];
		this.currentBreakdownIndex = -1;
		this.metricsBreakdownsNamings = ['25%', '50%', '75%', '100%'];

		this.addEventListeners();
	}

	createItems() {
		return new Promise((res) => {
			this.getBounds().then((imageBounds) => {
				this.uniforms = {
					uSpeed: { value: 0 },
					uScrollVelocity: { value: this.scrollVelocity },
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

							resolve({ obj, texture, aspect, index, dataW: obj.dataW, dataH: obj.dataH });
						});
					});
				});

				for (const key in this.mainImages) {
					this.textureLoader.load(this.mainImages[key].src, (texture) => {
						const aspect = threeCover(
							texture,
							this.mainImages[key].bounds.width /
								this.mainImages[key].bounds.height
						);

						this.mainImages[key].texture = texture;
						this.mainImages[key].aspect = aspect;

						const item = new MainGalleryItem({
							obj: this.mainImages[key],
							texture,
							aspect,
							sizes: this.sizes,
							uniforms: this.uniforms,
							z: -1.5,
						});
						this.scene.add(item.mesh);
						this.meshes.push(item.mesh);
						this.mainItems.push(item);
					});
				}

				// BG Image
				// this.textureLoader.load(this.backgroundImage.src, (texture) => {
				// 	const aspect = threeCover(
				// 		texture,
				// 		this.backgroundImage.bounds.width /
				// 			this.backgroundImage.bounds.height
				// 	);

				// 	this.backgroundImage.texture = texture;
				// 	this.backgroundImage.aspect = aspect;

				// 	const item = new MainGalleryItem({
				// 		obj: this.backgroundImage,
				// 		texture,
				// 		aspect,
				// 		sizes: this.sizes,
				// 		uniforms: this.uniforms,
				// 		z: -1.5
				// 	});
				// 	this.scene.add(item.mesh);
				// 	this.meshes.push(item.mesh);
				// 	this.backgroundItem = item;
				// });

				// Create a mesh for each image and add it to the scene
				Promise.all(loadTexturesPromises).then((loadedData) => {
					loadedData.forEach(({ obj, texture, aspect, index, dataW, dataH }) => {
						const item = new GalleryItem({
							obj,
							texture,
							aspect,
							sizes: this.sizes,
							uniforms: this.uniforms,
							dataW: dataW,
							dataH: dataH,
						});

						// Add to scene
						this.scene.add(item.mesh);
						this.meshes.push(item.mesh);
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
			
				console.log('BoundReady');
				console.log(this.items);

				GSAP.set(this.elements.main, { autoAlpha: 0 }); // hides the DOM element @TODO
				GSAP.set(this.elements.thumb, { autoAlpha: 0 }); // hides the DOM element @TODO

			});
		});
	}

	updateItems(imageBounds) {
		console.log('UPDATE ITEMS');
		if (!imageBounds) {
			console.warn('No image bounds');
			return;
		}
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
			item.mesh.scale.set(item.bounds.width, item.bounds.height, 1);
			item.extraY = 0;

			item.getParams();
		});
		for (let i = 0; i < this.meshes.length; i++) {
			this.meshes[i].material.uniforms.uDarken.value = 0.5;
		}
	}

	checkMaxWidth(bounds) {
		this.maxWidth = Math.max(this.maxWidth, bounds.width + bounds.left);
	}

	getBounds() {
		this.wrapperBounds = this.element.getBoundingClientRect();
		this.wBounds = this.elements.wImg.getBoundingClientRect();
		this.hBounds = this.elements.hImg.getBoundingClientRect();
		
		return new Promise((resolve) => {
			// Create Images Array
			if (!this.imagesArray) {
				this.imagesArray = new Array(this.elements.images.length);
				each(this.elements.images, (image, i) => {
					this.imagesArray[i] = {
						bounds: image.getBoundingClientRect(),
						dataW: image.dataset.w,
						dataH: image.dataset.h,
						src: GlobalHandler.isWebpSupported
							? image.dataset.preWebp
							: image.dataset.pre,
					};
					this.checkMaxWidth(this.imagesArray[i].bounds);
				});
				// this.maxWidth += this.padding; // padding for the last image

				this.mainImages = {
					w: {
						bounds: this.elements.wImg.getBoundingClientRect(),
						src: GlobalHandler.isWebpSupported
							? this.elements.wImg.dataset.webp
							: this.elements.wImg.dataset.pre,
					},
					// h: {
					// 	bounds: this.elements.hImg.getBoundingClientRect(),
					// 	src: GlobalHandler.isWebpSupported ? this.elements.hImg.dataset.webp : this.elements.hImg.dataset.pre,
					// }
				};

				// this.backgroundImage = {
				// 	bounds: this.elements.coverBackground.getBoundingClientRect(),
				// 	src: GlobalHandler.isWebpSupported
				// 		? this.elements.coverBackground.dataset.webp
				// 		: this.elements.coverBackground.dataset.pre,
				// }
			}

			// Update Existing Images Array
			if (this.imagesArray) {
				this.maxWidth = 0;
				this.imagesArray.map((image, i) => {
					image.bounds = this.elements.images[i].getBoundingClientRect();
					this.checkMaxWidth(this.imagesArray[i].bounds);
				});
				// this.maxWidth += this.padding; // padding for the last image
			}

			if (this.mainImages) {
				this.mainImages.w.bounds = this.elements.wImg.getBoundingClientRect();
				console.log(this.mainImages.w.bounds);
				// this.mainImages.h.bounds = this.elements.hImg.getBoundingClientRect();
			}

			// if (this.backgroundImage) {
			// 	this.backgroundImage.bounds = this.elements.coverBackground.getBoundingClientRect();
			// }

			this.metricsBreakdowns = [
				this.maxWidth * 0.25,
				this.maxWidth * 0.5,
				this.maxWidth * 0.75,
				this.maxWidth,
			];
			this.metricsTargetBreakdown = this.metricsBreakdowns[0];
			this.currentBreakdownIndex = 0;
			// Return bounds
			this.imageBounds = this.imagesArray;
			resolve(this.imagesArray);
		});
	}

	/* INITIAL ANIMATION */
	show() {
		this.isShowing = true;
		this.direction = 1;

		// @TODO create a different animation
		// if (this.items.length > 0) {
		// 	GSAP.killTweensOf(this.speed);
		// 	GSAP.fromTo(
		// 		this.speed,
		// 		{
		// 			target: 1000,
		// 		},
		// 		{
		// 			target: 2,
		// 			duration: 3,
		// 			ease: 'power4.inOut',
		// 			// ease: 'in.expo',
		// 			onComplete: () => {
		// 				this.isShowing = false;
		// 				this.isPlayed = true;
		// 			},
		// 		}
		// 	);
		// }
	}

	hide() {
		// this overlay mesh opacity 1
	}

	/* RAF */
	update() {
		if (this.isRescaling || !this.isBoundReady) return;
		if (this.isAutoplay) {
			this.speed.current =
				1 * this.speedMulti * this.speedExtraMotion * this.direction;
		} else {
			this.speed.current = lerp(
				this.speed.current,
				this.speed.target,
				this.speed.lerp
			);
		}

		if (!this.isShowing && this.speedExtraMotion === 1)
			this.speed.current = clamp(this.speed.current, -120, 120);

		this.speed.target = this.velocity * this.direction;

		map(this.mainItems, (item) => {
			item.update();
		});
		map(this.items, (item) => {
			item.update();
			item.mesh.material.uniforms.uScrollVelocity.value = this.speed.current;
			item.extraX += this.speed.current; //@TODO

			// up

			if (this.direction === 1) {
				// down
				if (
					item.mesh.position.x >
					this.maxWidth - item.bounds.width - this.sizes.width
				) {
					item.extraX -= this.maxWidth;
					// console.log(item.mesh.position.y);
					// console.log('------------------ 1');
				}
			} else if (this.direction === -1) {
				// up
				if (
					item.mesh.position.x <
					-this.maxWidth + item.bounds.width + this.sizes.width
				) {
					item.extraX += this.maxWidth;
					// console.log(item.mesh.position.y);
					// console.log('------------------ -1 ');
				}
			}
		});

		requestIdleCallback(() => {
			if (this.currentHeight >= this.maxWidth) {
				console.log('Reached Max Height!');
				this.currentHeight = 0;
			}
			if (this.currentHeight < 0) {
				this.currentHeight = this.maxWidth;
			}
		});

		if (this.currentBreakdownIndex === -1) return;

		requestIdleCallback(() => {
			this.metricsLength += Math.abs(this.speed.current);

			if (this.metricsLength >= this.metricsTargetBreakdown) {
				// Move to next breakdown target
				this.currentBreakdownIndex++;

				if (this.currentBreakdownIndex < this.metricsBreakdowns.length) {
					this.metricsTargetBreakdown =
						this.metricsBreakdowns[this.currentBreakdownIndex];
					console.log('New Target', this.metricsTargetBreakdown);
				} else {
					// Handle the case when you have reached the end of the breakdowns array.
					// For example, you might want to stop further checks or reset the index.
					console.log('All targets reached!');
					this.currentBreakdownIndex = -1; // This line resets the index if needed
				}
			}
		});
	}

	onResize() {
		this.isRescaling = true;
		this.hide();
		// Gets bounds, updates meshes positions and scaling
		if (this.imageBounds) {
			this.getBounds().then(() => {
				this.updateItems(this.imageBounds);

				requestIdleCallback(() => {
					this.isRescaling = false;
				});

				if (this.isPlayed) {
					// this.show();
					this.playRaf();
				} // to show it one time only
				// this.show();
				this.isPlayed = true;
				console.log('show WebGL');
			});
		}
	}

	/* EVENTS */
	addEventListeners() {
		/* added in app.js */
		this.elements.wImg.addEventListener('load', () => {
			console.log('loaded');
			this.textureLoader.load((this.elements.wImg.src), ( texture ) => {
				if (!this.mainItems[0]) return;
				// in this example we create the material when the texture is loaded
				this.mainItems[0].mesh.material.uniforms.uTexture.value = texture;
				this.mainItems[0].mesh.material.uniforms.uTexture.value.needsUpdate = true;
				const bound = this.elements.wImg.getBoundingClientRect();
				if (this.mainItems.length > 0)
					this.mainItems[0].mesh.scale.set(bound.width, bound.height, 1);

			})

		});
	}

	onTouchDown({ x, y }) {
		if (this.isForwarding) return;
		// this.speed.target = this.speed.current - yDistance;
		this.speedCurrent = this.speed.current;
		this.isAutoplay = false;
		if (this.timer) clearTimeout(this.timer);
	}

	onTouchMove({ x }) {
		if (!this.isPlayed || this.isForwarding) return;
		const xDistance = x.start - x.end;
		this.direction = xDistance < 0 ? -1 : 1;
		// this.speed.target = this.speed.current - yDistance;
		// this.speed.target = clamp(this.speedCurrent + yDistance, -40, 40);
		this.speed.target = this.speedCurrent + xDistance * 3;
	}

	onTouchUp({ x, y }) {
		if (!this.isPlayed || this.isForwarding) return;
		this.speed.target = 2 * this.velocity * this.direction;

		this.pauseRaf();
	}

	onWheel(direction, pixelY) {
		if (!this.isPlayed || this.isForwarding) return;
		this.direction = direction;
		this.speed.target += pixelY * 0.5;

		this.pauseRaf();
	}

	onKeyDown(e) {
		if (this.isForwarding) return;
		if (!this.isKeyDown) {
			this.time.start = Date.now();
			this.isKeyDown = true;
		}

		this.time.current = Date.now();
		let diff = 100 * ((this.time.current - this.time.start) / 1000);

		this.pauseRaf();

		if (e.code === 'ArrowUp' || e.keyCode === 38) {
			e.preventDefault();
			this.direction = -1;
			this.speed.target -= diff;
		}
		if (e.code === 'ArrowDown' || e.keyCode === 40) {
			e.preventDefault();
			this.direction = 1;
			this.speed.target += diff;
		}
	}

	onKeyUp(e) {
		this.time = {
			start: null,
			current: null,
			end: null,
		};

		this.isKeyDown = false;

		// this.speed.target = 0;
	}

	destroy() {
		map(this.items, (item) => {
			this.scene.remove(item.mesh);
			item.destroy();
		});
	}

	/* FOR FULLSCREEN MODE (NOT USED) */
	calculateAspect(imageResolution, meshSize) {
		const padding = 1; // adjust this value to change the amount of padding
		// const padding = 10; // adjust this value to change the amount of padding
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

	pauseRaf() {
		this.velocity = 0;
		this.isAutoplay = false;

		if (this.timer) clearTimeout(this.timer);
		if (this.isPausedGlobally) return;
		this.timer = setTimeout(() => {
			this.playRaf();
		}, 5000);
	}

	playRaf() {
		this.isAutoplay = false;
		// this.velocity = 1;
	}

	setActive(item, id) {
		if (!this.mainItems[0] || this.items.length < 1) return;
		if (id) {
			item = this.items.find((i) => i.mesh.uuid === id);

			if (!item) return;
			for (let i = 0; i < this.meshes.length; i++) {
				this.meshes[i].material.uniforms.uDarken.value = 0.5;
			}
			this.mainItems[0].mesh.material.uniforms.uDarken.value = 1;
			item.mesh.material.uniforms.uDarken.value = 1;
		}

		if (!item || !item.fullSrc) return;

		this.currentSrc = item.fullSrc;
		console.log('✌🏻');
		console.log(item);

		// this.elements.wImg.src = item.fullSrc;
		this.textureLoader.load((item.fullSrc), ( texture ) => {
			console.log(texture);
			console.log(this.currentSrc, texture.image.src);
			if (!this.mainItems[0] || !texture.image.src.includes(this.currentSrc)) return;
			// in this example we create the material when the texture is loaded
			this.mainItems[0].mesh.material.uniforms.uTexture.value = texture;
			this.mainItems[0].mesh.material.uniforms.uTexture.value.needsUpdate = true;
			if (this.mainItems.length === 0) return;

			if (item.dataW == 1818) {
				this.mainItems[0].mesh.scale.set(this.wBounds.width, this.wBounds.height, 1);
			} else {
				this.mainItems[0].mesh.scale.set(this.hBounds.width, this.hBounds.height, 1);
			}
			// const bound = this.elements.wImg.getBoundingClientRect();
			// console.log(bound);
			// console.log(this.wBounds);
			// if (this.mainItems.length > 0)
			// 	this.mainItems[0].mesh.scale.set(bound.width, bound.height, 1);

		})
		// console.log(this.mainItems[0].mesh.material.uniforms.uTexture.value);


		// width and height are set in AddEventListeners
		// this.mainItems[0].texture = texture;
		// this.material.uniforms.textureImg.value = newTexture;
		// this.material.uniforms.textureImg.value.needsUpdate = true;
		// this.mainItems[0].aspect = threeCover(texture, 1818 / 1228);

		// const meshWidth = this.mesh.geometry.parameters.width;
		// const meshHeight = this.mesh.geometry.parameters.height;

		// const scaledValue = this.calculateAspect(
		// 	this.mesh.material.uniforms.uImageRes.value,
		// 	{
		// 		width: meshWidth,
		// 		height: meshHeight,
		// 	}
		// );

		// this.original.uResolution = new THREE.Vector2().copy(
		// 	this.mesh.material.uniforms.uResolution.value
		// );

		// this.animateMesh(item, camera, null);
		this.previous = item;
		clearTimeout(this.timer);
	}

	setInactive(canvas) {
		this.emit('inactive'); // calls this.scroll.start(); at app.js
		this.active = false;

		// this.animateMesh(this.previous, null, canvas);
		this.previous = null;
		this.timer = setTimeout(() => canvas.classList.remove('dg', 'ac'), 1000); // canvas z-index 99999
	}
}
