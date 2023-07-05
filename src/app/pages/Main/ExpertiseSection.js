import Component from '../../classes/Component';
import NodeEmitter from '../../classes/NodeEmitter';
import Reveal from '../../animations/Reveal';
import each from 'lodash/each';

import { insertAfter } from '../../utils/utils';
import GSAP from 'gsap';

export default class ExpertiseSection extends Component {
	constructor() {
		super({
			element: '.expertise',
			elements: {
				expertiseText: {
					top: '.expertise__left__top__paragraph',
					whom: '.expertise__task--whom p',
					duration: '.expertise__task--duration p',
				},
				expertiseWrapper: '.expertise__wrapper',

				listItems: '.expertise__right__list__item',

				items: {
					left: '.expertise__items__left .expertise__item__figure',
					right: '.expertise__items__right .expertise__item__figure',
				},

				images: '.expertise__item__image',
			},
		});

		this.initTexts();

		this.option = {
			current: 1,
		};
		this.option.previous = 1;

		this.currentIndex = 0;

		this.isFullscreen = false;
		window.isFullscreen = this.isFullscreen;
	}

	create() {
		super.createComponent();
		// this.createTimeline();
		this.addRevealAnimation();
		this.addEventListeners();
		this.setActiveItem(1);
	}

	createTimeline() {
		this.timeline = GSAP.timeline({
			scrollTrigger: {
				trigger: '.expertise__top',
				scrub: 1,
				// pin: true,
				start: 'top-=20% top',
				// end: '+=50%',
				markers: true,
			},
		});
	}

	addRevealAnimation() {
		// Same for all 3 reveal elements
		const scrollTriggerProp = {
			trigger: this.elements.expertiseWrapper,
			start: 'top+=20% bottom',
			end: 'bottom-=20% top',
			toggleActions: 'restart none none reverse',
		};

		new Reveal({
			color: 'rgb(255, 252, 247)',
			ease: 'out.expo',
			element: this.elements.expertiseText.whom.parentElement,
			delay: 0,
			dir: 'Y',
			duration: 1,
			size: '100%',
			ScrollTriggerProp: scrollTriggerProp,
		});
		new Reveal({
			color: 'rgb(255, 252, 247)',
			ease: 'out.expo',
			element: this.elements.expertiseText.duration.parentElement,
			delay: 0.2,
			dir: 'Y',
			duration: 1,
			size: '100%',
			ScrollTriggerProp: scrollTriggerProp,
		});
		new Reveal({
			color: 'rgb(255, 252, 247)',
			ease: 'out.expo',
			element: this.elements.expertiseText.top.parentElement,
			delay: 0.5,
			dir: 'Y',
			duration: 1,
			size: '100%',
			ScrollTriggerProp: scrollTriggerProp,
		});
	}
	setActiveItem(i) {
		console.log(`Set Active Option: ${i + 1}`);
		const opt = i;

		this.currentIndex = opt * 2;
		this.checkIndex();
	}

	checkIndex() {
		this.option.previous = this.option.current;
		this.option.current = Math.floor(this.currentIndex / 2) + 1;

		this.changeOption();

		console.log(`Option: ${this.option.current}`);
	}

	changeOption() {
		each(this.elements.listItems, (item) => item.classList.remove('active'));
		this.elements.listItems[this.option.current - 1].classList.add('active');

		if (this.option.current !== this.option.previous) {
			this.changeTexts();
		}
	}

	changeTexts() {
		const i = this.option.current - 1;
		this.elements.expertiseText.top.innerHTML = this.topTexts[i];
		this.elements.expertiseText.whom.innerHTML = this.whomTexts[i];
		this.elements.expertiseText.duration.innerHTML = this.durationTexts[i];

		each(this.elements.items.left, (item) => item.classList.remove('active'));
		each(this.elements.items.right, (item) => item.classList.remove('active'));

		this.elements.items.left[i].classList.add('active');
		this.elements.items.right[i].classList.add('active');
		console.log('change Text');
	}

	showNav() {
		this.elements.navFullscreen.classList.add('active');
	}

	hideNav() {
		this.elements.navFullscreen.classList.remove('active');
	}

	addEventListeners() {
		// Show/Hide the nav
		each(this.elements.listItems, (item, index) => {
			item.addEventListener('click', () => this.setActiveItem(index));
		});
	}

	removeEventListeners() {
		each(this.elements.listItems, (item, index) => {
			item.removeEventListener('click', () => this.setActiveItem(index));
		});
	}

	destroy() {
		super.destroy();

		if (this.timeline) {
			this.timeline.kill();
			this.timeline = null;
		}

		this.option.previous = null;
		this.option.current = null;
	}

	onResize() {}

	initTexts() {
		this.topTexts = [
			'You will receive space planning, material selection, a drawing album, 3D visualization of the future space design, and a cost estimate.',
			"I develop the design project and help you implement it. I visit the site 4 times, meet with contractors, check electrical and installation works, wall levels and angles, consult on color and material selection, and accept completed work from contractors. I help order custom furniture, verify drawings, and provide online consultations. You independently control the quality, deadlines, and changes in the contractors' work cost.",
			"I am responsible for all stages of renovation. I manage the renovation schedule, oversee contractors' work, and order goods with support. You entrust me with any difficulties that may arise during the implementation process. In the end, you receive a finished result without wasting your time or nerves.",
		];
		this.whomTexts = [
			'For whom? For those who want to bring their project to life on their own.',
			'For whom? For those who need the help of a designer during renovation. Duration: 3 to 6 months.',
			'For whom? For those who are constantly busy and want to entrust all the work to a designer.',
		];
		this.durationTexts = [
			'Duration: 1 to 2 months, depending on the technical task.',
			'Duration: 3 to 6 months.',
			'Duration: 3 to 6 month, depending on the renovation deadlines and technical task.',
		];
	}
}
