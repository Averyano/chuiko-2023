import Item from './Item';
import Component from '../../classes/Component';
import GSAP from 'gsap';
import each from 'lodash/each';
import map from 'lodash/map';
import { lerp, clamp } from '../../utils/utils';

export default class Gallery extends Component {
	constructor() {
		super({
			element: '.cover__wrapper',
			elements: {
				main: {
					wrapper: '.main__wrapper',
					figure: '.main__figure',
					image: '.main__image',
				},
				thumb: {
					el: '.thumb',
					wrapper: '.thumb__wrapper',
				},
				coverBackground: '.cover__background',
				// thumbItems: '.thumb__item',
			},
		});

		this.items = [];

		this.position = 0;
		this.positionTarget = 0;
		this.direction = 1;
		this.velocity = 1;

		this.speed = {
			current: 0,
			target: 0,
			lerp: 0.1,
			extra: 0,
		};

		this.mobilemediaQuery = window.matchMedia('(max-width: 1024px)');
		if (this.mobilemediaQuery.matches) this.speed.lerp = 0.35;

		this.y = {
			start: 0,
			end: 0,
		};

		this.isAnimating = false;
		this.isTouchPoint = false;
		this.timer = null;

		this.bounds = this.getBounds();

		this.previousIndex = 0;
		this.activeIndex = 14;
	}

	// Called on preloaded
	create(thumbItems) {
		if (!thumbItems) return;

		this.elements.thumb.items = thumbItems;

		each(this.elements.thumb.items, (item, index) => {
			item.setAttribute('data-index', index);
			const newItem = new Item(item, item.querySelector('img'));
			this.items.push(newItem);
		});

		// this.previousIndex = 0;
		// this.activeIndex = this.items.length / 2;

		this.getBounds();
		this.changeActive();
	}

	updateImageSource() {
		this.elements.main.image.onload = () => this.showFigure();
		this.elements.main.image.src = this.items[this.activeIndex].src;
		this.elements.coverBackground.src = this.items[this.activeIndex].thumbSrc;
	}

	clickEvent(target) {
		this.isClicked = true;
		const targetIndex = target.getAttribute('data-index');

		if (this.activeIndex === targetIndex) return;

		this.targetPosition =
			-this.items[targetIndex].bounds.left +
			window.innerWidth / 2 -
			this.items[targetIndex].bounds.width / 2;

		if (this.position > this.targetPosition) {
			this.direction = -1;
		} else {
			this.direction = 1;
		}
		// GSAP.to(this.elements.thumb.wrapper, {
		// 	duration: 1.5,
		// 	ease: 'power4.out',
		// 	x: targetPosition,
		// 	onComplete: () => (this.isAnimating = false),
		// });
	}
	changeActive() {
		this.items[this.previousIndex].setInactive();
		this.items[this.activeIndex].setActive();

		this.previousIndex = this.activeIndex;

		// const centeredPosition =
		// 	-this.items[this.activeIndex].bounds.left +
		// 	window.innerWidth / 2 -
		// 	this.items[this.activeIndex].bounds.width / 2;

		// GSAP.to(this.elements.thumb.wrapper, {
		// 	duration: 1.5,
		// 	ease: 'power4.out',
		// 	x: centeredPosition,
		// });

		// this.position = centeredPosition;
		let duration = 1.5;
		if (this.mobilemediaQuery.matches) duration = 0.5;

		if (!this.mobilemediaQuery.matches) {
			// GSAP.fromTo(
			// 	this.elements.main.figure,
			// 	{
			// 		opacity: 0,
			// 	},
			// 	{
			// 		opacity: 1,
			// 		duration: duration,
			// 		ease: 'power4.out',
			// 	}
			// );

			GSAP.fromTo(
				this.elements.coverBackground,
				{
					opacity: 0,
				},
				{
					opacity: 0.18,
					duration: duration,
					ease: 'power4.out',
				}
			);
		} else {
		}
		GSAP.fromTo(
			this.elements.main.figure,
			{
				opacity: 1,
			},
			{
				opacity: 0,
				duration: duration,
				ease: 'power4.out',
			}
		);
		this.updateImageSource();
	}

	showFigure() {
		let duration = 1.5;
		if (this.mobilemediaQuery.matches) duration = 0.5;

		GSAP.fromTo(
			this.elements.main.figure,
			{
				opacity: 0,
			},
			{
				opacity: 1,
				duration: duration,
				delay: 0,
			}
		);
	}

