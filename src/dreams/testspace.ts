import * as THREE from 'three'
import Dream from '../core/Dream';
import { THUNDERDOME_SIZE } from '../core/Thunderdome';
import { PALETTE } from '../utils/colors';

const testspace = new Dream();

testspace.init = function (): void {
    testspace.scene.background = PALETTE.BACKGROUND;

    const floorGeometry = new THREE.PlaneGeometry(1000, 1000)
        .rotateX(-Math.PI / 2);
    const floorMaterial = new THREE.MeshBasicMaterial({
        color: PALETTE.TERTIARY,
        // opacity: 0.15,
        // transparent: true
        visible: false
    });
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    testspace.scene.add(floorMesh);

    // grid
    const gridHelper = new THREE.GridHelper(1000, THUNDERDOME_SIZE, PALETTE.HIGHLIGHT, PALETTE.HIGHLIGHT);
    testspace.scene.add(gridHelper);

    // lighting
    const ambientLight = new THREE.AmbientLight( PALETTE.HIGHLIGHT, 2 );
    testspace.scene.add( ambientLight );

    const directionalLight = new THREE.DirectionalLight( PALETTE.HIGHLIGHT, 5 );
    directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
    testspace.scene.add( directionalLight );
}

export default testspace;