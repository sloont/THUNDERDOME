import * as THREE from 'three';
import Dream from '../core/Dream';
import {
    Thunderdome,
    THUNDERDOME_TILES,
    THUNDERDOME_TILE_SIZE,
    THUNDERDOME_SIZE,
} from '../core/Thunderdome';
import { PALETTE } from '../utils/colors';

export const dreamId = 'Boxing';
class Boxing extends Dream {

}
type TBlock = THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshLambertMaterial,
    THREE.Object3DEventMap
>
const PIECE_MATERIAL = {
    PINK: new THREE.MeshLambertMaterial({ color: 'd77bba' }),
    RED: new THREE.MeshLambertMaterial({ color: 'd95763' }),
    YELLOW: new THREE.MeshLambertMaterial({ color: 'fbf236' }),
    GREEN: new THREE.MeshLambertMaterial({ color: '37946e' }),
    TEAL: new THREE.MeshLambertMaterial({ color: '5fcde4' }),
    BLUE: new THREE.MeshLambertMaterial({ color: '5b6ee1' }),
    PURPLE: new THREE.MeshLambertMaterial({ color: '76428a' }),
}

/* LOCATION MAP
 * ◾◾◾◾@@◾◾◾◾ - 0
 * ◾◾◾@@◾◾◾◾◾ - 1
 * ◾◾◾◾◾◾◾◾◾◾ - 2
 * ◾◾◾◾◾◾◾◾◾◾ - 3
 * ◾◾◾◾◾◾◾◾◾◾ - 4
 * ◾◾◾◾◾◾◾◾◾◾ - 5
 * ◾◾◾◾◾◾◾◾◾@ - 6
 * ◾◾◾◾◾◾◾◾◾@ - 7
 * ◾◾◾◾@◾◾◾◾@ - 8
 * ◾◾◾@@@◾◾◾@ - 9
 */
class Block {
    _geometry = new THREE.BoxGeometry(THUNDERDOME_TILE_SIZE);
    _material: THREE.MeshLambertMaterial;
    _mesh: TBlock;
    _location: THREE.Vector3Like;
    constructor(material: THREE.MeshLambertMaterial, location: THREE.Vector3Like) {
        this._material = material;
        this._mesh = new THREE.Mesh(this._geometry, this._material);
        this._location = location
    }
}