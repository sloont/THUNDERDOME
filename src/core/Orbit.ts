import {
    Controls,
    MOUSE,
    Quaternion,
    Spherical,
    Vector2,
    Vector3,
    Plane,
    Ray,
    MathUtils,
    Camera,
    OrthographicCamera,
    PerspectiveCamera,
    BaseEvent,
    EventDispatcher,
    Matrix4
} from 'three';

interface OrbitEvents {
    change: BaseEvent,
    start: BaseEvent,
    end: BaseEvent
}
const _changeEvent: BaseEvent<keyof OrbitEvents> = { type: 'change' };
const _startEvent: BaseEvent<keyof OrbitEvents> = { type: 'start' };
const _endEvent: BaseEvent<keyof OrbitEvents> = { type: 'end' };
const _ray = new Ray();
const _plane = new Plane();
const _TILT_LIMIT = Math.cos(70 * MathUtils.DEG2RAD);

const _v = new Vector3();
const _twoPI = 2 * Math.PI;

const _STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
};

const _EPS = 0.000001;

/* This class is an adaptation of the OrbitControls
 * example from Three.js.
 *
 * This class:
 *  - removes interactions from TouchEvents.
 *  - restricts movements unless a key is held.
 *  - is meant to be a mouse-only replacement for OrbitControls
 *
 * Controls:
 *  - Orbit - left mouse + ctrl
 *  - Zoom - middle mouse + ctrl
 *  - Pan - right mouse + ctrl
*/
export default class Orbit extends Controls<OrbitEvents> {
    state = _STATE.NONE;
    // false disables these controls
    enabled = true;
    // sets the location of focus/where the object orbits around
    target = new Vector3();
    // sets the 3D cursor for maxTargetRadius (like Blender cursor)
    cursor = new Vector3();
    // dolly in/out limits (Perspective only)
    minDistance = 0;
    maxDistance = Infinity;
    // zoom in/out limits (Orthographic only)
    minZoom = 0;
    maxZoom = Infinity;
    // limit target to a sphere around cursor
    minTargetRadius = 0;
    maxTargetRadius = Infinity;
    // bounds for vertical orbit
    minPolarAngle = 0;
    maxPolarAngle = Math.PI;
    // bounds for horizontal orbit
    // If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ],
    // with ( max - min < 2 PI )
    minAzimuthAngle = -Infinity;
    maxAzimuthAngle = Infinity;
    // enable damping (requires controls.update() in animation loop)
    enableDamping = false;
    dampingFactor = 0.05;
    // enable dollying
    enableDolly = true;
    dollySpeed = 1.0;
    // enable rotation
    enableRotate = true;
    rotateSpeed = 1.0;
    // enable panning
    enablePan = true;
    panSpeed = 1.0;
    // if false, pan orthogonal to world-space direction camera.up
    screenSpacePanning = true;
    // pixels moved per arrow key push
    keyPanSpeed = 7.0;
    zoomToCursor = false;
    // enable automatically rotating around target
    // (requires controls.update() in animation loop)
    autoRotate = false;
    // 30s/orbit @ 60fps
    autoRotateSpeed = 2.0;
    // arrow key lookup
    keys = {
        LEFT: 'ArrowLeft',
        UP: 'ArrowUp',
        RIGHT: 'ArrowRight',
        DOWN: 'ArrowDown',
    };
    // mouse button lookup
    mouseButtons = {
        LEFT: MOUSE.ROTATE,
        MIDDLE: MOUSE.DOLLY,
        RIGHT: MOUSE.PAN,
    };
    // properties used for reset()
    target0: Vector3;
    position0: Vector3;
    zoom0: number;
    // DOM element used for key events
    private _domElementKeyEvents: HTMLElement | null = null;
    // internal use
    private _lastPosition = new Vector3();
    private _lastQuaternion = new Quaternion();
    private _lastTargetPosition = new Vector3();
    // for defining the orbit axis
    private _quat: Quaternion;
    private _quatInverse: Quaternion;
    // current position in spherical coordinates
    private _spherical = new Spherical();
    private _sphericalDelta = new Spherical();
    // scale
    private _scale = 1;
    // rotate records
    private _rotateStart = new Vector2();
    private _rotateEnd = new Vector2();
    private _rotateDelta = new Vector2();
    // pan records
    private _panOffset = new Vector3();
    private _panStart = new Vector2();
    private _panEnd = new Vector2();
    private _panDelta = new Vector2();
    // dolly records
    private _dollyDirection = new Vector3();
    private _dollyStart = new Vector2();
    private _dollyEnd = new Vector2();
    private _dollyDelta = new Vector2();
    // mouse record
    private _mouse = new Vector2();
    private _performCursorZoom = false;
    // CTRL boolean
    private _ctrlActive = false;

