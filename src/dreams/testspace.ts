import * as THREE from 'three'
import Dream from '../core/Dream';
import {
    Thunderdome,
    THUNDERDOME_TILES,
    THUNDERDOME_TILE_SIZE,
    THUNDERDOME_SIZE
} from '../core/Thunderdome';
import { PALETTE } from '../utils/colors';

export const dreamId = 'Testspace';
class Testspace extends Dream {
    constructor(thunderdome: Thunderdome) {
        super(thunderdome, 'Testspace');
        this.scene.background = PALETTE.BACKGROUND;

        const floorGeometry = new THREE.PlaneGeometry(THUNDERDOME_SIZE, THUNDERDOME_SIZE)
            .rotateX(-Math.PI / 2);
        const floorMaterial = new THREE.MeshBasicMaterial({
            color: PALETTE.TERTIARY,
            opacity: 0.15,
            transparent: true
            // visible: false
        });
        const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        this.scene.add(floorMesh);

        // tile geometry (should relocate)
        const hoverGeometry = new THREE.BoxGeometry(
            THUNDERDOME_TILE_SIZE,
            THUNDERDOME_TILE_SIZE,
            THUNDERDOME_TILE_SIZE
        );
        const hoverMaterial = new THREE.MeshBasicMaterial({
            color: PALETTE.SECONDARY,
            opacity: 0.3,
            transparent: true,
        });

        // grid
        const gridHelper = new THREE.GridHelper(THUNDERDOME_SIZE, THUNDERDOME_TILES, PALETTE.HIGHLIGHT, PALETTE.HIGHLIGHT);
        this.scene.add(gridHelper);

        // lighting
        const ambientLight = new THREE.AmbientLight( PALETTE.HIGHLIGHT, 2 );
        this.scene.add( ambientLight );

        const directionalLight = new THREE.DirectionalLight( PALETTE.HIGHLIGHT, 5 );
        directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
        this.scene.add( directionalLight );
    }
}
export const Construct = Testspace; 
