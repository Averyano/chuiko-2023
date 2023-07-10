import GlobalHandler from './classes/GlobalHandler';
import NodeEmitter from './classes/NodeEmitter';

import Navigation from './components/Navigation';
import Loader from './components/@avery-loader/Loader';

import HomePage from './pages/Home';

import { debounce } from './utils/utils';
import { checkWebpSupport } from './utils/utils';

import NotFound from './pages/NotFound';
import normalizeWheel from 'normalize-wheel';

class App {
	constructor() {
		this.isCreated = false;

		this.create();
	}

	async create() {
		window.scrollTo(0, 0);
		// this.isWebpSupported = await checkWebpSupport();
		this.isWebpSupported = false;
		console.log(`this.isWebpSupported ${this.isWebpSupported}`);

		this.createContent();
		this.createPreloader();
		this.createNavigation();
		this.registerNodeEvents();

		this.addEventListeners();
		this.update();
	}

	createPreloader() {
		this.loader = new Loader({
			pages: this.pages,
			isWebpSupported: this.isWebpSupported,
			onLeave: () => {
				// if (this.experience) {
				// 	this.experience.destroy();
				// 	this.experience = null;
				// }

				this.navigation.closeAll();
				GlobalHandler.handleDestroy(); // Runs destroy() on each component
			},

			onEnter: () => {
				GlobalHandler.setTemplate = this.loader.template;
			},

			afterEnter: () => {
				GlobalHandler.handlePageTemplate(); // sets this.template on all pages

				GlobalHandler.handleCreate(); // Run create() on each page
				GlobalHandler.handleResize(); // Runs onResize() on each component
			},
		});
		this.loader.on('scrollTo', (e) => {
			if (this.scroll) this.scroll.scrollTo(e);
		});

		GlobalHandler.handlePageTemplate();

		GlobalHandler.handleCreate();
		GlobalHandler.handleResize(); // Runs onResize() on each component

		if (this.loader.template === 'home') {
			// this.experience = new Experience('.webgl');
			this.loader.preloader.createLoader('home');
		}

		if (this.loader.template === '404') {
			this.loader.preloader.createLoader('notfound');
		}

		this.loader.preloader.on('completed', this.onPreloaded.bind(this));
	}

	createNavigation() {
		this.navigation = new Navigation();
		// this.navigation.show();
	}

	createContent() {
		// Pages
		this.mainDiv = document.querySelector('.main-div');
		console.log(`isWebpSupported ${this.isWebpSupported}`);
		this.home = new HomePage('.cover', this.isWebpSupported);
		this.notfound = new NotFound('.notfound');

		this.pages = [
			{ page: this.home, url: ['/', '/home', '/gallery'] },
			{ page: this.notfound, url: '/404' },
		];

		this.pageLength = this.mainDiv.getBoundingClientRect().height;
		this.isCreated = true;
	}

	registerNodeEvents() {
		NodeEmitter.on('openMenu', () => {
			this.navigation.openMenu();
		});

		NodeEmitter.on('closeMenu', () => {
			this.navigation.closeMenu();
		});
	}

	onPreloaded() {
		console.log('%c Preloaded');

		if (this.loader.template === 'home') {
			this.home.components.gallery.create(
				this.loader.preloader.elements.thumbItems
			);

			this.loader.preloader.hide();
			this.show();
		} else {
			this.loader.preloader.hide();
			this.show();
		}
	}

	show() {
		if (this.loader.template === 'home') {
			document.body.classList.add('refresh');
			this.home.show();
		}

		// if (this.experience) this.experience.show();
	}

	update(time) {
		if (this.scroll) {
			this.scroll.raf(time);
		}

		if (this.experience && this.experience.isReady) this.experience.update();
		if (this.home && this.home.update) this.home.update();

		this.frame = window.requestAnimationFrame(this.update.bind(this));
	}

	addEventListeners() {
		window.addEventListener('resize', debounce(this.onResize.bind(this))); // runs on the next frame

		window.addEventListener('wheel', this.onWheel.bind(this));

		window.addEventListener('mousedown', this.onTouchDown.bind(this));
		window.addEventListener('mousemove', this.onTouchMove.bind(this));
		window.addEventListener('mouseup', this.onTouchUp.bind(this));

		window.addEventListener('touchstart', this.onTouchDown.bind(this));
		window.addEventListener('touchmove', this.onTouchMove.bind(this));
		window.addEventListener('touchend', this.onTouchUp.bind(this));
	}

	onTouchDown(event) {
		if (
			this.home.components.gallery &&
			this.home.components.gallery.onTouchDown
		) {
			this.home.components.gallery.onTouchDown(event);
		}
	}

	onTouchMove(event) {
		if (
			this.home.components.gallery &&
			this.home.components.gallery.onTouchMove
		) {
			this.home.components.gallery.onTouchMove(event);
		}
	}

	onTouchUp(event) {
		if (
			this.home.components.gallery &&
			this.home.components.gallery.onTouchUp
		) {
			this.home.components.gallery.onTouchUp(event);
		}
	}

	onWheel(event) {
		const normalizedWheel = normalizeWheel(event);

		if (this.home.components.gallery && this.home.components.gallery.onWheel) {
			this.home.components.gallery.onWheel(normalizedWheel);
		}
	}

	onResize() {
		window.isMobile = window.innerWidth < 768;

		GlobalHandler.handleResize();
	}
}

new App();
