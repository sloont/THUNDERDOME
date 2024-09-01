import * as THREE from 'three';
import dreams from '../dreams/dreams';

import { Thunderdome } from './Thunderdome';

export default class Dreamer {
    readonly thunderdome: Thunderdome;
    readonly dreams: Record<string, THREE.Scene>;
    private _scene: THREE.Scene;

    constructor(thunderdome: Thunderdome) {
        this.thunderdome = thunderdome;
        this.dreams = dreams;
        this._scene = dreams.default;
    }

    get scene() {
        return this._scene;
    }
}