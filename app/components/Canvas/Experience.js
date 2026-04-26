// Three
import * as THREE from 'three';
THREE.Cache.enabled = true;
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { LensDistortionShader } from './LensDistortionShader.js';
// Libraries
import GSAP from 'gsap';

// Classes
import Canvas from '../../classes/Canvas';

// Canvas Components
import Gallery from './Gallery';
import Camera from './Camera';
// import Debug from './Debug';
import Lights from './Lights';
import Raycaster from './Raycaster';

// Utils
import { lerp } from '../../utils/utils';
import { clamp } from 'three/src/math/MathUtils';
import map from 'lodash/map';
import each from 'lodash/each';

// Shaders
import vertexShader from '../../../shared/shaders/vertex.glsl';
import fragmentShader from '../../../shared/shaders/fragment.glsl';

// Scene & renderer are created in Canvas.js class

export default class Experience extends Canvas {
	constructor(el) {
		super(el);

		this.intersectId = {
			current: null,
			previous: null,
		};
		this.dbg1 = document.querySelector('.dbg1');
		this.dbg2 = document.querySelector('.dbg2');
		this.dbg4 = document.querySelector('.dbg4');

		this.speed = 0;
		this.x = {
			start: 0,
			distance: 0,
			end: 0,
		};

		// this.loadTextures();

		this.isReady = false; // update method is called only when true

		this.camera = new Camera({ sizes: this.sizes });
		this.scene.add(this.camera.el);
		this.isMobile = this.sizes.width < 768;

		// Separate scene for the main preview image so it bypasses the distortion pass
		this.mainScene = new THREE.Scene();

		this.gallery = new Gallery({
			scene: this.scene,
			mainScene: this.mainScene,
			sizes: this.sizes,
		});
		this.isTouch = false;
		this.velocity = 1;
		this.direction = 1;

		// this.createLogoScene();

		// this.controls = new OrbitControls(this.camera.el, this.element);
		// this.controls.enableDamping = true;

		this.lights = new Lights({
			scene: this.scene,
		});

		this.mouse = new THREE.Vector2();
		this.hoverRaycaster = new THREE.Raycaster();
		this.touch = {
			start: 0,
			end: 0,
		};
		this.isTouch = false;
		this.clickStart = { x: 0, y: 0 };

		this.clock = new THREE.Clock();
		this.oldElapsedTime = 0;

		// if (!this.isMobile) this.createComposer();
		this.createComposer();

		// this.createGui();
		this.createRaycaster();

		this.addEventListeners();
		this.onResize();

		this.isReady = true;

		window.experience = this;

		this.extraDistort = {
			target: 100,
			current: 100,
		};
		this.motionTimer = null;

		console.log(this);
	}

	loadTextures() {
		this.textureLoader = new THREE.TextureLoader();
		// this.logoImg = this.textureLoader.load('/images/textureTest.png');
		// this.selectionImages = {
		// 	designs: this.textureLoader.load('/images/designs.jpg'),
		// 	websites: this.textureLoader.load('/images/websites.jpg'),
		// };
	}

	/**
	 * Utility
	 */
	createGSAP() {
		this.timeline = GSAP.timeline();
		this.xSetter = GSAP.quickSetter('.dot', 'y', 'px');
		GSAP.utils.pipe(
			GSAP.utils.clamp(0, 100), //make sure the number is between 0 and 100
			GSAP.utils.snap(5), //snap to the closest increment of 5
			GSAP.quickSetter('.dot', 'y', 'px') //apply it to the #id element's x property and append a "px" unit
		);
	}

	createGui() {
		/* Add all variables to debugObject*/
		// this.debugObject = this.params;
		this.selectedItem = {
			num: 0,
		};
		this.debug = new Debug(this.params, this.selectedItem);
	}

	createElements() {
		this.uniforms = {
			uTime: { value: 0 },
		};
		this.geometry = new THREE.PlaneGeometry(1, 1);
		this.material = new THREE.ShaderMaterial({
			uniforms: this.uniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
		});

		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.scale.set(this.sizes.width / 2, this.sizes.height / 2, 1);
		this.scene.add(this.mesh);
	}

	createRaycaster() {
		this.raycaster = new Raycaster({
			meshes: this.gallery.meshes,
		});
	}

	createComposer() {
		this.params = {
			enableDistortion: true,
			baseIor: 1.0,
			bandOffset: 0.0002,
			// bandOffset: 0,
			jitterIntensity: 1.3,
			samples: 7,
			distortionMode: 'rygcbv',
		};

		this.composer = new EffectComposer(this.renderer);
		this.composer.addPass(new RenderPass(this.scene, this.camera.el));

		this.distortPass = new ShaderPass(LensDistortionShader);
		this.distortPass.material.defines.CHROMA_SAMPLES = this.params.samples;

		this.distortPass.enabled = this.params.enableDistortion;
		this.distortPass.material.uniforms.baseIor.value = this.params.baseIor;
		this.distortPass.material.uniforms.bandOffset.value =
			this.params.bandOffset;
		this.distortPass.material.uniforms.jitterOffset.value += 0.01;
		this.distortPass.material.uniforms.jitterIntensity.value =
			this.params.jitterIntensity;

		// this.distortPass.renderToScreen = true;
		this.composer.addPass(this.distortPass);
	}
	/**
	 * Textures & Models
	 */

