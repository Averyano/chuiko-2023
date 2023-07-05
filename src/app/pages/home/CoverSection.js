import Component from '../../classes/Component';
import GSAP from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Reveal from '../../animations/Reveal';
import Button from '../../components/Button';

export default class CoverSection extends Component {
	constructor() {
		super({
			element: '.cover',
			elements: {
				button: '.circle__button',
			},
		});
	}

	create() {
		super.createComponent();
		if (!this.button) {
			this.button = new Button(this.elements.button);
			console.log(this.button);
		}
	}

	destroy() {
		super.destroy();
		if (this.button) {
			this.button.removeEventListeners();
			this.button = null;
		}
	}
}
