export const THUNDERDOME_TILES = 10;
export const THUNDERDOME_TILE_SIZE = 128
export const THUNDERDOME_SIZE = THUNDERDOME_TILES * THUNDERDOME_TILE_SIZE;

import * as THREE from 'three'
import Omni from './Omni';
import Dream from './Dream';
import dreams from '../dreams/dreams';



export class Thunderdome {
    private _renderer: THREE.WebGLRenderer;
    readonly dreams: Record<string, Dream>;
    public omni: Omni;
    public dream: Dream;
    constructor () {
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
         * scene management
         *
         * premade scenes and (eventually) keeping physics separate
         */
        this.dreams = dreams;
        this.dream = dreams.default;
        this.dream.init();
        /**
         * camera controls and raycast picking
         *
         * on the fence about delegating this to its own class,
         * but in early concepts, the complexity grew quickly
         */
        this.omni = new Omni(this);
        /**
         * event listeners
         *
         * if being passed to callbacks, `this` needs to be explicitly bound
         * to be used within the context it is passed to
         */
        window.addEventListener('resize', this._onWindowResize.bind(this));
    }

    get renderer() {
        return this._renderer;
    }

    animate(_time: number): void {
        this._renderer.render(this.dream.scene, this.omni.camera);
    }

    _onWindowResize(): void {
        this._renderer.setSize(window.innerWidth, window.innerHeight);
    }
}