    object: PerspectiveCamera | OrthographicCamera;

    constructor(object: PerspectiveCamera | OrthographicCamera, domElement: HTMLElement | null = null) {
        super(object, domElement);
        // only allow Perspective and Orthographic Camera
        this.object = object;
        // set properties used for reset();
        this.target0 = this.target.clone();
        this.position0 = this.object.position.clone();
        this.zoom0 = this.object.zoom;

        // ensure camera.up is the orbit axis
        this._quat = new Quaternion().setFromUnitVectors(object.up, new Vector3(0, 1, 0));
        this._quatInverse = this._quat.clone().invert();

        // connect Orbit to DOM element if it exists
        if (this.domElement !== null) {
            this.connect();
        }

        // event listeners
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onMouseWheel = this._onMouseWheel.bind(this);
        this._onContextMenu = this._onContextMenu.bind(this);
        this._interceptControlDown = this._interceptControlDown.bind(this);
        this._interceptControlUp = this._interceptControlUp.bind(this);
    }

    connect(): void {
        if (!this.domElement) {
            return;
        }
        this.domElement.addEventListener('mousedown', this._onMouseDown);
        this.domElement.addEventListener('mouseup', this._onMouseUp);
        this.domElement.addEventListener('contextmenu', this._onContextMenu);
        this.domElement.addEventListener(
            'wheel',
            this._onMouseWheel,
            { passive: false }
        );
        // offscreen canvas compatibility
        const document = this.domElement.getRootNode();
        document.addEventListener(
            'keydown',
            this._interceptControlDown as EventListener,
            { passive: true, capture: true }
        );
        // no touch controls, but disable touch scroll
        this.domElement.style.touchAction = 'none';
    }

    disconnect(): void {
        if (!this.domElement) {
            return;
        }
        this.domElement.removeEventListener('mousedown', this._onMouseDown);
        this.domElement.removeEventListener('mouseup', this._onMouseUp);
        this.domElement.removeEventListener('mousemove', this._onMouseMove);
        this.domElement.removeEventListener('wheel', this._onMouseWheel);
        this.domElement.removeEventListener('contextmenu', this._onContextMenu);

        // offscreen canvas compatibility
        const document = this.domElement.getRootNode();
        document.removeEventListener(
            'keydown',
            this._interceptControlDown as EventListener,
            { capture: true }
        );
        // no touch controls, but re-enable touch scroll
        this.domElement.style.touchAction = 'auto';
    }

    dispose(): void {
        this.disconnect();
    }

    getPolarAngle(): number {
        return this._spherical.phi;
    }

    getAzimuthalAngle(): number {
        return this._spherical.theta;
    }

    getDistance(): number {
        return this.object.position.distanceTo(this.target);
    }

    saveState(): void {
        this.target0.copy(this.target);
        this.position0.copy(this.object.position);
        this.zoom0 = this.object.zoom;
    }

    reset(): void {
        this.target.copy(this.target0);
        this.object.position.copy(this.position0);
        this.object.zoom = this.zoom0;

        this.object.updateProjectionMatrix();
        this.dispatchEvent(_changeEvent);

        this.update();
        this.state = _STATE.NONE;
    }

