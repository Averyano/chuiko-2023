import { EventEmitter } from 'events';
import { lerp, getMousePos, calcWinsize, distance } from '../utils/utils.js';
import Component from '../classes/Component.js';

export default class Btn extends Component {
	constructor(el) {
		super({
			element: el,
			elements: {
				el: '.btn',
				text: document.querySelector('.btn__text'),
				textInner: document.querySelector('.btn__text--inner'),
			},
		});

		this.renderedStyles = {
			tx: { previous: 0, current: 0, amt: 0.1 },
			ty: { previous: 0, current: 0, amt: 0.1 },
		};

		this.state = {
			hover: false,
		};

		this.calculateBounds();
		this.createMouse();
		this.addEventListeners();

		requestAnimationFrame(() => this.render());
	}

	createMouse() {
		this.mousepos = { x: 0, y: 0 };
	}

	calculateBounds() {
		// size/position
		this.rect = this.elements.el.getBoundingClientRect();
		// the movement will take place when the distance from the mouse to the center of the button is lower than this value
		this.distanceToTrigger = this.rect.width * 0.8;
	}

	addEventListeners() {
		window.addEventListener('resize', this.onResize.bind(this));
		window.addEventListener(
			'mousemove',
			(e) => (this.mousepos = getMousePos(e))
		);
	}

	onResize() {
		this.winsize = calcWinsize();
		this.calculateBounds();
	}

	render() {
		const distanceMouseButton = distance(
			this.mousepos.x + window.scrollX,
			this.mousepos.y + window.scrollY,
			this.rect.left + this.rect.width / 2,
			this.rect.top + this.rect.height / 2
		);

		let x = 0;
		let y = 0;

		if (distanceMouseButton < this.distanceToTrigger) {
			if (!this.state.hover) {
				this.enter();
			}
			x =
				(this.mousepos.x +
					window.scrollX -
					(this.rect.left + this.rect.width / 2)) *
				0.3;
			y =
				(this.mousepos.y +
					window.scrollY -
					(this.rect.top + this.rect.height / 2)) *
				0.3;
		} else if (this.state.hover) {
			this.leave();
		}

		this.renderedStyles['tx'].current = x;
		this.renderedStyles['ty'].current = y;

		for (const key in this.renderedStyles) {
			this.renderedStyles[key].previous = lerp(
				this.renderedStyles[key].previous,
				this.renderedStyles[key].current,
				this.renderedStyles[key].amt
			);
		}

		this.elements.el.style.transform = `translate3d(${this.renderedStyles['tx'].previous}px, ${this.renderedStyles['ty'].previous}px, 0)`;
		this.elements.text.style.transform = `translate3d(${
			this.renderedStyles['tx'].previous * 0.5
		}px, ${this.renderedStyles['ty'].previous * 0.5}px, 0)`;

		requestAnimationFrame(() => this.render());
	}
	enter() {
		this.emit('enter');
		this.state.hover = true;
		this.elements.el.classList.add('btn--hover');
		document.body.classList.add('active');

		gsap.killTweensOf(this.elements.textInner);

		gsap
			.timeline()
			.to(this.elements.textInner, 0.15, {
				ease: 'Power2.easeIn',
				opacity: 0,
				x: '20%',
			})
			.to(this.elements.textInner, 0.2, {
				ease: 'Expo.easeOut',
				opacity: 1,
				startAt: { x: '-20%' },
				x: '0%',
			});
	}
	leave() {
		this.emit('leave');
		this.state.hover = false;
		this.elements.el.classList.remove('btn--hover');
		document.body.classList.remove('active');

		gsap.killTweensOf(this.elements.textInner);

		gsap
			.timeline()
			.to(this.elements.textInner, 0.15, {
				ease: 'Power2.easeIn',
				opacity: 0,
				x: '-20%',
			})
			.to(this.elements.textInner, 0.2, {
				ease: 'Expo.easeOut',
				opacity: 1,
				startAt: { x: '20%' },
				x: '0%',
			});
	}
}
