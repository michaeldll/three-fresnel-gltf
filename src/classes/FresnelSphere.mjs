// Local development (faster reloads)
// import { Sphere, Program, Mesh, Vec3, Color } from '../libs/ogl/index.mjs';

// Hosted development (smaller size)
import { Sphere, Program, Mesh, Vec3 } from 'https://cdn.skypack.dev/ogl';

export default class FresnelSphere {
	constructor(gl, scene, camera, pane) {
		this.params = {
			backgroundColor: { r: 0, g: 0, b: 0 },
			baseColor: { r: 249, g: 213, b: 134 },
			fresnelColor: { r: 255, g: 255, b: 255 },
			fresnelFactor: 6,
		};
		this.gl = gl;
		this.scene = scene;
		this.camera = camera;
		this.pane = pane;
		this.geometry = new Sphere(this.gl, {
			radius: 1,
			widthSegments: 128,
		});

		// Builds a new GLSL shader program
		// This is roughly the same instanciating a ShaderMaterial in ThreeJS
		this.program = new Program(this.gl, {
			vertex: /* glsl */ `
        attribute vec3 position;
				attribute vec2 uv;
				attribute vec3 normal;

        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;

				varying vec2 vUv;
				varying vec3 vNormal;
				varying vec3 vPosition;

        void main() {					
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

					vPosition = position;
					vUv = uv;
					vNormal = normalize(vec3(mat3(modelViewMatrix) * normal));
        }
        `,
			fragment: /* glsl */ `
				precision highp float;

				varying vec2 vUv;
				varying vec3 vNormal;
				varying vec3 vPosition;

				uniform vec3 fresnelColor;
				uniform vec3 baseColor;
				uniform float powerOfFactor;
				uniform vec3 cameraPosition;
				uniform float alpha;

				void main() {
					vec3 viewDirection = normalize(cameraPosition - vec3(vPosition.x, vPosition.y, vPosition.z));
					float fresnelFactor = dot(viewDirection, vNormal);
					
					float inversefresnelFactor = clamp(1. - fresnelFactor, 0., 1.);
					
					// Shaping function
					fresnelFactor = pow(fresnelFactor, powerOfFactor);
					inversefresnelFactor = pow(inversefresnelFactor, powerOfFactor);

					gl_FragColor = vec4(fresnelFactor * baseColor + fresnelColor * inversefresnelFactor, alpha);
				}
			`,
			uniforms: {
				fresnelColor: {
					value: new Vec3(
						this.params.fresnelColor.r / 255,
						this.params.fresnelColor.g / 255,
						this.params.fresnelColor.b / 255
					),
				},
				baseColor: {
					value: new Vec3(
						this.params.baseColor.r / 255,
						this.params.baseColor.g / 255,
						this.params.baseColor.b / 255
					),
				},
				powerOfFactor: { value: this.params.fresnelFactor },
				cameraPosition: { value: this.camera.position },
				alpha: { value: 1 },
			},
		});

		this.mesh = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
	}

	init() {
		// Adds this mesh to the Scene Graph
		// This is roughly the same as this.scene.add() in ThreeJS
		this.mesh.setParent(this.scene);

		this.tweaks();
	}

	tweaks() {
		const baseColorInput = this.pane.addInput(this.params, 'baseColor', { label: 'Base' });
		baseColorInput.on('change', () => {
			this.program.uniforms.baseColor.value = new Vec3(
				this.params.baseColor.r / 255,
				this.params.baseColor.g / 255,
				this.params.baseColor.b / 255
			);
		});

		const fresnelColorInput = this.pane.addInput(this.params, 'fresnelColor', { label: 'Fresnel' });
		fresnelColorInput.on('change', () => {
			this.program.uniforms.fresnelColor.value = new Vec3(
				this.params.fresnelColor.r / 255,
				this.params.fresnelColor.g / 255,
				this.params.fresnelColor.b / 255
			);
		});

		const fresnelFactorInput = this.pane.addInput(this.params, 'fresnelFactor', {
			label: 'Factor',
			min: 0,
			max: 15,
		});
		fresnelFactorInput.on('change', () => {
			this.program.uniforms.powerOfFactor.value = this.params.fresnelFactor;
		});

		const backgroundColorInput = this.pane.addInput(this.params, 'backgroundColor', { label: 'Background' });
		backgroundColorInput.on('change', () => {
			this.gl.clearColor(
				this.params.backgroundColor.r / 255,
				this.params.backgroundColor.g / 255,
				this.params.backgroundColor.b / 255,
				1
			);
		});

		const hideButton = this.pane.addButton({ title: 'H to Hide' });
		hideButton.on('click', () => {
			this.pane.hidden = true;
		});
	}

	update() {
		this.mesh.rotation.y -= 0.015;
		this.mesh.rotation.x += 0.0075;
	}
}
