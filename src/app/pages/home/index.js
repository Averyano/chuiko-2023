import GSAP from 'gsap';

import ImageHoverEffect from '../../components/@avery-image-hover-effect';
import AboutSection from './AboutSection';
import CoverSection from './CoverSection';

import Page from '../../classes/Page';

import each from 'lodash/each';
import SelectionTextSection from './SelectionTextSection';
export default class HomePage extends Page {
	constructor(el, callback) {
		super({
			element: el,
			elements: {},
		});

		this.callback = callback;
		this.id = 'home';
		this.isCreated = false;
	}

	create() {
		if (this.template != this.id) return;

		if (!this.isReady) super.createComponent();

		if (!this.isCreated) {
			this.components = {
				cover: new CoverSection(),
				// selection: new ImageHoverEffect({
				// 	element: '.selection',
				// 	elements: {
				// 		figure: '.selection__figure',
				// 		content: [
				// 			{
				// 				image: '#selection-designs',
				// 				button: '.selection__button--design',
				// 			},
				// 			{
				// 				image: '#selection-websites',
				// 				button: '.selection__button--website',
				// 			},
				// 		],
				// 	},
				// 	activeClass: 'selection__image--active',
				// }),
				// about: new AboutSection(),
				// selectionText: new SelectionTextSection(),
			};
			this.isCreated = true;
		}
		// Create components
		each(this.components, (component) => {
			console.log(component);
			component.create();
			// component.addEventListeners();
		});

		this.addEventListeners();

		console.log(`🔼 ${this.id} is created`);
	}

	show() {
		if (this.template != this.id) return;

		this.components.cover.button.revealButton();
	}

	hide() {
		return new Promise((resolve) => {
			this.destroy();

			GSAP.to(this.element, {
				autoAlpha: 0,
				onComplete: resolve,
			});
		});
	}

	enterTheMainPage(e) {
		// e.preventDefault();
		const eventObject = e;
		eventObject.target.href = '/main';
		if (e.key === 'Enter') {
			this.callback(eventObject);
		}
	}

	addEventListeners() {
		console.log('Add');
		window.addEventListener('keyup', this.enterTheMainPage.bind(this));

		each(this.components, (component) => {
			component.addEventListeners();
		});
	}

	removeEventListeners() {
		window.removeEventListener('keyup', this.enterTheMainPage.bind(this));

		each(this.components, (component) => {
			component.removeEventListeners();
		});
	}

	destroy() {
		super.destroy();
		this.removeEventListeners();

		each(this.components, (component) => {
			component.destroy();
		});

		// Removes scroll trigger instances
		const scrolltriggerElements = document.querySelectorAll('.pin-spacer');
		each(scrolltriggerElements, (pinSpacer) => {
			const parent = pinSpacer.parentElement;

			while (pinSpacer.firstChild) {
				parent.appendChild(pinSpacer.firstChild);
			}

			parent.removeChild(pinSpacer);
		});
	}

	update() {
		if (
			this.components &&
			this.components.selection &&
			this.components.selection.isReady
		)
			this.components.selection.update();
	}
}