	getBounds() {
		let totalWidth = 0;
		let padding = 6;

		map(this.items, (item) => {
			item.getBounds();
			// prettier-ignore
			totalWidth = totalWidth + (item.bounds.width + padding * 2);
			item.position = totalWidth;
		});

		this.totalWidth = totalWidth;
		console.log(`totalWidth: ${totalWidth}`);

		return this.element.getBoundingClientRect();
	}

	addEventListeners() {
		this.elements.thumb.wrapper.addEventListener('click', (e) => {
			e.preventDefault();
			if (e.target.classList.contains('thumb__item')) {
				// this.activeIndex = e.target.getAttribute('data-index');
				this.clickEvent(e.target);
			} else if (!e.target.classList.contains('thumb__wrapper')) {
				this.clickEvent(e.target.closest('.thumb__item'));
				// this.activeIndex =
				// 	.getAttribute('data-index');
				// this.changeActive();
			}
		});

		window.addEventListener('keydown', (e) => {
			this.isClicked = false;
			if (e.key === 'ArrowLeft' || e.keyCode === 37) {
				if (this.activeIndex > 0) {
					this.activeIndex--;
					this.position += 300;
					this.changeActive();
				}
			}

			if (e.key === 'ArrowRight' || e.keyCode === 38) {
				this.isClicked = false;
				if (this.activeIndex < this.items.length - 1) {
					this.activeIndex++;

					this.position -= 300;
					this.changeActive();
				}
			}
		});
	}

	removeEventListener() {}

	onWheel({ pixelY }) {
		this.isClicked = false;

		this.direction = pixelY > 0 ? 1 : -1;
		this.velocity += pixelY * 0.1;
		this.speed.target += Math.abs(pixelY * 0.5);

		this.isAnimating = true;
	}

	onTouchDown(e) {
		this.isClicked = false;
		this.isTouch = true;

		this.y.start = e.touches ? e.touches[0].clientX : e.clientX;
	}

	onTouchMove(e) {
		if (!this.isTouch) return;

		const y = e.touches ? e.touches[0].clientX : e.clientX;

		this.y.end = y;

		let yDistance = y - this.y.start;

		if (Math.abs(yDistance) > 2) {
			this.direction = yDistance < 0 ? -1 : 1;
			this.isTouchPoint = true;
			this.speed.target += Math.abs(yDistance);

			// Update the starting point for the next move
			this.y.start = y;
		}
	}

	onTouchUp(e) {
		if (!this.isTouch) return;
		this.isTouch = false;
		this.isTouchPoint = false;

		const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

		this.y.end = y;

		const values = {
			y: this.y,
		};
	}

	onResize() {
		this.bounds = this.getBounds();

		// if (this.activeIndex && this.previousIndex) this.changeActive();
	}

	update() {
		this.speed.current = lerp(
			this.speed.current,
			this.speed.target,
			this.speed.lerp
		);

		this.speed.target = clamp(this.speed.target, 1, 2000);
		this.speed.current = clamp(this.speed.current, 1, 2000);

		this.speed.target *= 0.5;

		this.position += this.speed.current * this.direction;

		let closestImageIndex;
		let smallestDistance = Infinity;

		map(this.items, (item, index) => {
			let imageCenter = item.bounds.left + item.bounds.width / 2;
			// calculate distance between viewport center and image center
			let distance = Math.abs(
				window.innerWidth / 2 - (imageCenter + this.position)
			);

			if (distance < smallestDistance) {
				smallestDistance = distance;
				closestImageIndex = index;
			}
		});

		if (this.activeIndex !== closestImageIndex) {
			this.activeIndex = closestImageIndex;
			this.changeActive();
		}

		if (!this.isClicked)
			this.targetPosition =
				-this.items[this.activeIndex].bounds.left +
				window.innerWidth / 2 -
				this.items[this.activeIndex].bounds.width / 2;

		this.position = lerp(this.position, this.targetPosition, this.speed.lerp); // you can adjust the 0.1 to control the speed of snapping

		// GSAP.to(this.elements.thumb.wrapper, {
		// 	x: this.position,
		// 	duration: 1.5,
		// 	immediateRender: false,
		// 	overwrite: 'all',
		// });

		// console.log(targetPosition);
		this.elements.thumb.wrapper.style.transform = `translate3d(${this.position}px, 0, 0)`;
	}
}
