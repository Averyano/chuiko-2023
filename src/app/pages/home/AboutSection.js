import Component from '../../classes/Component';
import GSAP from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Reveal from '../../animations/Reveal';

export default class AboutSection extends Component {
	constructor() {
		super({
			element: '.about',
			elements: {
				image: '.about__image',
				figure: '.about__image__figure',
				topTitle: '.about__top__title',
				botTitle: {
					left: '.about__bottom__titles--left',
					right: '.about__bottom__titles--right',
				},
				text: { container: '.about__container', el: '.about__text' },
			},
		});
	}

	create() {
		super.createComponent();

		this.createTimeline();
		this.animateTimeline();

		this.addRevealAnimation();
	}

	createTimeline() {
		this.timeline = GSAP.timeline({
			scrollTrigger: {
				trigger: this.element,
				scrub: 1,
				start: 'top bottom',
				end: 'bottom top',
			},
		});

		this.timelineInstant = GSAP.timeline({
			scrollTrigger: {
				trigger: this.elements.text.container,
				start: 'top bottom',
				end: 'bottom top',
				toggleActions: 'restart none none reverse',
			},
		});
	}

	animateTimeline() {
		this.timeline.fromTo(
			this.elements.image,
			{
				yPercent: 10,
			},
			{
				yPercent: -5,
				ease: 'power4.out',
			}
		);

		this.timelineInstant.fromTo(
			this.elements.text.el,
			{
				opacity: 0,
				yPercent: 10,
			},
			{
				opacity: 1,
				yPercent: 0,
				ease: 'power4.out',
				duration: 0.5,
				stagger: 0.25,
			}
		);

		const addTitleAnimation = () => {
			const arrayOfELements = [
				this.elements.topTitle,
				this.elements.botTitle.left,
				this.elements.botTitle.right,
			];

			arrayOfELements.forEach((element, i) => {
				this.timelineInstant.fromTo(
					element,
					{
						opacity: 0,
					},
					{
						opacity: 1,
						ease: 'out.expo',
						duration: 1.25,
						delay: i * 0.25,
					},
					0
				);
			});
		};

		addTitleAnimation();
	}

	addRevealAnimation() {
		new Reveal({
			color: 'rgb(246, 244, 242)',
			ease: 'out.expo',
			element: this.elements.figure,
			delay: 0.2,
			dir: 'Y',
			duration: 1,
			size: '100%',
			// markers: true
		});
	}

	destroy() {
		super.destroy();

		if (this.timeline) {
			this.timeline.kill();
			this.timeline = null;
		}

		if (this.timelineInstant) {
			this.timelineInstant.kill();
			this.timelineInstant = null;
		}
	}
}
