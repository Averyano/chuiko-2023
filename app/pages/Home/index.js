import GSAP from 'gsap';
import CoverSection from './CoverSection';
// import Gallery from '../../components/Gallery';

import Page from '../../classes/Page';

import each from 'lodash/each';

export default class HomePage extends Page {
	constructor(el, isWebpSupported) {
		super({
			element: el,
			elements: {},
		});

		this.isWebpSupported = isWebpSupported;
		console.log(`this.isWebpSupported ${this.isWebpSupported}`);
		this.id = 'home';
		this.isCreated = false;
	}

	create() {
		if (this.template != this.id) return;

		if (!this.isReady) super.createComponent();

		if (!this.isCreated) {
			this.components = {
				cover: new CoverSection(),
				// gallery: new Gallery(this.isWebpSupported),
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
		// const eventObject = e;
		// eventObject.target.href = '/main';
		// if (e.key === 'Enter') {
		// 	this.callback(eventObject);
		// }
	}

	addEventListeners() {
		console.log('Add');
		// window.addEventListener('keyup', this.enterTheMainPage.bind(this));

		each(this.components, (component) => {
			component.addEventListeners();
		});
	}

	removeEventListeners() {
		// window.removeEventListener('keyup', this.enterTheMainPage.bind(this));

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
		if (scrolltriggerElements) {
			each(scrolltriggerElements, (pinSpacer) => {
				const parent = pinSpacer.parentElement;

				while (pinSpacer.firstChild) {
					parent.appendChild(pinSpacer.firstChild);
				}

				parent.removeChild(pinSpacer);
			});
		}
	}

	onResize() {
		each(this.components, (component) => {
			if (component.onResize) component.onResize();
		});
	}

	update() {
		if (
			this.components &&
			this.components.gallery &&
			this.components.gallery.items.length > 0
		)
			this.components.gallery.update();
	}
}
