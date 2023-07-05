import Component from '../classes/Component';
import GSAP from 'gsap';
import Hamburger from './Hamburger';
import each from 'lodash/each';
import NodeEmitter from '../classes/NodeEmitter';

export default class Navigation extends Component {
	constructor() {
		super({
			element: 'nav',
			elements: {
				content: '.nav__content',
				contentLinks: '.nav__content__link--inner',
				menuItem: '.nav__menu',
				emailItem: '.nav__email__item',
				emailLink: '.nav__email__link',
				menuLogoPath: '.nav__logo__svg--main path',
				logoItem: '.nav__logo',
				logoOverlay: '.nav__logo--overlay path',
			},
		});
		this.isOpen = false;
		this.template = null;

		this.createTimeline();
		this.createHamburgerIcon();

		this.addEventListeners();
		NodeEmitter.on('navChangeIndex', (index) => this.navChangeIndex(index));
	}

	/**
	 * HAMBURGER RELATED
	 */

	navChangeIndex(index) {
		each(this.elements.contentLinks, (link) => link.classList.remove('active'));
		this.elements.contentLinks[index].classList.add('active');
	}

	createHamburgerIcon() {
		this.hamburger = new Hamburger();
		this.hamburger.create();
	}

	openMenu() {
		this.isOpen = true;

		this.elements.emailLink.classList.add('dark');
		this.elements.emailItem.classList.add('open');

		this.elements.menuItem.classList.add('open');

		GSAP.to(this.elements.emailItem, {
			color: '#ffffff',
		});

		GSAP.to(this.elements.menuLogoPath, {
			fill: '#ffffff',
		});

		GSAP.to(this.elements.content, {
			autoAlpha: 1,
			onComplete: () => (this.hamburger.isAnimating = false),
		});

		GSAP.from(this.elements.contentLinks, {
			x: -1000,
			stagger: 0.1,
			duration: 1,
			ease: 'power4.out',
		});
	}

	closeMenu() {
		this.isOpen = false;

		this.elements.emailLink.classList.remove('dark');
		this.elements.emailItem.classList.remove('open');

		this.elements.menuItem.classList.remove('open');

		GSAP.to(this.elements.emailItem, {
			color: '#010101',
		});

		GSAP.to(this.elements.menuLogoPath, {
			fill: 'rgb(17,17,17)',
			onComplete: () => (this.hamburger.isAnimating = false),
		});

		GSAP.to(this.elements.content, {
			autoAlpha: 0,
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
		this.enterTl = GSAP.timeline();

		this.enterTl.fromTo(
			this.elements.logoOverlay,
			{
				opacity: 0,
			},
			{
				opacity: 1,
				duration: 0.2,
				stagger: 0.1,
				ease: 'out.expo',
			},
			0
		);

		this.leaveTl = GSAP.timeline();

		this.leaveTl.fromTo(
			this.elements.logoOverlay,
			{
				opacity: 1,
			},
			{
				opacity: 0,
				duration: 0.2,
				stagger: 0.1,
				ease: 'out.expo',
			},
			0
		);

		this.enterTl.pause();
		this.leaveTl.restart();

		this.tl = GSAP.timeline({
			duration: 0.7,
			ease: 'power4.out',
			paused: true,
		});

		this.tl.fromTo(
			this.element,
			{
				yPercent: -100,
			},
			{ yPercent: 0, duration: 1, ease: 'power4.out' }
		);
	}

	updateNav(template) {
		this.template = template;

		// Clear Classes

		// Set Active Class based on page
		if (this.template === 'home') {
			each(this.elements.contentLinks, (link) => {
				link.classList.remove('active');
			});
			this.elements.contentLinks[0].classList.add('active');
		}

		// if (this.template === 'main') {
		// 	this.elements.contentLinks[1].classList.add('active');
		// }
		// if (this.template === 'websites') {
		// 	this.elements.contentLinks[2].classList.add('active');
		// }
	}

	show() {
		this.tl.play();
	}

	hide() {
		this.tl.reverse();
	}

	addEventListeners() {
		this.elements.logoItem.addEventListener('mouseenter', () => {
			this.leaveTl.pause();
			this.enterTl.restart();

			// to avoid the logo being white when the menu is open
			if (this.isOpen) {
				GSAP.to(this.elements.menuLogoPath, {
					fill: 'rgb(17,17,17)',
				});
			}
		});

		this.elements.logoItem.addEventListener('mouseleave', () => {
			this.enterTl.pause();
			this.leaveTl.restart();

			// to avoid the logo being white when the menu is open
			if (this.isOpen) {
				GSAP.to(this.elements.menuLogoPath, {
					fill: '#ffffff',
				});
			}
		});

		each(this.elements.contentLinks, (link, index) => {
			link.addEventListener('click', (e) => {
				this.navChangeIndex(index);
			});
		});
	}
}
