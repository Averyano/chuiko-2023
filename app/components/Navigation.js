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
			duration: 0.7,
			ease: 'power4.out',
			paused: true,
		});

		this.tl.fromTo(
			this.elements.navItems,
			{ y: -50, autoAlpha: 0 },
			{ y: 0, autoAlpha: 1, stagger: 0.1 },
			0.2
		);

		let duration = this.mobilemediaQuery.matches ? 0.5 : 1;

		this.tl.fromTo(
			this.element,
			{
				yPercent: -100,
			},
			{ yPercent: 0, duration: duration, ease: 'power4.out' },
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

	addEventListeners() {}
}
