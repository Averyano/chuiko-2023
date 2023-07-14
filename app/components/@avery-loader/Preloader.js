import Component from '../../classes/Component';
import GSAP from 'gsap';
import map from 'lodash/map';
import GlobalHandler from '../../classes/GlobalHandler';
import NodeEmitter from '../../classes/NodeEmitter';

export default class Preloader extends Component {
	constructor({ isWebpSupported }) {
		super({
			element: '.preloader',
			elements: {
				loadingbar: '.preloader__loadingbar',
				images: document.querySelectorAll('[data-pre]'),
				main: document.querySelector('.preloader__bg--main'),
				overlay: document.querySelector('.preloader__bg--overlay'),
				container: '.preloader__logo__svg__container',
				stroke: '.preloader__svg--stroke',
				fill: '.preloader__svg--filled',
				thumbWrapper: document.querySelector('.thumb__wrapper'),
				thumbItems: document.querySelectorAll('.thumb__item'),
			},
		});

		this.isWebpSupported = isWebpSupported;

		this.firstReveal = true;
		this.isIntroComplete = 0;
		this.elementToAnimate = [this.elements.overlay, this.elements.main];

		this.createTimeline();
		// this.introAnimation();
		this.onResize();
		GlobalHandler.registerResize(this.onResize.bind(this));
	}

	/**
	 * LOADER
	 */
	// called from Loader
	createLoader(template) {
		this.introAnimation();

		if (template === '404') return (this.isLoaded = true);
		this.length = 0;

		if (this.elements.images.length > 0)
			this.elements.images.forEach((img) => {
				// console.log('loadImg', img);
				this.loadImage(img);
			});

		if (this.elements.images.length === 0) {
			// setTimeout(this.onLoaded.bind(this), 100);
			console.log('No Images to load');
		}
	}

	/**
	 * ANIMATION
	 */
	animateElement(el, i) {
		GSAP.from(el, {
			xPercent: -100,
			duration: 0.7,
			delay: i,
			ease: 'out.expo',
			onComplete: () => {
				this.isIntroComplete++;

				if (this.isLoaded) {
					setTimeout(this.onLoaded.bind(this), 1000);
				}
			},
		});

		GSAP.set(el, { autoAlpha: 1 }, 0);
	}

	animateLine(number) {
		const numberPercent = number * 100;
		GSAP.to(this.elements.fill, {
			clipPath: `polygon(0% 0%, ${numberPercent}% 0%, ${numberPercent}% 100%, 0% 100%)`,
			ease: 'out.expo',
			duration: 1.5,
		});
	}

	introAnimation() {
		this.animateLine(0);
		this.isIntroComplete = 0;

		if (this.firstReveal) {
			this.revealText();
		}

		map(this.elementToAnimate, (el, i) => {
			if (this.elements.images.length === 0) {
				this.isIntroComplete = 2;
			}
			// this.animateElement(el, i / 1.75);
		});
	}

	revealText() {
		GSAP.fromTo(
			this.elements.container,
			{
				opacity: 0,
			},
			{
				opacity: 1,
				duration: 0.7,
				ease: 'out.expo',
			}
		);

		setTimeout(() => {
			NodeEmitter.emit('showMenu');
		}, 2000);

		GSAP.fromTo(
			this.elements.stroke,
			{
				strokeDashoffset: 1000,
			},
			{
				strokeDashoffset: 0,
				opacity: 1,
				duration: 3,
				ease: 'out.expo',
			},
			0
		);

		GSAP.to(
			this.elements.stroke,
			{
				strokeDashoffset: -1000,
				duration: 3,
				ease: 'out.expo',
			},
			'>'
		);

		// GSAP.set(this.elements.container, { opacity: 1 }, 0);
	}

	// The end animation
	createTimeline() {
		this.timeline = GSAP.timeline({
			paused: true,
		});

		this.timeline
			.fromTo(
				this.elements.thumbWrapper,
				{ yPercent: 100, opacity: 0 },
				{ yPercent: 0, opacity: 1, duration: 0.25, ease: 'out.expo' }
			)
			.fromTo(
				this.element,
				{
					opacity: 1,
				},
				{
					opacity: 0,
					duration: 0.5,
					ease: 'power4.out',
				}
			)
			.fromTo(
				this.elements.thumbItems,
				{ yPercent: 100, opacity: 0 },
				{
					yPercent: 0,
					opacity: 1,
					duration: 1.5,
					stagger: 0.05,
					ease: 'power4.out',
					onComplete: () => {
						NodeEmitter.emit('showMenu');
						this.destroy();
					},
				}
			);
	}

	/**
	 * IMAGE LOADING
	 */
	loadImage(img) {
		if (img.tagName.toLowerCase() === 'img') {
			// <img> tag
			// if (img.src) {
			// 	console.log(img, 'already loaded');
			// 	return this.onAssetLoaded(); // Image is already loaded
			// }

			const boundOnAssetLoaded = this.onAssetLoaded.bind(this);
			img.addEventListener('load', boundOnAssetLoaded);

			img.onload = function () {
				img.removeEventListener('load', boundOnAssetLoaded);
			};

			const imageUrl =
				this.isWebpSupported && img.getAttribute('data-pre-webp')
					? img.getAttribute('data-pre-webp')
					: img.getAttribute('data-pre');
			img.src = imageUrl;
		} else {
			// other tags (for background image)
			const imageUrl =
				this.isWebpSupported && img.getAttribute('data-pre-webp')
					? img.getAttribute('data-pre-webp')
					: img.getAttribute('data-pre');
			const tempImage = new Image();

			tempImage.onload = () => {
				img.style.backgroundImage = `url(${imageUrl})`;
				this.onAssetLoaded();
				tempImage.onload = null; // optional, goes to garbage collection anyways
			};

			tempImage.src = imageUrl;
		}
	}

	onAssetLoaded() {
		this.length++;
		let imageLength = 0;

		if (this.elements.images) {
			imageLength += this.elements.images.length;
		}

		const percent = this.length / imageLength;

		this.elements.loadingbar.dataset.loaded = percent;

		this.animateLine(percent);

		if (percent === 1) {
			this.isLoaded = true;

			setTimeout(this.onLoaded.bind(this), 1000);

			// if (this.isIntroComplete === 2) {
			// }
		}
	}

	onLoaded() {
		// GSAP.fromTo(
		// 	this.elements.text,
		// 	{
		// 		opacity: 1,
		// 	},
		// 	{
		// 		opacity: 0,
		// 		duration: 0.5,
		// 		ease: 'out.expo',
		// 	},
		// );
		console.log('onLoaded');
		this.emit('completed');
	}

	show() {
		return new Promise((resolve) => {
			this.timeline.reverse().then(() => {
				resolve();
			});
		});
	}

	hide() {
		// this.animateLine(1);
		this.timeline.play();
		console.log('hide');
		// .then(this.destroy.bind(this));
	}

	destroy() {
		this.timeline.kill();

		this.element.parentNode.removeChild(this.element);
	}

	onResize() {}
}
