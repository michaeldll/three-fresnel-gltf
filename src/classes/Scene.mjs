import * as THREE from '../libs/three.module.js';
import { GLTFLoader } from '../libs//GLTFLoader.mjs';

class Scene {
	constructor() {
		this.params = {
			fWidth: 0.8,
			fColor: new THREE.Color('black'),
			baseColor: new THREE.Color('white'),
		};

		// Camera
		this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
		this.camera.position.z = 1;

		// Scene
		this.scene = new THREE.Scene();

		// Fresnel Shader Material
		this.shaderMaterial = new THREE.ShaderMaterial({
			vertexShader: /* glsl */ `
			varying vec2 vUv;
			varying vec3 vNormal;
			varying vec3 vPosition;
			
			void main(){
					vec4 modelPosition = modelMatrix * vec4(position, 1.0);
					vec4 viewPosition = viewMatrix * modelPosition;
					vec4 projectedPosition = projectionMatrix * viewPosition;
			
					gl_Position = projectedPosition;
			
					vUv = uv;
					vNormal = normalize(vec3(mat3(modelMatrix) * normal));
					vPosition = modelPosition.xyz;
			}`,
			fragmentShader: /* glsl */ `
			varying vec2 vUv;
			varying vec3 vNormal;
			varying vec3 vPosition;

			uniform vec3 uFresnelColor;
			uniform vec3 uBaseColor;
			uniform float uFresnelWidth;

			void main(){
					// // Direction du vertex par rapport a la position de la camera
					vec3 viewDirection = normalize(cameraPosition - vPosition);

					// // Angle entre deux vecteurs avec un produit scalaire :
					// // direction d'en haut et la normal
					float fresnelFactor = dot(viewDirection, vNormal);

					// // Inverser l'angle
					float inverseFresnelFactor = clamp(1. - fresnelFactor, 0., 1.);

					// // Shaping function
					inverseFresnelFactor = step(uFresnelWidth, inverseFresnelFactor);

					vec3 color = mix(uBaseColor, uFresnelColor, inverseFresnelFactor);

					gl_FragColor = vec4(color, inverseFresnelFactor);
			}
			`,
			uniforms: {
				uFresnelWidth: { value: 1 - this.params.fWidth },
				uFresnelColor: { value: this.params.fColor },
				uBaseColor: { value: this.params.baseColor },
			},
			transparent: true,
		});

		// GLTF
		const loader = new GLTFLoader();
		loader.load('src/glb/monkee.glb', (gltf) => {
			const monkee = gltf.scene;
			monkee.rotation.y = -0.5;
			monkee.scale.set(1.5, 1.5, 1.5);
			monkee.traverse((obj3D) => {
				obj3D.material = this.shaderMaterial;
			});
			this.scene.add(gltf.scene);
		});

		// Simple Sphere
		this.geometry = new THREE.SphereGeometry(0.2, 30, 30);
		this.mesh = new THREE.Mesh(this.geometry, this.shaderMaterial);
		// this.scene.add(this.mesh);

		// Light
		const light = new THREE.PointLight({ color: '#fff' });
		light.position.x = 1;
		this.scene.add(light);

		// Renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setAnimationLoop(this.update);
		this.renderer.setClearColor(new THREE.Color('lightblue'));
		document.body.appendChild(this.renderer.domElement);

		this.tweaks();
	}

	update = (time) => {
		this.scene.rotation.y = Math.sin(time / 1000) * 0.75 - 0.5;

		this.renderer.render(this.scene, this.camera);
	};

	tweaks = () => {
		const pane = new Tweakpane();
		const wInput = pane.addInput(this.params, 'fWidth', { min: 0, max: 1 });
		wInput.on('change', (e) => {
			this.shaderMaterial.uniforms.uFresnelWidth.value = 1 - e.value;
		});
		const fCInput = pane.addInput(this.params, 'fColor');
		fCInput.on('change', (e) => {
			this.shaderMaterial.uniforms.uFresnelColor.value = new THREE.Vector3(
				e.value.r / 255,
				e.value.g / 255,
				e.value.b / 255
			);
		});
		const bCInput = pane.addInput(this.params, 'baseColor');
		bCInput.on('change', (e) => {
			this.shaderMaterial.uniforms.uBaseColor.value = new THREE.Vector3(
				e.value.r / 255,
				e.value.g / 255,
				e.value.b / 255
			);
		});
	};
}

export default Scene;
