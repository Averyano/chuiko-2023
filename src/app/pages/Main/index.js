import GSAP from 'gsap';

import ImageHoverEffect from '../../components/@avery-image-hover-effect';
import WelcomeSection from './WelcomeSection';
import ExpertiseSection from './ExpertiseSection';
import AwardSection from './AwardSection';
import ContactSection from './ContactSection';

import Page from '../../classes/Page';

import each from 'lodash/each';

export default class MainPage extends Page {
	constructor(el) {
		super({
			element: el,
			elements: {},
		});
		this.id = 'main';
		this.isCreated = false;
	}

	create() {
		if (this.template != this.id) return;

		if (!this.isReady) super.createComponent();

		if (!this.isCreated) {
			this.components = {
				welcome: new WelcomeSection(),
				expertise: new ExpertiseSection(),
				awards: new ImageHoverEffect({
					element: '.awards',
					elements: {
						figure: '.awards__figure',
						content: [
							{
								image: '#product2020',
								button: '[data-select=product2020]',
							},
							{
								image: '#masters2020',
								button: '[data-select=masters2020]',
							},
							{
								image: '#bachelor2019',
								button: '[data-select=bachelor2019]',
							},
							{
								image: '#bachelor2018',
								button: '[data-select=bachelor2018]',
							},
							{
								image: '#junior2018',
								button: '[data-select=junior2018]',
							},
							{
								image: '#junior2017',
								button: '[data-select=junior2017]',
							},
							{
								image: '#sbid2021',
								button: '[data-select=sbid2021]',
							},
							{
								image: '#sbid2019',
								button: '[data-select=sbid2019]',
							},
						],
					},
					activeClass: 'awards__image--active',
				}),
				awardSection: new AwardSection(),
				contact: new ContactSection(),
				// cover: new CoverSection(),
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

	addEventListeners() {
		each(this.components, (component) => {
			component.addEventListeners();
		});
	}

	removeEventListeners() {
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

	onResize() {
		console.log('res');
		each(this.components, (component) => {
			if (component && component.onResize) component.onResize();
		});
	}

	update() {
		if (
			this.components &&
			this.components.awards &&
			this.components.awards.isReady
		)
			this.components.awards.update();
	}
}
