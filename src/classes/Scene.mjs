import FresnelSphere from './FresnelSphere.mjs';

// Local development (faster reloads)
// import { Renderer, Camera, Transform } from '../libs/ogl/index.mjs';

// Hosted development (smaller size)
import { Renderer, Camera, Transform } from 'https://cdn.skypack.dev/ogl';
import Tweakpane from 'https://cdn.skypack.dev/tweakpane';

export default class Scene {
	constructor() {
		this.renderer = new Renderer({ dpr: 3 });
		this.gl = this.renderer.gl;
		this.camera = new Camera(this.gl);
		this.camera.position.z = 5;
		this.scene = new Transform();
		this.pane = new Tweakpane();
		this.FresnelSphere = new FresnelSphere(this.gl, this.scene, this.camera, this.pane);
	}

	init = () => {
		this.FresnelSphere.init();
		this.resize();
		this.setEvents();

		document.body.appendChild(this.gl.canvas);
		requestAnimationFrame(this.update);
	};

	setEvents = () => {
		window.addEventListener('resize', this.resize, false);
		window.addEventListener('keypress', (e) => {
			if (e.code === 'KeyH') this.pane.hidden = !this.pane.hidden;
		});
	};

	resize = () => {
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.camera.perspective({
			aspect: this.gl.canvas.width / this.gl.canvas.height,
		});
	};

	update = (t) => {
		requestAnimationFrame(this.update);

		this.FresnelSphere.update();

		this.renderer.render({ scene: this.scene, camera: this.camera });
	};
}
