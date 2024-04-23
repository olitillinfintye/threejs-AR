/* eslint-disable import/no-unresolved */
/// Zappar for ThreeJS Examples
/// Launch URL

// In this image tracked example we'll use a THREE.Raycaster to detect if
// the user has tapped a button that's tracked on the image. When they do
// we'll launch a website in a new tab.

import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import * as ZapparThree from '@zappar/zappar-threejs';
import './index.css'

const targetImage = new URL('./assets/example-tracking-image.zpt', import.meta.url).href;

interface ObjectCallbackPair {
    object: THREE.Object3D,
    callback: Function
}

// This class uses a THREE.Raycaster to detect when a user taps on
// an object in 3D space. You can use `addMouseDownListener` to
// register an object for callbacks when it's tapped.

class InteractionHelper {
    private camera: THREE.Camera;

    private raycaster = new THREE.Raycaster();

    private mouse: THREE.Vector2 = new THREE.Vector2();

    private domElement : HTMLCanvasElement;

    private objectCallbackPairs: ObjectCallbackPair[] = [];

    constructor(camera: THREE.Camera, renderer: THREE.Renderer) {
      this.domElement = renderer.domElement;
      this.domElement.addEventListener('mousedown', this.search, false);
      this.camera = camera;
    }

    public addMouseDownListener = (object: THREE.Object3D, callback: Function): void => {
      this.objectCallbackPairs.push({
        object,
        callback,
      });
      // accept an object and a callback pair and s tore it for our search function
    }

    private search = (event: MouseEvent): void => {
      // Set our Raycaster to point down the camera where the user tapped
      this.mouse.x = (event.clientX / this.domElement.clientWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / this.domElement.clientHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // eslint-disable-next-line no-restricted-syntax
      for (const pair of this.objectCallbackPairs) {
        const intersections = this.raycaster.intersectObject(pair.object);
        if (intersections.length > 0) pair.callback();
      }
    }
}

// The SDK is supported on many different browsers, but there are some that
// don't provide camera access. This function detects if the browser is supported
// For more information on support, check out the readme over at
// https://www.npmjs.com/package/@zappar/zappar-threejs
if (ZapparThree.browserIncompatible()) {
  // The browserIncompatibleUI() function shows a full-page dialog that informs the user
  // they're using an unsupported browser, and provides a button to 'copy' the current page
  // URL so they can 'paste' it into the address bar of a compatible alternative.
  ZapparThree.browserIncompatibleUI();

  // If the browser is not compatible, we can avoid setting up the rest of the page
  // so we throw an exception here.
  throw new Error('Unsupported browser');
}

// ZapparThree provides a LoadingManager that shows a progress bar while
// the assets are downloaded. You can use this if it's helpful, or use
// your own loading UI - it's up to you :-)
const manager = new ZapparThree.LoadingManager();

// Construct our ThreeJS renderer and scene as usual
const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();
document.body.appendChild(renderer.domElement);

// As with a normal ThreeJS scene, resize the canvas if the window resizes
renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create a Zappar camera that we'll use instead of a ThreeJS camera
const camera = new ZapparThree.Camera();

// In order to use camera and motion data, we need to ask the users for permission
// The Zappar library comes with some UI to help with that, so let's use it
ZapparThree.permissionRequestUI().then((granted) => {
  // If the user granted us the permissions we need then we can start the camera
  // Otherwise let's them know that it's necessary with Zappar's permission denied UI
  if (granted) camera.start();
  else ZapparThree.permissionDeniedUI();
});

// The Zappar component needs to know our WebGL context, so set it like this:
ZapparThree.glContextSet(renderer.getContext());

// Set the background of our scene to be the camera background texture
// that's provided by the Zappar camera
scene.background = camera.backgroundTexture;

// The InteractionHelper class let's us listen for when 3D objects
// are tapped on screen. See interactionhelper.ts for its implementation
const interactionHelper = new InteractionHelper(camera, renderer);

// Set an error handler on the loader to help us check if there are issues loading content.
manager.onError = (url) => console.log(`There was an error loading ${url}`);

// Create a zappar image_tracker and wrap it in an image_tracker_group for us
// to put our ThreeJS content into
// Pass our loading manager in to ensure the progress bar works correctly
const imageTracker = new ZapparThree.ImageTrackerLoader(manager).load(targetImage);
const imageTrackerGroup = new ZapparThree.ImageAnchorGroup(camera, imageTracker);
const contentGroup = new THREE.Group();

// Add our image tracker group into the ThreeJS scene
scene.add(imageTrackerGroup);

// Create the button's background
const buttonBackgroundPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(1.2, 0.4),
  new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new THREE.Color('#DE4C42'),
  }),
);

// Push it back a little so it does not clip with text we will create.
buttonBackgroundPlane.position.z = 0.001;

// Loaders are used to load external files
// Pass our loading manager in to ensure the progress bar works correctly
const fontLoader = new FontLoader(manager);

// Create a plane geometry mesh for the background
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(3.07, 2.05),
  new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new THREE.Color(0, 0, 0),
    transparent: true,
    opacity: 0.8,
  }),
);

// add our content to the tracking group.
contentGroup.add(plane);


// load the font and size it appropriately.
const fontUrl = new URL('./assets/fonts/Passion.json', import.meta.url).href;
fontLoader.load(fontUrl, (font) => {
  const text = new THREE.Mesh(
    new TextGeometry(
      'Visit Website', { font, size: 0.1, height: 0.01 },
    ).center(),
    new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide, color: new THREE.Color('#fff'),
    }),
  );

  // add the background plane and the text to our tracker group
  contentGroup.add(text);
  contentGroup.add(buttonBackgroundPlane);
});

imageTrackerGroup.add(contentGroup);

// Use interaction helper to listen for mouse down events on button_background_plane,
// on mouse down, launch Zappar.com in a new tab.
interactionHelper.addMouseDownListener(buttonBackgroundPlane, () => {
  window.open('https://www.zappar.com', '_blank');
});

// when we lose sight of the camera, hide the scene contents.
imageTracker.onVisible.bind(() => { scene.visible = true; });
imageTracker.onNotVisible.bind(() => { scene.visible = false; });

// Use a function to render our scene as usual
function render(): void {
  // The Zappar camera must have updateFrame called every frame
  camera.updateFrame(renderer);

  // Draw the ThreeJS scene in the usual way, but using the Zappar camera
  renderer.render(scene, camera);

  // Call render() again next frame
  requestAnimationFrame(render);
}

// Start things off
render();
