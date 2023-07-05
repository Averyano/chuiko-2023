import Component from '../../classes/Component';
import GSAP from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Reveal from '../../animations/Reveal';
import each from 'lodash/each';

export default class SelectionTextSection extends Component {
	constructor() {
		super({
			element: '.selection',
			elements: {
				titles: '.selection__title',
				subtitles: '.selection__subtitle',
				descriptions: '.selection__description',
				buttons: '.selection__button',
			},
		});
	}

	create() {
		super.createComponent();

		this.createTimeline();
		this.animateTimeline();
	}

	createTimeline() {
		this.timeline = GSAP.timeline({
			scrollTrigger: {
				trigger: this.element,
				start: 'top bottom',
				end: 'bottom top',
				toggleActions: 'restart none none reverse',
			},
		});
	}

	animateTimeline() {
		each(this.elements.subtitles, (subtitle) => {
			each(subtitle.children, (child, index) => {
				this.timeline.fromTo(
					child,
					{
						opacity: 0,
					},
					{
						opacity: 1,
						ease: 'out.expo',
						duration: 1.25,
						delay: (index % 3) * 0.15,
					},
					0
				);
			});
		});

		each(this.elements.buttons, (button, index) => {
			this.timeline.from(
				button,
				{
					scale: 0.6,
					duration: 1.5,
					autoAlpha: 0,
					delay: index * 0.33,
					ease: 'back.out(1.7)',
				},
				'1'
			);
		});

		this.timeline.fromTo(
			this.elements.descriptions,
			{
				opacity: 0,
			},
			{
				opacity: 1,
				ease: 'out.expo',
				duration: 1.25,
			},
			0
		);
	}

	destroy() {
		super.destroy();

		if (this.timeline) {
			this.timeline.kill();
			this.timeline = null;
		}
	}
}
