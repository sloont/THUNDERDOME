import * as THREE from 'three';
import { Thunderdome } from './Thunderdome';
export default class Dream {
    readonly thunderdome: Thunderdome;
    private _scene: THREE.Scene;
    private _id: string;

    constructor(thunderdome: Thunderdome, id: string, init: (this: Dream) => void) {
        this.thunderdome = thunderdome;
        this._scene = this.thunderdome.scene;

        this._id = id;

        this._init = init;
        this._init();
    }

    _init(this: Dream): void {}

    get scene() {
        return this._scene;
    }

    get id() {
        return this._id;
    }
}

