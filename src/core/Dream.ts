import * as THREE from 'three';
import { Thunderdome } from './Thunderdome';
export default class Dream {
    readonly thunderdome: Thunderdome;
    private _scene: THREE.Scene;
    private _id: string;

    constructor(thunderdome: Thunderdome, id: string) {
        this.thunderdome = thunderdome;
        this._scene = this.thunderdome.scene;
        this._id = id;
    }

    get scene() {
        return this._scene;
    }

    get id() {
        return this._id;
    }
}

