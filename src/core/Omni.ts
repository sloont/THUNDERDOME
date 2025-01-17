import * as THREE from 'three';
import { Thunderdome, THUNDERDOME_SIZE } from './Thunderdome';
import Orbit from './Orbit';

export default class Omni {
    readonly thunderdome: Thunderdome;
    private _camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    get camera() {
        return this._camera;
    }
    private _raycaster: THREE.Raycaster;
    get raycaster() {
        return this._raycaster;
    }
    private _pointer = new THREE.Vector2();
    get pointer() {
        return this._pointer;
    }
    controls: Orbit;

    constructor(thunderdome: Thunderdome) {
        this.thunderdome = thunderdome;
        // TODO: extract camera creation to its own method so camera is configurable/swappable
        this._camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000 );
        this._camera.position.set(
            THUNDERDOME_SIZE,
            THUNDERDOME_SIZE * 0.6,
            THUNDERDOME_SIZE
        );
        this._camera.lookAt(0, 0, 0);

        // orbit controls (camera)
        this.controls = new Orbit(this.camera, thunderdome.renderer.domElement);
        // this.controls.listenToKeyEvents(window)

        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 1000;
        this.controls.maxDistance = 3000;
        this.controls.maxPolarAngle = Math.PI / 2;

        this._raycaster = new THREE.Raycaster();
    }

    private _setPointer(clientX: number, clientY: number): void {
        this.pointer.set(
            (clientX / window.innerWidth) * 2 - 1,
            (clientY / window.innerHeight) * -2 + 1
        );
        this.raycaster.setFromCamera(this.pointer, this.camera)
    }

    onMouseMove(event: MouseEvent): void {
        this._setPointer(event.clientX, event.clientY);
    }
}