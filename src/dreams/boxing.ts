import * as THREE from 'three';
import {
    Thunderdome,
    THUNDERDOME_TILES,
    THUNDERDOME_TILE_SIZE,
    THUNDERDOME_SIZE,
    THUNDERDOME_BLOCK_GEOMETRY,
} from '../core/Thunderdome';
import Dream from '../core/Dream';
import { PALETTE } from '../utils/colors';

type TBlock = THREE.Mesh<
THREE.BoxGeometry,
THREE.MeshLambertMaterial,
THREE.Object3DEventMap
>
// const PIECE_ID =[
//     "I" ,
//     "O" ,
//     "T" ,
//     "S" ,
//     "Z" ,
//     "J" ,
//     "L"
// ] as const;

export const dreamId = 'Boxing';
export class Boxing extends Dream {
    constructor(thunderdome: Thunderdome) {
        super(thunderdome, 'Boxing');
        this.scene.background = PALETTE.BACKGROUND;
        // grid
        const gridHelper = new THREE.GridHelper(THUNDERDOME_SIZE, THUNDERDOME_TILES, PALETTE.HIGHLIGHT, PALETTE.HIGHLIGHT);
        this.scene.add(gridHelper);

        // lighting
        const ambientLight = new THREE.AmbientLight(PALETTE.HIGHLIGHT, 2);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(PALETTE.HIGHLIGHT, 5);
        directionalLight.position.set(1, 0.75, 0.5).normalize();
        this.scene.add(directionalLight);

        let i = Math.floor(Math.random() * 7)
        let piece = new Piece((Object.keys(PIECE_MAP)[i]) as keyof typeof PIECE_MAP);
        for (let block of piece.blocks) {
            this.scene.add(block._mesh);
        }
    }
}

const PIECE_MATERIAL = {
    PINK: new THREE.MeshLambertMaterial({ color: '#d77bba' }),
    RED: new THREE.MeshLambertMaterial({ color: '#d95763' }),
    YELLOW: new THREE.MeshLambertMaterial({ color: '#fbf236' }),
    GREEN: new THREE.MeshLambertMaterial({ color: '#37946e' }),
    TEAL: new THREE.MeshLambertMaterial({ color: '#5fcde4' }),
    BLUE: new THREE.MeshLambertMaterial({ color: '#5b6ee1' }),
    PURPLE: new THREE.MeshLambertMaterial({ color: '#76428a' }),
    DUMMY: new THREE.MeshLambertMaterial({ color: PALETTE.HIGHLIGHT }),
}

/* LOCATION MAP
 *
 * ◻ ◻ ◻ ◻ ◼ ◼ ◻ ◻ ◻ ◻  - 0
 * ◻ ◻ ◻ ◼ ◼ ◻ ◻ ◻ ◻ ◻  - 1
 * ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻  - 2
 * ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻  - 3
 * ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻  - 4
 * ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻  - 5
 * ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◼  - 6
 * ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◼  - 7
 * ◻ ◻ ◻ ◻ ◼ ◻ ◻ ◻ ◻ ◼  - 8
 * ◻ ◻ ◻ ◼ ◼ ◼ ◻ ◻ ◻ ◼  - 9
 */

class Block {
    _geometry = THUNDERDOME_BLOCK_GEOMETRY;
    _material: THREE.MeshLambertMaterial;
    _mesh: TBlock;
    _location: { x: number, y: number, z: number };
    constructor(material: THREE.MeshLambertMaterial, location: { x: number, y: number, z: number }) {
        this._material = material;
        this._mesh = new THREE.Mesh(this._geometry, this._material);
        const { x, y, z } = this._location = location;
        this._mesh.position.set(x, y, z)
            .multiplyScalar(THUNDERDOME_TILE_SIZE);
            console.log(this._mesh.position);
    }
    move(direction: THREE.Vector3Like): void {
        const { x, y, z } = direction;
        this._location.x = x;
        this._location.y = y;
        this._location.z = z;
    }
}
// ▣  is [ 0, 0 ]
const PIECE_MAP = {
    /*
     * I
     * ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻ ◻
     * ◻ ◻ ◻ ◼ ▣ ◼ ◼ ◻ ◻ ◻
     */
    I: {
        guide: [[-1, 0], [1, 0], [2, 0]],
        material: PIECE_MATERIAL.TEAL,
    },
    /**
     * O
     * ◻ ◻ ◻ ◻ ◼ ◼ ◻ ◻ ◻ ◻
     * ◻ ◻ ◻ ◻ ▣ ◼ ◻ ◻ ◻ ◻
    */
    O: {
        guide: [[0, -1], [1, -1], [1, 0]],
        material: PIECE_MATERIAL.YELLOW,
    },
    /**
     * T
     * ◻ ◻ ◻ ◻ ◼ ◻ ◻ ◻ ◻ ◻
     * ◻ ◻ ◻ ◼ ▣ ◼ ◻ ◻ ◻ ◻
    */
    T: {
        guide: [[-1, 0], [0, -1], [1, -1]],
        material: PIECE_MATERIAL.PURPLE,
    },
    /**
     * S
     * ◻ ◻ ◻ ◻ ◼ ◼ ◻ ◻ ◻ ◻
     * ◻ ◻ ◻ ◼ ▣ ◻ ◻ ◻ ◻ ◻
    */
    S: {
        guide: [[-1, 0], [0, -1], [1, -1]],
        material: PIECE_MATERIAL.GREEN,
    },
    /**
     * Z
     * ◻ ◻ ◻ ◼ ◼ ◻ ◻ ◻ ◻ ◻
     * ◻ ◻ ◻ ◻ ▣ ◼ ◻ ◻ ◻ ◻
    */
    Z: {
        guide: [[-1, -1], [0, -1], [1, 0]],
        material: PIECE_MATERIAL.RED,
    },
    /**
     * J
     * ◻ ◻ ◻ ◼ ◻ ◻ ◻ ◻ ◻ ◻
     * ◻ ◻ ◻ ◼ ▣ ◼ ◻ ◻ ◻ ◻
    */
    J: {
        guide: [[-1, 0], [-1, -1], [1, 0]],
        material: PIECE_MATERIAL.BLUE,
    },
    /**
     * L
     * ◻ ◻ ◻ ◻ ◻ ◼ ◻ ◻ ◻ ◻
     * ◻ ◻ ◻ ◼ ▣ ◼ ◻ ◻ ◻ ◻
    */
    L: {
        guide: [[-1, 0], [1, -1], [1, 0]],
        material: PIECE_MATERIAL.PINK,
    },

} as const;

/**
 * The shape as it is being dropped.
 *
 * Destroyed when placed.
 */
class Piece {
    id: keyof typeof PIECE_MAP;
    start = { x: 5, y: 1, z: 0 };
    blocks = Array<Block>(4);
    constructor(id: keyof typeof PIECE_MAP) {
        this.id = id;
        const data = PIECE_MAP[this.id];
        for (let i = 0; i <= 3; i++) {
            let location = this.start;
            let material = PIECE_MATERIAL.DUMMY;
            if (i > 0) {
                location.x += data.guide[i - 1][0];
                location.y += data.guide[i - 1][1];
                material = data.material;
            }
            this.blocks[i] = new Block(material, location);
            console.log(location);
        }
    }
}