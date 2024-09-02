import * as THREE from 'three'
import Dream from '../core/Dream';
import {
    THUNDERDOME_TILES,
    THUNDERDOME_TILE_SIZE,
    THUNDERDOME_SIZE
} from '../core/Thunderdome';
import { PALETTE } from '../utils/colors';

const testspace = new Dream();

testspace.init = function (): void {
    testspace.scene.background = PALETTE.BACKGROUND;

    const floorGeometry = new THREE.PlaneGeometry(THUNDERDOME_SIZE, THUNDERDOME_SIZE)
        .rotateX(-Math.PI / 2);
    const floorMaterial = new THREE.MeshBasicMaterial({
        color: PALETTE.TERTIARY,
        opacity: 0.15,
        transparent: true
        // visible: false
    });
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    testspace.scene.add(floorMesh);

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
    testspace.scene.add(gridHelper);

    // lighting
    const ambientLight = new THREE.AmbientLight( PALETTE.HIGHLIGHT, 2 );
    testspace.scene.add( ambientLight );

    const directionalLight = new THREE.DirectionalLight( PALETTE.HIGHLIGHT, 5 );
    directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
    testspace.scene.add( directionalLight );
}

export default testspace;