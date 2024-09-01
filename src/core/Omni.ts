import * as THREE from 'three';
import { Thunderdome } from './Thunderdome';

export default class Omni {
    readonly thunderdome: Thunderdome;
    private _camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    private _raycaster: THREE.Raycaster;
    private _pointer = new THREE.Vector2();

    constructor(thunderdome: Thunderdome) {
        this.thunderdome = thunderdome;
        // TODO: extract camera creation to its own method so camera is configurable/swappable
        this._camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000 );
        this._camera.position.set(1000, 600, 1000);
        this._camera.lookAt(0, 0, 0);

        this._raycaster = new THREE.Raycaster();
    }

    get camera() {
        return this._camera;
    }

    get raycaster() {
        return this._raycaster;
    }
}