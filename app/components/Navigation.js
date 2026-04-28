import Component from '../classes/Component';
import GSAP from 'gsap';
import Hamburger from './Hamburger';
import each from 'lodash/each';
import NodeEmitter from '../classes/NodeEmitter';

export default class Navigation extends Component {
	constructor() {
		super({
			element: '.nav__content',
			elements: {
				content: '.menu__content',
				navItems: '.nav__item',
				menuContainer: '.nav__menu__container',
				portrait: '.nav__portrait__figure',
			},
		});

		this.mobilemediaQuery = window.matchMedia('(max-width: 1024px)');

		this.isOpen = false;
		this.template = null;

		this.createTimeline();
		this.createHamburgerIcon();

		this.addEventListeners();
	}

	/**
	 * HAMBURGER RELATED
	 */

	createHamburgerIcon() {
		this.hamburger = new Hamburger();
		this.hamburger.create();
	}

	openMenu() {
		this.isOpen = true;

		this.show();

		GSAP.to(this.element.content, {
			autoAlpha: 1,
			onComplete: () => (this.hamburger.isAnimating = false),
		});
	}

	closeMenu() {
		this.isOpen = false;

		this.hide();

		GSAP.to(this.element.content, {
			autoAlpha: 0,
			onComplete: () => (this.hamburger.isAnimating = false),
		});
	}

	closeAll() {
		this.closeMenu();

		if (this.hamburger.isOpen) this.hamburger.toggleState();
	}
	/**
	 * MENU ELEMENTS RELATED
	 */
	// @TODO

	/**
	 * NAV RELATED
	 */
	createTimeline() {
		this.tl = GSAP.timeline({
			duration: 1.2,
			ease: 'power4.out',
			paused: true,
		});

		this.tl.fromTo(
			this.elements.navItems,
			{ y: -50, autoAlpha: 0 },
			{ y: 0, autoAlpha: 1, stagger: 0.1, ease: 'power4.out' },
			0.2
		);

		this.tl.fromTo(
			this.elements.portrait,
			{ clipPath: 'inset(0 0 0 100%)' },
			{ clipPath: 'inset(0 0 0 0%)', duration: 1.0, ease: 'power4.out' },
			0.1
		);

		let duration = this.mobilemediaQuery.matches ? 0.68 : 1.2;

		this.tl.fromTo(
			this.element,
			{
				autoAlpha: 0,
			},
			{ autoAlpha: 0.96, duration: duration, ease: 'expo.out' },
			0
		);
	}

	updateNav(template) {
		this.template = template;
	}

	show() {
		this.tl.play();
	}

	hide() {
		this.tl.reverse();
	}

	addEventListeners() {
		window.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && this.isOpen) {
				NodeEmitter.emit('closeMenu');
				this.hamburger.toggleState();
			}
		});
	}
}
