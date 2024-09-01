import { PALETTE } from '../utils/colors';
import * as THREE from 'three'

export class Thunderdome {
    private _scene: THREE.Scene;
    private _camera: THREE.PerspectiveCamera;
    private _renderer: THREE.WebGLRenderer;
    constructor () {
        /**
         * core scene
         *
         * for now this is hard-coded as one single scene
         * no support for multiple (yet?)
         */
        this._scene = new THREE.Scene();
        this._scene.background = PALETTE.BACKGROUND;
        /**
         * camera controls and raycast picking
         *
         * on the fence about delegating this to its own class,
         * but in early concepts, the complexity grew quickly
         */
        this._camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            1,
            1000
        );
        this._camera.position.set(500, 300, 1000);
        this._camera.lookAt(0, 0, 0);
        /**
         * three.js WebGLRenderer instance
         *
         * there should only be one.
         * it should only be accessed here.
         */
        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        this._renderer.setAnimationLoop(this.animate.bind(this));
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this._renderer.domElement);
        /**
         * event listeners
         *
         * if being passed to callbacks, `this` needs to be explicitly bound
         * to be used within the context it is passed to
         */
        window.addEventListener('resize', this._onWindowResize.bind(this));
    }

    animate(_time: number): void {
        this._renderer.render(this._scene, this._camera);
    }

    _onWindowResize(): void {
        console.log('test whether we need binding');
        this._renderer.setSize(window.innerWidth, window.innerHeight);
    }
}