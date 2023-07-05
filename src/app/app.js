import GlobalHandler from './classes/GlobalHandler';
import NodeEmitter from './classes/NodeEmitter';

import Experience from './components/Canvas/Experience';
import Navigation from './components/Navigation';
import Loader from './components/@avery-loader/Loader';

import HomePage from './pages/Home';
import MainPage from './pages/Main';

import Lenis from '@studio-freight/lenis';

import { debounce } from './utils/utils';

import ScrollTrigger from 'gsap/all';

import NotFound from './pages/NotFound';
import Footer from './components/Footer';
import normalizeWheel from 'normalize-wheel';

class App {
	constructor() {
		this.isCreated = false;

		this.create();
		this.createContent();
		this.createPreloader();
		this.createNavigation();
		this.registerNodeEvents();
	}

	create() {
		window.scrollTo(0, 0);
		// Scroll
		// this.scroll = new Lenis({
		// 	// infinite: true,
		// });

		// this.scroll.scrollTo('top');

		// Canvas

		// Other
		this.addEventListeners();
		this.update();
	}

	createPreloader() {
		this.loader = new Loader({
			pages: this.pages,
			onLeave: () => {
				if (this.scroll) this.scroll.destroy();

				if (this.experience) {
					this.experience.destroy();
					this.experience = null;
				}

				this.navigation.closeAll();
				GlobalHandler.handleDestroy(); // Runs destroy() on each component
			},

			onEnter: () => {
				GlobalHandler.setTemplate = this.loader.template;
			},

			afterEnter: () => {
				console.log(`Enterred ${this.loader.template}`);
				GlobalHandler.handlePageTemplate(); // sets this.template on all pages

				GlobalHandler.handleCreate(); // Run create() on each page
				GlobalHandler.handleResize(); // Runs onResize() on each component

				if (this.loader.template === 'home') {
					this.experience = new Experience('.webgl');
				} else {
					this.scroll = new Lenis();
				}

				// this.loader.preloader.createLoader(this.loader.template);

				// this.scroll = new Lenis();
				// this.scroll.on('scroll', this.updateMousePos.bind(this));

				// this.scroll.scrollTo('top');

				// this.footer.createTimeline();
			},
		});
		this.loader.on('scrollTo', (e) => {
			if (this.scroll) this.scroll.scrollTo(e);
		});

		GlobalHandler.handlePageTemplate();

		GlobalHandler.handleCreate();
		GlobalHandler.handleResize(); // Runs onResize() on each component

		if (this.loader.template === 'home') {
			this.experience = new Experience('.webgl');
			this.loader.preloader.createLoader('home');
		}

		if (this.loader.template === 'main') {
			this.scroll = new Lenis();
			this.loader.preloader.createLoader('main');
		}

		if (this.loader.template === '404') {
			this.loader.preloader.createLoader('notfound');
		}

		this.loader.preloader.on('completed', this.onPreloaded.bind(this));
	}

	createNavigation() {
		this.navigation = new Navigation();
		this.navigation.show();
	}

	createContent() {
		// Pages
		this.mainDiv = document.querySelector('.main-div');

		this.home = new HomePage('.cover', (e) => this.loader.clickLink(e));
		this.main = new MainPage('.main');
		this.notfound = new NotFound('.notfound');

		this.pages = [
			{ page: this.home, url: ['/', '/home'] },
			{ page: this.main, url: '/main' },
			{ page: this.notfound, url: '/404' },
		];

		this.pageLength = this.mainDiv.getBoundingClientRect().height;
		this.isCreated = true;

		this.footer = new Footer();
	}

	registerNodeEvents() {
		NodeEmitter.on('openMenu', () => {
			this.navigation.openMenu();
		});

		NodeEmitter.on('closeMenu', () => {
			this.navigation.closeMenu();
		});

		NodeEmitter.on('showMenu', () => {
			this.navigation.show();
		});
		NodeEmitter.on('hideMenu', () => this.navigation.hide());

		// NodeEmitter.on('stopScroll', () => this.scroll.stop());
		// NodeEmitter.on('startScroll', () => this.scroll.start());
	}

	onPreloaded() {
		console.log('%c Preloaded');
		if (this.loader.template === 'home') {
			document.body.classList.add('refresh');

			this.navigation.element.classList.add('nav--cover');

			this.experience.updateImages(() => {
				// After images are updated, and webGL scene is ready, animate the line to 1, and show content
				// this.loader.preloader.animateLine(1);
				this.loader.preloader.hide();
				this.navigation.updateNav(this.loader.template);
				this.show();
			});
		} else {
			document.body.classList.remove('refresh');

			this.navigation.element.classList.remove('nav--cover');

			// this.loader.preloader.animateLine(1);
			this.loader.preloader.hide();

			this.navigation.updateNav(this.loader.template);

			this.show();
		}

		// if (this.experience && this.experience.gallery) {
		// 	this.experience.show();
		// }

		// this.scroll.on('scroll', (e) => {
		// 	console.log(e);
		// 	console.log(window.scrollY);
		// 	if (this.experience) {
		// 		this.experience.onWheel(e);
		// 	}
		// });

		//
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
		if (this.main && this.main.update) this.main.update();

		this.frame = window.requestAnimationFrame(this.update.bind(this));
	}

	addEventListeners() {
		console.log('add', this);
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
		if (this.experience && this.experience.onTouchDown) {
			this.experience.onTouchDown(event);
		}
	}

	onTouchMove(event) {
		if (this.experience && this.experience.onTouchMove) {
			this.experience.onTouchMove(event);
		}
	}

	onTouchUp(event) {
		if (this.experience && this.experience.onTouchUp) {
			this.experience.onTouchUp(event);
		}
	}

	onWheel(event) {
		const normalizedWheel = normalizeWheel(event);

		if (this.experience && this.experience.onWheel) {
			this.experience.onWheel(normalizedWheel);
		}
	}

	onResize() {
		window.isMobile = window.innerWidth < 768;

		GlobalHandler.handleResize();

		if (this.main && this.main.isReady) this.main.onResize();
	}
}

new App();