	// This method is called in app.js at onPreloaded()
	updateImages(cb) {
		console.log('u');
		if (this.gallery.items.length === 0) {
			this.gallery.createItems(this.gallery.imageBounds).then(() => {
				cb();
				this.isReady = true;
			});
		} else {
			this.gallery.updateItems(this.gallery.imageBounds);
		}
	}

	/**
	 * Elements & Lights
	 */

	update() {
		this.elapsedTime = this.clock.getElapsedTime();

		// this.raycaster.el.setFromCamera(this.mouse, this.camera.el);
		this.raycaster.el.setFromCamera({ x: 0, y: -0.95 }, this.camera.el);

		if (window.isMobile) this.raycaster.el.setFromCamera({ x: 0, y: -0.75 }, this.camera.el);
		
		this.raycaster.update();

		if (this.raycaster.currentIntersect) {
			this.dbg4.innerHTML = this.raycaster.currentIntersect.object.uuid;
			this.intersectId.current = this.raycaster.currentIntersect.object.uuid;

			if (this.intersectId.current !== this.intersectId.previous) {
				this.intersectId.previous = this.intersectId.current;
				this.gallery.setActive(null, this.intersectId.current);
			}
		}

		// Mouse-hover highlight — set uDarken=1 on whichever thumbnail the cursor is over
		if (!window.isMobile && this.gallery && this.gallery.items.length) {
			this.hoverRaycaster.setFromCamera(this.mouse, this.camera.el);
			const hits = this.hoverRaycaster.intersectObjects(
				this.gallery.items.map((i) => i.mesh)
			);
			this.gallery.setHovered(hits.length > 0 ? hits[0].object.uuid : null);
		}
		// console.log(this.elapsedTime);

		// Calculate the needed rotation

		// Update Image mesh
		// this.selectionScene.update(this.mouse.x, this.mouse.y);
		this.gallery.update();

		// Controls update
		// this.controls.update();
		//  "three": "0.150.1"
		// Scene
		// this.renderer.render(this.scene, this.camera.el);
		if (this.composer) {
			// this.velocity = (2 * this.gallery.speed.current) / 10;
			this.velocity = lerp(this.velocity, this.gallery.speed.current, 0.05);
			this.velocity = clamp(this.velocity, -120, 120);
			this.gallery.scrollVelocity = this.velocity;
			
			this.extraDistort.current = lerp(
				this.extraDistort.current,
				this.extraDistort.target,
				0.05
			);

			this.distortPass.enabled = this.params.enableDistortion;
			// iorVal = clamp(iorVal, 0.8, 0.92);

			this.distortPass.material.uniforms.baseIor.value =
				this.params.baseIor +
				this.direction *
					Math.exp(
						Math.abs(
							this.velocity * (this.extraDistort.current * 0.01) * 0.02
						) - 1
					) *
					0.0001 *
					-1;

			this.distortPass.material.uniforms.bandOffset.value =
				this.params.bandOffset *
				Math.pow(
					Math.abs(this.velocity * (this.extraDistort.current * 0.01) * 0.1),
					1.35
				) *
				this.direction;

			this.distortPass.material.uniforms.jitterOffset.value += 0.01;
			this.distortPass.material.uniforms.jitterIntensity.value =
				this.params.jitterIntensity;

			this.composer.render();

			// Render main preview image without distortion on top.
			// clearDepth() resets depth values left by the ShaderPass full-screen quad
			// so the main image passes the depth test, while keeping the color buffer intact.
			this.renderer.autoClear = false;
			this.renderer.clearDepth();
			this.renderer.render(this.mainScene, this.camera.el);
			this.renderer.autoClear = true;
		} else {
			this.renderer.render(this.scene, this.camera.el);
			this.renderer.autoClear = false;
			this.renderer.clearDepth();
			this.renderer.render(this.mainScene, this.camera.el);
			this.renderer.autoClear = true;
		}
	}

