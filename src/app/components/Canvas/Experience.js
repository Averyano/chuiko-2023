import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import GSAP from 'gsap';

import * as dat from 'dat.gui';

import Component from '../../classes/Component';
import vertexShader from '../../../shared/shaders/vertex.glsl';
import fragmentShader from '../../../shared/shaders/fragment.glsl';
import { lerp } from '../../utils/utils';
import { clamp } from 'three/src/math/MathUtils';

export default class Experience extends Component {
	constructor(el) {
		super({ element: el });

		this.sizes = {
			width: window.innerWidth,
			height: window.innerHeight,
		};

		this.progress = {
			current: 0,
			target: 0,
		};

		this.speed = 0;
		this.position = 0;
		this.timeline = GSAP.timeline();
		this.xSetter = GSAP.quickSetter('.dot', 'y', 'px');
		// GSAP.utils.pipe(
		// 	GSAP.utils.clamp(0, 100), //make sure the number is between 0 and 100
		// 	GSAP.utils.snap(5), //snap to the closest increment of 5
		// 	GSAP.quickSetter('.dot', 'y', 'px') //apply it to the #id element's x property and append a "px" unit
		// );

		this.gui = new dat.GUI();
		this.gui.hide();

		this.createGui();

		this.loadTextures();
		this.createScene();
		this.createCamera();

		this.createMouse();

		this.controls = new OrbitControls(this.camera, this.element);
		this.controls.enableDamping = true;

		this.loadModels();
		this.createElements();
		this.createLights();
		this.createRenderer();
		this.addEventListeners();

		this.clock = new THREE.Clock();
		this.oldElapsedTime = 0;
		// const planeSize = 2;
		// this.camera.fov = 2 * (180 / Math.PI) * Math.atan(planeSize / (2 * 1));
		this.onResize();
	}

	loadTextures() {
		this.textureLoader = new THREE.TextureLoader();
		// const images = [
		// 	'/images/gallery1.jpg',
		// 	'/images/gallery2.jpg',
		// 	'/images/gallery3.jpg',
		// 	'/images/gallery4.jpg',
		// 	'/images/gallery5.jpg',
		// ];
		// this.textures = images.map((img) => this.textureLoader.load(img));
	}

	createGui() {
		this.debugObject = {};
		this.debugObject.progress = 0;
		// this.gui.add(debugObject, 'runProgress');
		this.gui
			.add(this.debugObject, 'progress')
			.min(0)
			.max(1)
			.step(0.001)
			.onFinishChange(() => {
				this.progress.target = this.debugObject.progress;
			});
	}

	createScene() {
		this.scene = new THREE.Scene();
	}

	createCamera() {
		this.camera = new THREE.PerspectiveCamera(
			75,
			this.sizes.width / this.sizes.height,
			0.1,
			100
		);
		this.camera.position.set(0, 0, 1);
		this.scene.add(this.camera);
	}

	createMouse() {
		this.mouse = new THREE.Vector2();
	}

	loadModels() {
		this.gltfLoader = new GLTFLoader();

		this.roza = {
			model: null,
			material: null,
			textures: {
				color: this.textureLoader.load(
					'images/textures/MCh_S_12_Rzezba_Popiersie_Rozy_Loewenfeld.jpg'
				),
				normal: this.textureLoader.load(
					'images/textures/MCh_S_12_Rzezba_Popiersie_Rozy_Loewenfeld_.jpg'
				),
			},
		};

		this.roza.material = new THREE.MeshStandardMaterial({
			roughness: 0.7,
			map: this.roza.textures.color,
			normalMap: this.roza.textures.normal,
		});

		this.gltfLoader.load('models/roza.glb', (gltf) => {
			this.roza.model =
				gltf.scene.children[0].children[0].children[0].children[0];
			this.roza.model.position.set(0, 0, 0.2);
			this.roza.model.rotation.x = Math.PI * 0.5;
			this.roza.model.rotation.y = -Math.PI;

			this.roza.model.scale.set(0.001, 0.001, 0.001);
			this.roza.model.material = this.roza.material;

			this.roza.model.geometry.center();

			this.scene.add(this.roza.model);
		});
	}

	createElements() {
		this.uniforms = {
			uTime: { value: 0 },
		};
		this.geometry = new THREE.PlaneGeometry(1, 1);
		this.material = new THREE.ShaderMaterial({
			uniforms: this.uniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
		});

		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.scene.add(this.mesh);
	}

	createLights() {
		this.ambientLight = new THREE.AmbientLight(0xffffff, 1);
		this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
		this.directionalLight.position.x = 2;
		this.directionalLight.castShadow = true;
		this.scene.add(this.ambientLight, this.directionalLight);
	}

	createRenderer() {
		this.renderer = new THREE.WebGLRenderer({
			canvas: this.element,
		});

		// this.renderer.setClearColor(0xf1f1f1);
		this.renderer.setClearColor(0x050505);
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		this.renderer.setSize(this.sizes.width, this.sizes.height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	}

	update() {
		// Calc posisition
		this.position += this.speed;
		this.speed *= 0.7;

		const closest = Math.round(this.position);
		const dif = closest - this.position;

		// dif = clamp(dif, -0.02, 0.02);

		this.position += dif * 0.02; // 0.02 for faster transition
		if (Math.abs(closest - this.position) < 0.001) {
			this.position = closest;
		}

		// green box setter
		// this.xSetter(this.position * 200);

		// Tick
		this.elapsedTime = this.clock.getElapsedTime();
		this.deltaTime = this.elapsedTime - this.oldElapsedTime;
		this.oldElapsedTime = this.elapsedTime;

		// Update material
		if (this.roza && this.roza.model) {
			this.roza.model.rotation.z = this.elapsedTime;
		}

		// Controls update
		this.controls.update();

		// Scene
		this.renderer.render(this.scene, this.camera);
	}

	onResize() {
		// Update sizes
		this.sizes.width = window.innerWidth;
		this.sizes.height = window.innerHeight;

		// Update camera
		this.camera.aspect = this.sizes.width / this.sizes.height;
		this.camera.updateProjectionMatrix();

		// Update renderer
		this.renderer.setSize(this.sizes.width, this.sizes.height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		// Update shader
	}

	addEventListeners() {
		window.addEventListener('resize', this.onResize.bind(this));
		window.addEventListener('wheel', (event) => {
			this.speed = event.deltaY * 0.0003;
		});
	}
}
