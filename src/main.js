import * as THREE from 'three';
import "./style.css"
import gsap from "gsap"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"
import { interleaveAttributes } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Variables
let hoveredObject = null

let sampleRoomMesh = null
let sampleBoxMesh = null

let isInRoom = false
let isMoving = false

// Color
let white = new THREE.Color(0xffffff)
let red = new THREE.Color(0xff0000)
let beigeYellow = new THREE.Color(0xfff1ab)
let originalColor = new THREE.Color() // Variable to save whatever color something is
let originalColorRoom = new THREE.Color();
let originalColorBox = new THREE.Color(); 

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xffffe9)

// Camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 300)

const cameraPosition = new THREE.Vector3(-10, 20, 20)
camera.position.x = cameraPosition.x
camera.position.y = cameraPosition.y
camera.position.z = cameraPosition.z

scene.add(camera)

// Renderer
const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({canvas})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(2)
renderer.render(scene, camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enablePan = false
controls.enableZoom = false

// Geometry
const boxGeometry = new THREE.BoxGeometry(10, 10, 10)

// Models
const loader = new GLTFLoader();
loader.load('/Models/SampleRoom.glb', function(gltf) {
    const sampleRoom = gltf.scene
    
    // const sampleRoomMesh = sampleRoom.getObjectByName('SampleRoom')
    // const sampleBoxMesh = sampleRoom.getObjectByName('SampleBox')
    
    sampleRoom.traverse((child) =>{
        if (child.isMesh){
          if (child.name === 'SampleRoom'){
          sampleRoomMesh = child;
          originalColorRoom.copy(sampleRoomMesh.material.color)
          }
          if (child.name === "SampleCube"){
            sampleBoxMesh = child;
            originalColorBox.copy(sampleBoxMesh.material.color)
        }
      }
    });

    console.log(sampleRoom.children);
    scene.add(sampleRoom)
    sampleRoom.position.y = -1 // Need to move the room a bit down so that the vector and quaternion values match. Moving the room the easiest way to do make the zoom match...
  },
  undefined,
  (error) => {
    console.error('An error happened while loading the model:', error);
  }
);

// Material
const material = new THREE.MeshStandardMaterial({
  color: "#ffffff",
})

// Mesh
//const boxMesh = new THREE.Mesh(boxGeometry, material)
//scene.add(boxMesh)
//boxMesh.rotateX(10)
//boxMesh.rotateY(10)

// Light
const pointLight = new THREE.PointLight(0xffffff, 200, 100)
const ambientLight = new THREE.AmbientLight(0x404040, 25)
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xf9f9f9, 1);
pointLight.position.set(0, 15, 5)
scene.add(pointLight, hemisphereLight, ambientLight)

// Raycaster
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Resizing
window.addEventListener('resize', () =>{
    // Updating the sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    // Updating the camera as well
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
})

// Defines a loop that works kind of like unity's Update method
const loop = () => {
  controls.update()
  renderer.render(scene, camera)
  window.requestAnimationFrame(loop)
}
// Calling the loop
loop();

// Raycast selector renderer - I need to change the sample meshes to tags or something at some point.
function render() {
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0 && isMoving === false) {
    const object = intersects[0].object;

    if (object === sampleRoomMesh) {
      if (isInRoom === false) {
        if (hoveredObject !== sampleRoomMesh) {
          if (hoveredObject) {
            if (hoveredObject.material && hoveredObject.material.color) {
              hoveredObject.material.color.copy(
                hoveredObject === sampleBoxMesh ? originalColorBox : originalColorRoom
              );
            }
          }
          hoveredObject = sampleRoomMesh;
          sampleRoomMesh.material.color.set(beigeYellow);
        }
      } else {
        if (hoveredObject === sampleBoxMesh) {
          if (hoveredObject.material && hoveredObject.material.color) {
            hoveredObject.material.color.copy(originalColorBox);
          }
          hoveredObject = null;
        }
      }
    } else if (object === sampleBoxMesh && isInRoom === true) {
      if (hoveredObject !== sampleBoxMesh) {
        if (hoveredObject) {
          if (hoveredObject.material && hoveredObject.material.color) {
            hoveredObject.material.color.copy(originalColorRoom);
          }
        }
        hoveredObject = sampleBoxMesh;
        sampleBoxMesh.material.color.set(beigeYellow);
      }
    }
  } else {
    if (hoveredObject) {
      if (hoveredObject.material && hoveredObject.material.color) {
        hoveredObject.material.color.copy(
          hoveredObject === sampleRoomMesh ? originalColorRoom : originalColorBox
        );
      }
      hoveredObject = null;
    }
  }

  renderer.render(scene, camera);
}

// Calling the render function
render();

// Update pointer position on mouse move
window.addEventListener('pointermove', (event) => {
  pointer.x = (event.clientX / sizes.width) * 2 - 1;
  pointer.y = -(event.clientY / sizes.height) * 2 + 1;
});

function onPointerMove(event) {
  pointer.x = (event.clientX / sizes.width) * 2 - 1;
  pointer.y = -(event.clientY / sizes.height) * 2 + 1;

  render();
}
window.addEventListener( 'pointermove', onPointerMove );

function onPointerClick (event) {
  pointer.x = (event.clientX / sizes.width) * 2 - 1;
  pointer.y = -(event.clientY / sizes.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(scene.children, true)

  if (intersects.length > 0) {
    const object = intersects[0].object

    if (object === sampleRoomMesh && isInRoom === false) {
      sampleRoomMesh.material.color.set(originalColorRoom)
      isInRoom = true

      controls.enabled = false
      isMoving = true

      const targetPosition = new THREE.Vector3(.5, 2, 0)
      
      const quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle( new THREE.Vector3( 0, 2, 1), Math.PI / 2 );

      targetPosition.applyQuaternion(quaternion)

      gsap.to(camera.position, {
        duration: 1,
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        onComplete: () => {
          isMoving = false
        }
      });
    }
  }
}
window.addEventListener('click', onPointerClick)

function onKeyDown(event){
  if (event.key === "Escape" && isInRoom == true) {
    
    isInRoom = false
    controls.enabled = true
    isMoving = true

    gsap.to(camera.position, {
      duration: 1,
      x: cameraPosition.x,
      y: cameraPosition.y,
      z: cameraPosition.z,
      onComplete: () => {
        isMoving = false
      }
    });
  }
}
document.addEventListener('keydown', onKeyDown);