	onResize() {
		if (window.isMobile) {
			this.mouse = { x: 0, y: -0.75 };
		}

		// Update sizes
		super.onResize();

		// Update camera
		this.camera.resizeCamera(this.sizes);

		// Update renderer
		this.renderer.setSize(this.sizes.width, this.sizes.height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		// Resize composer render targets to match new viewport — prevents blur on grow
		if (this.composer) {
			this.composer.setSize(this.sizes.width, this.sizes.height);
		}

		// Update elements
		if (this.gallery) {
			this.gallery.sizes = this.sizes;
			if (this.gallery.onResize) this.gallery.onResize();
		}
	}

	addEventListeners() {
		window.addEventListener('pointermove', (e) => {
			if (window.isMobile) return;
			this.mouse.x = (e.clientX / this.sizes.width) * 2 - 1;
			this.mouse.y = -(e.clientY / this.sizes.height) * 2 + 1;
		});

		// if (!window.isMobile)
		// 	window.addEventListener('pointermove', (e) => {
		// 		this.mouse.x = (e.clientX / this.sizes.width) * 2 - 1;
		// 		this.mouse.y = -(e.clientY / this.sizes.height) * 2 + 1;
		// 	});

		// if (!window.isMobile)
		// 	window.addEventListener('pointerup', (e) => {
		// 		console.log(e);
		// 		// e = e.changedTouches ? e.changedTouches[0] : e;
		// 		if (
		// 			e.target &&
		// 			e.target.classList.contains('webgl') &&
		// 			this.raycaster.currentIntersect
		// 		) {
		// 			// UI updates

		// 			const intersectItem = this.gallery.items.find((item) => {
		// 				// console.log(item);
		// 				return (
		// 					item.mesh.uuid === this.raycaster.currentIntersect.object.uuid
		// 				);
		// 			});

		// 			this.gallery.setActive(intersectItem, this.camera.el);
		// 			return;
		// 			// older code

		// 			console.log('click');
		// 			if (this.gallery.active && !this.gallery.isAnimating) {
		// 				this.raycaster.isFullscreen = false;
		// 				return this.gallery.setInactive(this.element);
		// 			}

		// 			if (this.raycaster.currentIntersect && !this.gallery.isAnimating) {
		// 				// UI updates
		// 				this.raycaster.isFullscreen = true;
		// 				this.element.classList.add('dg', 'ac');

		// 				const intersectItem = this.gallery.items.find((item) => {
		// 					console.log(item);
		// 					return (
		// 						item.mesh.uuid === this.raycaster.currentIntersect.object.uuid
		// 					);
		// 				});

		// 				this.gallery.setActive(intersectItem, this.camera.el);
		// 			}
		// 		}
		// 	});

	}

	onWheel({ pixelX, pixelY }) {
		// Trackpad horizontal swipe (pixelX) takes priority when it's the dominant axis;
		// mouse wheel or trackpad vertical swipe falls back to pixelY.
		const delta = Math.abs(pixelX) > Math.abs(pixelY) ? pixelX : pixelY;
		this.direction = delta > 0 ? 1 : -1;
		this.velocity += delta * 0.1;

		this.gallery.onWheel(this.direction, delta);
	}

	onTouchDown(e) {
		this.isTouch = true;

		this.x.start = e.touches ? e.touches[0].clientX : e.clientX;
		this.clickStart.x = e.touches ? e.touches[0].clientX : e.clientX;
		this.clickStart.y = e.touches ? e.touches[0].clientY : e.clientY;

		const values = {
			x: this.x,
		};

		this.gallery.onTouchDown(values);
		// this.speed.target = this.speed.current - yDistance;
	}

	onTouchMove(e) {
		if (!this.isTouch) return;

		const x = e.touches ? e.touches[0].clientX : e.clientX;
		this.x.end = x;

		const values = {
			x: this.x,
		};

		this.gallery.onTouchMove(values);

		this.velocity += x - this.x.start;
		this.x.start = x;
		// this.speed.target = this.speed.current - yDistance;

		// this.gallery.speed.target = this.gallery.speed.current - yDistance;
	}

	onTouchUp(e) {
		this.isTouch = false;

		const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
		const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

		const dx = x - this.clickStart.x;
		const dy = y - this.clickStart.y;
		if (Math.sqrt(dx * dx + dy * dy) < 8) this.onPointerClick(x, y);

		this.x.end = x;

		const values = {
			x: this.x,
		};

		this.gallery.onTouchUp(values);
	}

	onPointerClick(clientX, clientY) {
		if (!this.gallery || !this.gallery.items.length) return;

		const ndcX = (clientX / this.sizes.width) * 2 - 1;
		const ndcY = -(clientY / this.sizes.height) * 2 + 1;

		const clickRay = new THREE.Raycaster();
		clickRay.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera.el);

		const thumbnailMeshes = this.gallery.items.map((i) => i.mesh);
		const intersects = clickRay.intersectObjects(thumbnailMeshes);

		if (intersects.length > 0) {
			const hitItem = this.gallery.items.find(
				(i) => i.mesh === intersects[0].object
			);
			if (hitItem) this.gallery.scrollToItem(hitItem);
		}
	}

	onKeyDown(e) {
		this.gallery.onKeyDown(e);
	}

	onKeyUp(e) {
		this.gallery.onKeyUp(e);
	}

	show() {
		// if (this.gallery) this.gallery.show();
		GSAP.fromTo(
			this.element,
			{ opacity: 0 },
			{ opacity: 1, delay: 1.3, duration: 1, ease: 'power4.out' }
		);
		console.log(this.gallery);
	}

	destroy() {
		// Dispose mainScene meshes (super.destroy only traverses this.scene)
		this.mainScene.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				for (const key in child.material) {
					const value = child.material[key];
					if (value && typeof value.dispose === 'function') value.dispose();
				}
			}
		});

		super.destroy();
		GSAP.fromTo(
			this.element,
			{ opacity: 1 },
			{ opacity: 0, delay: 1.3, duration: 1, ease: 'power4.out' }
		);

		if (this.gallery) {
			this.gallery.destroy();
			this.gallery = null;
		}
	}
}
