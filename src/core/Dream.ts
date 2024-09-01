import * as THREE from 'three';

export default class Dream {
    private _scene: THREE.Scene;

    constructor() {
        this._scene = new THREE.Scene();
    }

    init(): void {}

    get scene() {
        return this._scene;
    }
}