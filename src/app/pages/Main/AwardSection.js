import Component from '../../classes/Component';
import GSAP from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
GSAP.registerPlugin(ScrollTrigger);
import Reveal from '../../animations/Reveal';
import NodeEmitter from '../../classes/NodeEmitter';

export default class AwardSection extends Component {
	constructor() {
		super({
			element: '.award',
			elements: {
				titles: '.awards__title',
				left: '.awards__left',
				items: '.awards__item',
			},
		});
	}

	create() {
		super.createComponent();

		this.createTimeline();
		this.animateTimeline();

		// this.addRevealAnimation();
	}

	createTimeline() {
		this.timeline = GSAP.timeline({
			scrollTrigger: {
				trigger: this.elements.left,
				start: 'top bottom',
				end: 'top bottom',
				toggleActions: 'restart none none reverse',
				// markers: true,
			},
		});

		ScrollTrigger.create({
			trigger: this.elements.left,
			start: 'center center',
			end: 'center center',
			onEnter: () => NodeEmitter.emit('navChangeIndex', 2),
			onEnterBack: () => NodeEmitter.emit('navChangeIndex', 2),
		});
	}

	animateTimeline() {
		this.timeline.fromTo(
			this.elements.titles,
			{ opacity: 0 },
			{ opacity: 1, duration: 0.7, stagger: 0.6, ease: 'power4.out' },
			0
		);

		this.timeline.fromTo(
			this.elements.items,
			{
				opacity: 0,
				// y: 100,
			},
			{
				opacity: 1,
				// y: 0,
				stagger: 0.1,
				duration: 0.3,
				ease: 'power4.out',
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
