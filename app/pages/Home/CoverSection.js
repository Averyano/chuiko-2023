import Component from '../../classes/Component';
import GSAP from 'gsap';
// import ScrollTrigger from 'gsap/ScrollTrigger';
// import Reveal from '../../animations/Reveal';
// import Button from '../../components/Button';

export default class CoverSection extends Component {
	constructor() {
		super({
			element: '.cover',
			elements: {
				topNavWrapper: '.nav__wrapper',
				topNavItems: '.nav__item',
			},
		});
	}

	create() {
		super.createComponent();
		this.createTimeline();
	}

	createTimeline() {
		this.tl = GSAP.timeline();

		this.tl.fromTo(
			this.elements.topNavWrapper,
			{
				autoAlpha: 0,
				yPercent: -100,
			},
			{
				autoAlpha: 1,
				yPercent: 0,
				delay: 3,
				duration: 1,
				ease: 'power4.out',
			}
		);
	}

	destroy() {
		super.destroy();
	}
}
