import * as THREE from 'three'
import Dream from '../core/Dream';
import {
    Thunderdome,
    THUNDERDOME_TILES,
    THUNDERDOME_TILE_SIZE,
    THUNDERDOME_SIZE
} from '../core/Thunderdome';
import { PALETTE } from '../utils/colors';

type IntersectionWithFace = THREE.Intersection<THREE.Mesh> & { face: THREE.Face };
type BoxMesh = THREE.Mesh<THREE.BoxGeometry, THREE.Material, THREE.Object3DEventMap>;



export const dreamId = 'Testspace';
class Testspace extends Dream {
    private _hoverables: THREE.Mesh[] = [];
    private _hoverBox: BoxMesh;
    private _activeGeometry: THREE.BoxGeometry;
    private _activeMaterial: THREE.Material;
    private _pieces: Map<string, [THREE.BoxGeometry, THREE.Material]> = new Map();
    private _invisibleFloorPlane: THREE.Mesh;
    /**
     * key table
     *
     * 0b1 => 'Shift'
     */
    private _keysActive: number = 0;
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
        this._invisibleFloorPlane = new THREE.Mesh(floorGeometry, floorMaterial);
        this.scene.add(this._invisibleFloorPlane);
        this.hoverables.push(this._invisibleFloorPlane);

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
        this._hoverBox = new THREE.Mesh(hoverGeometry, hoverMaterial);
        this.scene.add(this._hoverBox);

        // grid
        const gridHelper = new THREE.GridHelper(THUNDERDOME_SIZE, THUNDERDOME_TILES, PALETTE.HIGHLIGHT, PALETTE.HIGHLIGHT);
        this.scene.add(gridHelper);

        // lighting
        const ambientLight = new THREE.AmbientLight(PALETTE.HIGHLIGHT, 2);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(PALETTE.HIGHLIGHT, 5);
        directionalLight.position.set(1, 0.75, 0.5).normalize();
        this.scene.add(directionalLight);

        // listeners
        document.addEventListener('mousemove', this._onMouseMove.bind(this));
        document.addEventListener('mousedown', this._onMouseDown.bind(this));
        document.addEventListener('keydown', this._onDocumentKeyDown.bind(this));
        document.addEventListener('keyup', this._onDocumentKeyUp.bind(this));

        // dummy
        this._activeGeometry = new THREE.BoxGeometry(
            THUNDERDOME_TILE_SIZE
        );
        this._activeMaterial = new THREE.MeshBasicMaterial({
            color: PALETTE.SECONDARY,
        });

        // pieces
        const tileGeometry = hoverGeometry;
        const tileMaterial = new THREE.MeshBasicMaterial({
            color: PALETTE.PRIMARY,
        })
        this._pieces.set('TILE', [tileGeometry, tileMaterial]);

        // don't use the dummy piece
        this.setActivePiece('TILE');
    }

    get hoverables() {
        return this._hoverables;
    }

    setActivePiece(key: string): void {
        const piece = this._pieces.get(key);
        if (!piece) {
            return;
        }
        this._activeGeometry = piece[0];
        this._activeMaterial = piece[1];
    }

    getFirstIntersection(meshGroup: THREE.Mesh[]): IntersectionWithFace | null {
        const intersection = this.thunderdome.omni.raycaster.intersectObjects(meshGroup, false)[0];

        if (!intersection?.face) {
            return null;
        }
        return intersection as IntersectionWithFace;
    }

    copyNewPosition(mesh: THREE.Mesh, intersection: IntersectionWithFace): void {
        const point = intersection.point;
        const normal = intersection.face.normal;
        // new position will be the intersection point with the first mesh hit
        mesh.position.copy(point)
        // build off of the face that was intersected
            .add(normal);
    }

    snapBoxMeshToGrid(mesh: BoxMesh): void {
        // ratio of sides stored as vector 3
        const { width, height, depth } = mesh.geometry.parameters;
        const ratioOfSides = new THREE.Vector3(width, height, depth);

        // scale down position
        mesh.position.divide(ratioOfSides)
            // make it smooth
            .floor()
            // scale back up
            .multiply(ratioOfSides)
            // snap to grid by adding an extra half of the mesh's bounds
            .add(ratioOfSides.divideScalar(2));
    }

    placePiece(intersection: IntersectionWithFace): void {
        const piece = new THREE.Mesh(this._activeGeometry, this._activeMaterial);
        this.copyNewPosition(piece, intersection);
        this.snapBoxMeshToGrid(piece);

        this.scene.add(piece);
        this.hoverables.push(piece);
    }

    _onMouseMove(event: MouseEvent): void {
        this.thunderdome.omni.onMouseMove(event);
        const intersection = this.getFirstIntersection(this.hoverables);

        if (intersection) {
            this.copyNewPosition(this._hoverBox, intersection);
            this.snapBoxMeshToGrid(this._hoverBox);
        }
    }

    _onMouseDown(event: MouseEvent): void {
        this.thunderdome.omni.onMouseMove(event);
        const intersection = this.getFirstIntersection(this.hoverables);
        if (!intersection) {
            return;
        }
        // is Shift being held?
        if (!(this._keysActive & 1)) {
            this.placePiece(intersection);
        } else if (intersection.object !== this._invisibleFloorPlane) {
            this.scene.remove(intersection.object);
            this.hoverables.splice(
                this.hoverables.indexOf(intersection.object),
                1
            );
        }
    }

    _onDocumentKeyDown(event: KeyboardEvent) {
        if (event.repeat) {
            return;
        }

        switch (event.key) {
            case 'Shift':
                this._keysActive |= 1;
                break;
        }
    }

    _onDocumentKeyUp(event: KeyboardEvent) {
        switch (event.key) {
            case 'Shift':
                this._keysActive = ~(~this._keysActive | 1);
        }
    }
}
export const Construct = Testspace;
