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
	constructor({ scene, mainScene, sizes }) {
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
		this.mainScene = mainScene;
		this.sizes = sizes;
		this.extraSpeed = 200;
		this.textureLoader = new THREE.TextureLoader();
		this.textureCache = new Map(); // fullSrc → THREE.Texture, populated by preloadFullResTextures
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

		this.isScrollingToItem = false;
		this._scrollTween = null;
		this.hoveredUuid = null;

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

							resolve({
								obj,
								texture,
								aspect,
								index,
								dataW: obj.dataW,
								dataH: obj.dataH,
							});
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
						item.mesh.frustumCulled = false;
						this.mainScene.add(item.mesh);
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
				const filmPromise = new Promise((resolve) => {
					this.textureLoader.load('/images/film.png', (texture) => {
						this.filmTexture = texture;
						resolve(texture);
					});
				});

				Promise.all([Promise.all(loadTexturesPromises), filmPromise]).then(
					([loadedData, filmTexture]) => {
						loadedData.forEach(
							({ obj, texture, aspect, index, dataW, dataH }) => {
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

								// Film strip overlay mesh — sits in front of the thumbnail (z=-0.9 vs z=-1)
								const filmMesh = new THREE.Mesh(
									new THREE.PlaneGeometry(1, 1),
									new THREE.MeshBasicMaterial({
										map: filmTexture,
										transparent: true,
										depthWrite: false,
									})
								);
								filmMesh.scale.set(item.bounds.width, item.bounds.height, 1);
								filmMesh.position.set(
									item.mesh.position.x,
									item.mesh.position.y,
									-0.9
								);
								filmMesh.frustumCulled = false;
								this.scene.add(filmMesh);
								item.filmMesh = filmMesh;
							}
						);

						if (this.items.length === imageBounds.length) {
							this.isReady = true;
							res();
							this.scene.traverse((obj) => (obj.frustumCulled = false)); // Workaround to avoid lag, renders all objects at all times. Not the best performance
							this.onResize();
							this.preloadFullResTextures();
						} // fin
					}
				);

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
			if (item.mesh.material.uniforms.uResolution) {
				item.mesh.material.uniforms.uResolution.value.set(
					item.bounds.width,
					item.bounds.height
				);
			}
			if (item.filmMesh) {
				item.filmMesh.scale.set(item.bounds.width, item.bounds.height, 1);
				item.filmMesh.position.set(
					item.mesh.position.x,
					item.mesh.position.y,
					-0.9
				);
			}
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

			if (item.filmMesh) {
				item.filmMesh.position.x = item.mesh.position.x;
				item.filmMesh.position.y = item.mesh.position.y;
			}

			if (!this.isScrollingToItem) {
				item.extraX += this.speed.current;

				if (
					item.mesh.position.x >
					this.maxWidth - item.bounds.width - this.sizes.width
				) {
					item.extraX -= this.maxWidth;
				} else if (
					item.mesh.position.x <
					-this.maxWidth + item.bounds.width + this.sizes.width
				) {
					item.extraX += this.maxWidth;
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

				// Reposition and rescale the main preview mesh to match the new DOM bounds
				if (this.mainItems[0] && this.wBounds) {
					const b = this.wBounds;
					this.mainItems[0].mesh.scale.set(b.width, b.height, 1);
					this.mainItems[0].mesh.position.set(
						(b.left + b.right) / 2 - this.sizes.width / 2,
						-((b.top + b.bottom) / 2) + this.sizes.height / 2,
						-1.5
					);
					if (this.mainItems[0].mesh.material.uniforms.uResolution) {
						this.mainItems[0].mesh.material.uniforms.uResolution.value.set(
							b.width,
							b.height
						);
					}
				}

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
			this.textureLoader.load(this.elements.wImg.src, (texture) => {
				if (!this.mainItems[0]) return;
				// in this example we create the material when the texture is loaded
				this.mainItems[0].mesh.material.uniforms.uTexture.value = texture;
				this.mainItems[0].mesh.material.uniforms.uTexture.value.needsUpdate = true;
				const bound = this.elements.wImg.getBoundingClientRect();
				if (this.mainItems.length > 0)
					this.mainItems[0].mesh.scale.set(bound.width, bound.height, 1);
			});
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
		if (this.isForwarding || e.repeat) return;

		if (e.code === 'ArrowLeft' || e.keyCode === 37) {
			e.preventDefault();
			this._navigateByKey(-1);
		} else if (e.code === 'ArrowRight' || e.keyCode === 39) {
			e.preventDefault();
			this._navigateByKey(1);
		}
	}

	_navigateByKey(dir) {
		if (!this.items.length) return;
		const currentIndex = this.previous ? this.items.indexOf(this.previous) : 0;
		const nextIndex =
			(currentIndex + dir + this.items.length) % this.items.length;
		this.scrollToItem(this.items[nextIndex]);
	}

	onKeyUp(e) {}

	destroy() {
		map(this.items, (item) => {
			this.scene.remove(item.mesh);
			if (item.filmMesh) {
				this.scene.remove(item.filmMesh);
				item.filmMesh.geometry.dispose();
				item.filmMesh.material.dispose();
			}
			item.destroy();
		});
		map(this.mainItems, (item) => {
			this.mainScene.remove(item.mesh);
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

	preloadFullResTextures() {
		this.items.forEach((item) => {
			if (this.textureCache.has(item.fullSrc)) return;
			this.textureLoader.load(item.fullSrc, (texture) => {
				this.textureCache.set(item.fullSrc, texture);
			});
		});
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

			// Re-apply hover highlight that the bulk reset just cleared
			if (this.hoveredUuid && this.hoveredUuid !== id) {
				const hovered = this.items.find(
					(i) => i.mesh.uuid === this.hoveredUuid
				);
				if (hovered) hovered.mesh.material.uniforms.uDarken.value = 1;
			}
		}

		if (!item || !item.fullSrc) return;

		this.currentSrc = item.fullSrc;

		const applyTexture = (texture) => {
			if (!this.mainItems[0] || !texture.image.src.includes(this.currentSrc))
				return;
			this.mainItems[0].mesh.material.uniforms.uTexture.value = texture;
			this.mainItems[0].mesh.material.uniforms.uTexture.value.needsUpdate = true;
			if (item.dataW == 1818) {
				this.mainItems[0].mesh.scale.set(
					this.wBounds.width,
					this.wBounds.height,
					1
				);
			} else {
				this.mainItems[0].mesh.scale.set(
					this.hBounds.width,
					this.hBounds.height,
					1
				);
			}
		};

		const cached = this.textureCache.get(item.fullSrc);
		if (cached) {
			applyTexture(cached);
		} else {
			// Preload hasn't finished for this image yet — load it now and cache on arrival
			this.textureLoader.load(item.fullSrc, (texture) => {
				this.textureCache.set(item.fullSrc, texture);
				applyTexture(texture);
			});
		}

		this.previous = item;
		clearTimeout(this.timer);
	}

	setHovered(uuid) {
		if (uuid === this.hoveredUuid) return;

		// Restore the previously hovered item if it isn't the raycaster-active item
		if (this.hoveredUuid) {
			const prev = this.items.find((i) => i.mesh.uuid === this.hoveredUuid);
			if (prev && prev !== this.previous) {
				prev.mesh.material.uniforms.uDarken.value = 0.5;
			}
		}

		this.hoveredUuid = uuid;

		if (uuid) {
			const item = this.items.find((i) => i.mesh.uuid === uuid);
			if (item) item.mesh.material.uniforms.uDarken.value = 1;
		}
	}

	setInactive(canvas) {
		this.emit('inactive'); // calls this.scroll.start(); at app.js
		this.active = false;

		// this.animateMesh(this.previous, null, canvas);
		this.previous = null;
		this.timer = setTimeout(() => canvas.classList.remove('dg', 'ac'), 1000); // canvas z-index 99999
	}

	scrollToItem(item) {
		if (!item || !this.items.length || !this.isBoundReady) return;

		// Kill any in-flight tween first so extraX values are stable before we snapshot
		if (this._scrollTween) this._scrollTween.kill();

		// Show the preview immediately
		this.setActive(null, item.mesh.uuid);

		// Compute current world x directly from extraX — mesh.position.x may be
		// stale by one frame if a previous tween was just killed
		const domCenter = (item.bounds.left + item.bounds.right) / 2;
		const currentPosX = -domCenter + this.sizes.width / 2 + item.extraX;

		// Distance needed to bring the item to world x = 0 (raycaster center)
		let delta = -currentPosX;

		// Always take the shorter arc around the infinite loop
		if (this.maxWidth > 0 && Math.abs(delta) > this.maxWidth / 2) {
			delta = delta > 0 ? delta - this.maxWidth : delta + this.maxWidth;
		}

		// Snapshot all extraX values now (after kill, before tween starts)
		const startX = this.items.map((i) => i.extraX);

		this.isScrollingToItem = true;
		this.speed.current = 0;
		this.speed.target = 0;

		const proxy = { t: 0 };
		this._scrollTween = GSAP.to(proxy, {
			t: 1,
			duration: 1.2,
			ease: 'power3.out',
			onUpdate: () => {
				this.items.forEach((it, i) => {
					it.extraX = startX[i] + delta * proxy.t;
				});
			},
			onComplete: () => {
				this.isScrollingToItem = false;
				// Normalize extraX for all items — the tween may have displaced items
				// past the wrap boundary by more than one maxWidth
				this._normalizeExtraX();
			},
		});
	}

	_normalizeExtraX() {
		this.items.forEach((item) => {
			const domCenter = (item.bounds.left + item.bounds.right) / 2;
			const wrapRight = this.maxWidth - item.bounds.width - this.sizes.width;
			const wrapLeft = -this.maxWidth + item.bounds.width + this.sizes.width;
			let posX = -domCenter + this.sizes.width / 2 + item.extraX;
			while (posX > wrapRight) {
				item.extraX -= this.maxWidth;
				posX -= this.maxWidth;
			}
			while (posX < wrapLeft) {
				item.extraX += this.maxWidth;
				posX += this.maxWidth;
			}
		});
	}
}
