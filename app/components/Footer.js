import Component from '../classes/Component';
import GSAP from 'gsap';

export default class Footer extends Component {
	constructor() {
		super({
			element: 'footer',
			elements: {
				top: '.footer__top',
				container: '.footer__container',
				items: '.footer__item',
			},
		});

		this.createTimeline();
	}

	createTimeline() {}

	destroy() {
		super.destroy();

		if (this.timeline) {
			this.timeline.kill();
			this.timeline = null;
		}
	}
}
