import * as THREE from 'three';
THREE.Cache.enabled = true;

import GSAP from 'gsap';

import Canvas from '../../classes/Canvas';
import Gallery from './Gallery';
import Camera from './Camera';
import Lights from './Lights';
import Raycaster from './Raycaster';

export default class Experience extends Canvas {
	constructor(el) {
		super(el);

		this.intersectId = {
			current: null,
			previous: null,
		};
		this.dbg4 = document.querySelector('.dbg4');

		this.x = {
			start: 0,
			distance: 0,
			end: 0,
		};

		this.isReady = false;

		this.camera = new Camera({ sizes: this.sizes });
		this.scene.add(this.camera.el);

		// Separate scene for the main preview image — rendered after the main scene
		// so it always appears on top without being affected by any post-processing.
		this.mainScene = new THREE.Scene();

		this.gallery = new Gallery({
			scene: this.scene,
			mainScene: this.mainScene,
			sizes: this.sizes,
		});

		this.isTouch = false;
		this.direction = 1;

		this.lights = new Lights({ scene: this.scene });

		this.mouse = new THREE.Vector2();
		this.hoverRaycaster = new THREE.Raycaster();
		this.clickStart = { x: 0, y: 0 };

		this.createRaycaster();
		this.addEventListeners();
		this.onResize();

		this.isReady = true;

		window.experience = this;
	}

	createRaycaster() {
		this.raycaster = new Raycaster({
			meshes: this.gallery.meshes,
		});
	}

	// Called from app.js at onPreloaded()
	updateImages(cb) {
		if (this.gallery.items.length === 0) {
			this.gallery.createItems(this.gallery.imageBounds).then(() => {
				cb();
				this.isReady = true;
			});
		} else {
			this.gallery.updateItems(this.gallery.imageBounds);
		}
	}

	update() {
		this.raycaster.el.setFromCamera({ x: 0, y: -0.95 }, this.camera.el);
		if (window.isMobile)
			this.raycaster.el.setFromCamera({ x: 0, y: -0.75 }, this.camera.el);

		this.raycaster.update();

		if (this.raycaster.currentIntersect) {
			this.dbg4.innerHTML = this.raycaster.currentIntersect.object.uuid;
			this.intersectId.current = this.raycaster.currentIntersect.object.uuid;

			if (this.intersectId.current !== this.intersectId.previous) {
				this.intersectId.previous = this.intersectId.current;
				// While a programmatic scroll is animating, the old item is still
				// momentarily under the raycaster — skip setActive so it doesn't
				// flash the previous image over the one scrollToItem already set.
				if (!this.gallery.isScrollingToItem) {
					this.gallery.setActive(null, this.intersectId.current);
				}
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

		this.gallery.update();

		this.renderer.render(this.scene, this.camera.el);
		this.renderer.autoClear = false;
		this.renderer.clearDepth();
		this.renderer.render(this.mainScene, this.camera.el);
		this.renderer.autoClear = true;
	}

	onResize() {
		if (window.isMobile) {
			this.mouse = { x: 0, y: -0.75 };
		}

		super.onResize();

		this.camera.resizeCamera(this.sizes);

		this.renderer.setSize(this.sizes.width, this.sizes.height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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
	}

	onWheel({ pixelX, pixelY }) {
		const delta = Math.abs(pixelX) > Math.abs(pixelY) ? pixelX : pixelY;
		this.direction = delta > 0 ? 1 : -1;
		this.gallery.onWheel(this.direction, delta);
	}

	onTouchDown(e) {
		this.isTouch = true;

		this.x.start = e.touches ? e.touches[0].clientX : e.clientX;
		this.clickStart.x = e.touches ? e.touches[0].clientX : e.clientX;
		this.clickStart.y = e.touches ? e.touches[0].clientY : e.clientY;

		this.gallery.onTouchDown({ x: this.x });
	}

	onTouchMove(e) {
		if (!this.isTouch) return;

		const x = e.touches ? e.touches[0].clientX : e.clientX;
		this.x.end = x;

		this.gallery.onTouchMove({ x: this.x });

		this.x.start = x;
	}

	onTouchUp(e) {
		this.isTouch = false;

		const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
		const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

		const dx = x - this.clickStart.x;
		const dy = y - this.clickStart.y;
		if (Math.sqrt(dx * dx + dy * dy) < 8) this.onPointerClick(x, y);

		this.x.end = x;
		this.gallery.onTouchUp({ x: this.x });
	}

	onPointerClick(clientX, clientY) {
		if (!this.gallery || !this.gallery.items.length) return;

		const ndcX = (clientX / this.sizes.width) * 2 - 1;
		const ndcY = -(clientY / this.sizes.height) * 2 + 1;

		const clickRay = new THREE.Raycaster();
		clickRay.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera.el);

		const intersects = clickRay.intersectObjects(this.gallery.items.map((i) => i.mesh));

		if (intersects.length > 0) {
			const hitItem = this.gallery.items.find((i) => i.mesh === intersects[0].object);
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
		GSAP.fromTo(
			this.element,
			{ opacity: 0 },
			{ opacity: 1, delay: 1.3, duration: 1, ease: 'power4.out' }
		);
	}

	destroy() {
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
