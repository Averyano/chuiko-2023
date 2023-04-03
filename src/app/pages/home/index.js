import Component from '../../classes/Component';

export default class coverHome extends Component {
	constructor(el) {
		super({
			element: el,
			elements: {
				title: '.cover__title',
				list: 'li',
				desc: '.cover__desc--hidden',
				btn: '.btn',
			},
		});
		this.id = 'home';

		this.animate();
	}

	animate() {
		const tl = gsap.timeline({ duration: 1, ease: 'power4.out' });
		tl.from(this.element, { autoAlpha: 0 })
			.from(this.elements.title, {
				autoAlpha: 0,
				y: 100,
				rotate: 2,
			})
			.from(this.elements.list, {
				autoAlpha: 0,
				y: 40,
				stagger: 0.2,
				duration: 0.7,
				rotate: 10,
			})
			.from(
				this.elements.desc,
				{
					autoAlpha: 0,
					y: 40,
					duration: 0.7,
				},
				'-=0.5'
			)
			.from(
				this.elements.btn,
				{
					autoAlpha: 0,
				},
				'-=0.5'
			);
	}
}