    update(deltaTime: number | null = null): boolean {
        const position = this.object.position;
        _v.copy(position).sub(this.target);
        // rotate offset to "y-axis-is-up" space
        _v.applyQuaternion(this._quat);
        // angle from z-axis around y-axis
        this._spherical.setFromVector3(_v);
        if (this.autoRotate && this.state === _STATE.NONE) {
            this._rotateLeft(this._getAutoRotationAngle(deltaTime));
        }
        if (this.enableDamping) {
            this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor;
            this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor;
        } else {
            this._spherical.theta += this._sphericalDelta.theta;
            this._spherical.phi += this._sphericalDelta.phi;
        }
        // restrict theta to be between desired limits
        let min = this.minAzimuthAngle;
        let max = this.maxAzimuthAngle;
        if (isFinite(min) && isFinite(max)) {
            min += min < -Math.PI ? _twoPI : -_twoPI;
            max += max < -Math.PI ? _twoPI : -_twoPI;
            if (min <= max) {
                this._spherical.theta = Math.max(min, Math.min(max, this._spherical.theta));
            } else {
                this._spherical.theta =
                    this._spherical.theta > (min + max) / 2 ?
                        Math.max(min, this._spherical.theta) :
                        Math.min(max, this._spherical.theta);
            }
        }
        // restrict phi to be between desired limits
        this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi));
        this._spherical.makeSafe();
        // move target to panned location
        if (this.enableDamping) {
            this.target.addScaledVector(this._panOffset, this.dampingFactor);
        } else {
            this.target.add(this._panOffset);
        }
        // limit the target distance from the cursor to create a sphere around the center of interest
        this.target.sub(this.cursor);
        this.target.clampLength(this.minTargetRadius, this.maxTargetRadius);
        this.target.add(this.cursor);

        let zoomChanged = false;
        // adjust the camera position based on zoom only if we're not zooming to the cursor or
        // if it's an ortho camera - we adjust zoom later in these cases
        if (this.zoomToCursor && this._performCursorZoom || this.object instanceof OrthographicCamera) {
            this._spherical.radius = this._clampDistance(this._spherical.radius);
        } else {
            const prevRadius = this._spherical.radius;
            this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale);
            zoomChanged = prevRadius !== this._spherical.radius;
        }

        _v.setFromSpherical(this._spherical);
        // rotate offset back to "camera-up-vector-is-up" space
        _v.applyQuaternion(this._quatInverse);
        position.copy(this.target).add(_v);
        this.object.lookAt(this.target);
        if (this.enableDamping) {
            this._sphericalDelta.theta *= (1 - this.dampingFactor);
            this._sphericalDelta.phi *= (1 - this.dampingFactor);
            this._panOffset.multiplyScalar(1 - this.dampingFactor);
        } else {
            this._sphericalDelta.set(0, 0, 0);
            this._panOffset.set(0, 0, 0);
        }
        // adjust camera position
        if (this.zoomToCursor && this._performCursorZoom) {
            let newRadius = null;
            if (this.object instanceof PerspectiveCamera) {
                // move the camera down the pointer ray
                // this method avoids floating point error
                const prevRadius = _v.length();
                newRadius = this._clampDistance(prevRadius * this._scale);
                const radiusDelta = prevRadius - newRadius;
                this.object.position.addScaledVector(this._dollyDirection, radiusDelta);
                this.object.updateMatrixWorld();
                zoomChanged = !!radiusDelta;
            } else if (this.object instanceof OrthographicCamera) {
                // adjust the ortho camera position based on zoom changes
                const mouseBefore = new Vector3(this._mouse.x, this._mouse.y, 0);
                mouseBefore.unproject(this.object);
                const prevZoom = this.object.zoom;
                this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale));
                this.object.updateProjectionMatrix();
                zoomChanged = prevZoom !== this.object.zoom;
                const mouseAfter = new Vector3(this._mouse.x, this._mouse.y, 0);
                mouseAfter.unproject(this.object);
                this.object.position.sub(mouseAfter).add(mouseBefore);
                this.object.updateMatrixWorld();
                newRadius = _v.length();
            } else {
                console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.' );
                this.zoomToCursor = false;
            }
            // handle the placement of the target
            if (newRadius) {
                if (this.screenSpacePanning) {
                    // position the orbit target in front of the new camera position
                    this.target.set(0, 0, -1)
                        .transformDirection(this.object.matrix)
                        .multiplyScalar(newRadius)
                        .add(this.object.position);
                } else {
                    // get the ray and translation plane to compute target
                    _ray.origin.copy(this.object.position);
                    _ray.direction.set(0, 0, -1)
                        .transformDirection(this.object.matrix);
                    // if the camera is 20 degrees above the horizon then
                    // don't adjust the focus target to avoid extremely large values
                    if (Math.abs(this.object.up.dot(_ray.direction)) < _TILT_LIMIT) {
                        this.object.lookAt(this.target);
                    } else {
                        _plane.setFromNormalAndCoplanarPoint(this.object.up, this.target);
                        _ray.intersectPlane(_plane, this.target);
                    }
                }
            }
        } else if (this.object instanceof OrthographicCamera) {
            const prevZoom = this.object.zoom;
            this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom));
            if (prevZoom !== this.object.zoom) {
                this.object.updateProjectionMatrix();
                zoomChanged = true;
            }
        }
        // reset values
        this._scale = 1;
        this._performCursorZoom = false;

        // update condition is:
        // min(camera displacement, camera rotation radians)^2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8
        if (
            zoomChanged ||
            this._lastPosition.distanceToSquared(this.object.position) > _EPS ||
            8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > _EPS ||
            this._lastTargetPosition.distanceToSquared(this.target) > _EPS
        ) {
            this.dispatchEvent(_changeEvent);
            this._lastPosition.copy(this.object.position);
            this._lastQuaternion.copy(this.object.quaternion);
            this._lastTargetPosition.copy(this.target);
            return true;
        }
        return false;
    }

    private _getAutoRotationAngle(deltaTime: number | null): number {
        if (deltaTime) {
            return (_twoPI / 60 * this.autoRotateSpeed) * deltaTime;
        }
        return _twoPI / 60 / 60 * this.autoRotateSpeed;
    }

    private _getDollyScale(delta: number): number {
        const normalizedDelta = Math.abs(delta * 0.01);
        return Math.pow(0.95, this.dollySpeed * normalizedDelta)
    }

    private _rotateLeft(angle: number): void {
        this._sphericalDelta.theta -= angle;
    }

    private _rotateUp(angle: number): void {
        this._sphericalDelta.phi -= angle;
    }

    private _panLeft(distance: number, objectMatrix: Matrix4): void {
        // get X column of objectMatrix
        _v.setFromMatrixColumn(objectMatrix, 0);
        _v.multiplyScalar(-distance);
        this._panOffset.add(_v);
    }

    private _panUp(distance: number, objectMatrix: Matrix4): void {
        if (this.screenSpacePanning) {
            _v.setFromMatrixColumn(objectMatrix, 1);
        } else {
            _v.setFromMatrixColumn(objectMatrix, 0);
            _v.crossVectors(this.object.up, _v);
        }

        _v.multiplyScalar(distance);
        this._panOffset.add(_v);
    }

    private _pan(deltaX: number, deltaY: number): void {
        const element = this.domElement;
        if (!element) {
            return;
        }
        if (this.object instanceof PerspectiveCamera) {
            const position = this.object.position;
            _v.copy(position).sub(this.target);
            let targetDistance = _v.length();
            // half of the fov is center to top of screen
            targetDistance *= Math.tan((this.object.fov / 2) * Math.PI / 180.0);
            // only use clientHeight here so aspect ratio does not distort speed
            this._panLeft(2 * deltaX * targetDistance / element.clientHeight, this.object.matrix);
            this._panUp(2 * deltaY * targetDistance / element.clientHeight, this.object.matrix);
        } else if (this.object instanceof OrthographicCamera) {
            this._panLeft(deltaX * (this.object.right - this.object.left) / this.object.zoom / element.clientWidth, this.object.matrix);
            this._panUp(deltaY * (this.object.top - this.object.bottom) / this.object.zoom / element.clientHeight, this.object.matrix);
        } else {
            // camera neither orthographic nor perspective
            console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
            this.enablePan = false;
        }
    }

    private _dollyOut(dollyScale: number): void {
        if (this.object instanceof OrthographicCamera || this.object instanceof PerspectiveCamera) {
            this._scale /= dollyScale;
        } else {
            console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
            this.enableDolly = false;
        }
    }

    private _dollyIn(dollyScale: number): void {
        if (this.object instanceof OrthographicCamera || this.object instanceof PerspectiveCamera) {
            this._scale *= dollyScale;
        } else {
            console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
            this.enableDolly = false;
        }
    }

    private _updateZoomParameters(x: number, y: number): void {
        const element = this.domElement;
        if (!this.zoomToCursor || !element) {
            return;
        }
        this._performCursorZoom = true;
        const rect = element.getBoundingClientRect();
        const dx = x - rect.left;
        const dy = y - rect.top;
        const w = rect.width;
        const h = rect.height;

        this._mouse.x = (dx / w) * 2 - 1;
        this._mouse.y = (dy / h) * -2 + 1;
        this._dollyDirection.set(this._mouse.x, this._mouse.y, 1)
            .unproject(this.object)
            .sub(this.object.position)
            .normalize();
    }

    private _clampDistance(distance: number): number {
        return Math.max(this.minDistance, Math.min(this.maxDistance, distance));
    }

    // event listener callbacks
    private _handleMouseDownRotate(event: MouseEvent): void {
        this._rotateStart.set(event.clientX, event.clientY);
    }

    private _handleMouseDownDolly(event: MouseEvent): void {
        this._updateZoomParameters(event.clientX, event.clientX);
        this._dollyStart.set(event.clientX, event.clientY);
    }

    private _handleMouseDownPan(event: MouseEvent): void {
        this._panStart.set(event.clientX, event.clientY);
    }

    private _handleMouseMoveRotate(event: MouseEvent): void {
        const element = this.domElement;
        if (!element) {
            return;
        }
        this._rotateEnd.set(event.clientX, event.clientY);
        this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart)
            .multiplyScalar(this.rotateSpeed);
        // yes, use height
        this._rotateLeft(_twoPI * this._rotateDelta.x / element.clientHeight);
        this._rotateUp(_twoPI * this._rotateDelta.y / element.clientHeight);
        this._rotateStart.copy(this._rotateEnd);
        this.update();
    }

    private _handleMouseMoveDolly(event: MouseEvent): void {
        this._dollyEnd.set(event.clientX, event.clientY);
        this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart);
        if (this._dollyDelta.y > 0) {
            this._dollyOut(this._getDollyScale(this._dollyDelta.y));
        } else if (this._dollyDelta.y < 0) {
            this._dollyIn(this._getDollyScale(this._dollyDelta.y));
        }
        this._dollyStart.copy(this._dollyEnd);
        this.update();
    }

    private _handleMouseMovePan(event: MouseEvent): void {
        this._panEnd.set(event.clientX, event.clientY);
        this._panDelta.subVectors(this._panEnd, this._panStart)
            .multiplyScalar(this.panSpeed);
        this._pan(this._panDelta.x, this._panDelta.y);
        this._panStart.copy(this._panEnd);
        this.update();
    }

    private _handleMouseWheel(event: {
        clientX: number,
        clientY: number,
        deltaY: number
    }): void {
        this._updateZoomParameters(event.clientX, event.clientY);
        if (event.deltaY < 0) {
            this._dollyIn(this._getDollyScale(event.deltaY));
        } else if (event.deltaY > 0) {
            this._dollyOut(this._getDollyScale(event.deltaY));
        }
        this.update();
    }

    private _customWheelEvent(event: WheelEvent): {
        clientX: number,
        clientY: number,
        deltaY: number
    } {
        const mode = event.deltaMode;
        // minimal wheel event altered to meet delta-zoom demand
        const newEvent = {
            clientX: event.clientX,
            clientY: event.clientY,
            deltaY: event.deltaY
        };
        switch (mode) {
            case 1: // LINE_MODE
                newEvent.deltaY *= 16;
                break;
            case 2: // PAGE_MODE
                newEvent.deltaY *= 100;
                break;
        }

        return newEvent;
    }

    private _onMouseDown(event: MouseEvent): void {
        let mouseAction: number;
        switch (event.button) {
            case 0:
                mouseAction = this.mouseButtons.LEFT;
                break;
            case 1:
                mouseAction = this.mouseButtons.MIDDLE;
                break;
            case 2:
                mouseAction = this.mouseButtons.RIGHT;
                break;
            default:
                mouseAction = -1;
        }
        switch (mouseAction) {
            case MOUSE.DOLLY:
                if (!this.enableDolly) {
                    return;
                }
                this._handleMouseDownDolly(event);
                this.state = _STATE.DOLLY;
                break;
            case MOUSE.ROTATE:
                if (!this.enableRotate) {
                    return;
                }
                this._handleMouseDownRotate(event);
                this.state = _STATE.ROTATE;
                break;
            case MOUSE.PAN:
                if (!this.enablePan) {
                    return;
                }
                this._handleMouseDownPan(event);
                this.state = _STATE.PAN;
                break;
            default:
                this.state = _STATE.NONE;
        }

        if (this.state !== _STATE.NONE) {
            this.dispatchEvent(_startEvent)
        }
    }

    private _onMouseUp(event: MouseEvent): void {
        if (this.state === _STATE.NONE) {
            return;
        }
        this.dispatchEvent(_endEvent);
        this.state = _STATE.NONE;
    }

    private _onMouseMove(event: MouseEvent): void {
        switch (this.state) {
            case _STATE.ROTATE:
                if (!this.enableRotate) {
                    return;
                }
                this._handleMouseMoveRotate(event);
                break;
            case _STATE.DOLLY:
                if (!this.enableDolly) {
                    return;
                }
                this._handleMouseMoveDolly(event);
                break;
            case _STATE.PAN:
                if (!this.enablePan) {
                    return;
                }
                this._handleMouseMovePan(event);
                break;
        }
    }

    private _onMouseWheel(event: WheelEvent): void {
        if (
            !this.enabled ||
            !this.enableDolly ||
            this.state === _STATE.NONE
        ) {
            return;
        }
        event.preventDefault();
        this.dispatchEvent(_startEvent);
        this._handleMouseWheel(this._customWheelEvent(event));
        this.dispatchEvent(_endEvent);
    }

    private _onContextMenu(event: MouseEvent): void {
        if (!this.enabled) {
            return;
        }
        event.preventDefault();
    }

    private _interceptControlDown(event: KeyboardEvent): void{
        if (!this.domElement) {
            return;
        }
        if (event.key === 'Control') {
            this._ctrlActive = true;
            // offscreen canvas compatibility
            const document = this.domElement.getRootNode();
            document.addEventListener(
                'keyup',
                this._interceptControlUp as EventListener,
                { passive: true, capture: true }
            );
        }
    }

    private _interceptControlUp(event: KeyboardEvent): void {
        if (!this.domElement) {
            return;
        }
        if (event.key === 'Control') {
            this._ctrlActive = false;
            // offscreen canvas compatibility
            const document = this.domElement.getRootNode();
            document.removeEventListener(
                'keyup',
                this._interceptControlUp as EventListener,
                { capture: true }
            );
        }
    }
}
