import * as THREE from 'three';

const API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
const todayDate = new Date().toISOString().split('T')[0];

const spaceBox = document.getElementById('space-box');

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, 550 / 420, 0.1, 1000);
camera.position.z = 15;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(550, 420);
spaceBox.appendChild(renderer.domElement);

const loader = new THREE.TextureLoader();
const earthGroup = new THREE.Group();
scene.add(earthGroup);

const asteroidList = [];

function loadNASAData() {
  fetch('https://api.nasa.gov/neo/rest/v1/feed?start_date=' + todayDate + '&end_date=' + todayDate + '&api_key=' + API_KEY)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      const asteroidsToday = data.near_earth_objects[todayDate];
      const tableBody = document.getElementById('table-body');
      tableBody.innerHTML = '';

      for (let i = 0; i < asteroidsToday.length; i++) {
        const item = asteroidsToday[i];
        const size = Math.round(item.estimated_diameter.meters.estimated_diameter_max);
        const speed = Math.round(item.close_approach_data[0].relative_velocity.kilometers_per_hour);
        const dist = Math.round(item.close_approach_data[0].miss_distance.kilometers);

        const tr = document.createElement('tr');
        tr.className = 'table-row';
        tr.innerHTML = '<td><b>' + item.name + '</b></td><td>' + size + 'm</td>';

        tr.addEventListener('click', function() {
          document.getElementById('info-text').innerHTML = 
            '<span style="color: #00f3ff; font-weight: bold;">Name:</span> ' + item.name + '<br>' +
            '<span style="color: #00f3ff; font-weight: bold;">Max Size:</span> ' + size + ' meters<br>' +
            '<span style="color: #00f3ff; font-weight: bold;">Speed:</span> ' + speed.toLocaleString() + ' km/h<br>' +
            '<span style="color: #00f3ff; font-weight: bold;">Miss Distance:</span> ' + dist.toLocaleString() + ' km';
        });

        tableBody.appendChild(tr);
      }
    })
    .catch(function(error) {
      document.getElementById('table-body').innerHTML = '<tr><td colspan="2">Error loading data</td></tr>';
    });
}

const earthTexture = loader.load('/earth.jpg');
const earthGeo = new THREE.SphereGeometry(3.5, 32, 32);
const earthMat = new THREE.MeshPhongMaterial({ map: earthTexture });
const earth = new THREE.Mesh(earthGeo, earthMat);
earthGroup.add(earth);

function animate() {
  requestAnimationFrame(animate);

  for (let i = 0; i < asteroidList.length; i++) {
    const ast = asteroidList[i];

    ast.angle = ast.angle + ast.speed;

    ast.mesh.position.x = Math.cos(ast.angle) * ast.distance;
    ast.mesh.position.z = Math.sin(ast.angle) * ast.distance;

    ast.mesh.rotation.x = ast.mesh.rotation.x + 0.01;
    ast.mesh.rotation.y = ast.mesh.rotation.y + 0.01;
  }

  renderer.render(scene, camera);
}

const light1 = new THREE.DirectionalLight(0xffffff, 2.0);
light1.position.set(20, 10, 20);
scene.add(light1);

const light2 = new THREE.AmbientLight(0x777777);
scene.add(light2);

const asteroidTexture = loader.load('asteroids.jpg');

for (let i = 0; i < 4; i++) {
  const astGeo = new THREE.DodecahedronGeometry(0.4, 1);
  const astMat = new THREE.MeshStandardMaterial({
    map: asteroidTexture,
    
  });

  const astMesh = new THREE.Mesh(astGeo, astMat);
  earthGroup.add(astMesh);

  const asteroidData = {
    mesh: astMesh,
    distance: 6.0 + (i * 1.5),
    angle: i * 1.5,
    speed: 0.008 + (i * 0.002)
  };

  asteroidList.push(asteroidData);
}

let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

spaceBox.addEventListener('mousedown', function(e) {
  isMouseDown = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

window.addEventListener('mouseup', function() {
  isMouseDown = false;
});

spaceBox.addEventListener('mousemove', function(e) {
  if (isMouseDown === true) {
    const moveX = e.clientX - lastMouseX;
    const moveY = e.clientY - lastMouseY;

    earthGroup.rotation.y = earthGroup.rotation.y + (moveX * 0.01);
    earthGroup.rotation.x = earthGroup.rotation.x + (moveY * 0.01);

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
});

spaceBox.addEventListener('wheel', function(e) {
  camera.position.z = camera.position.z + (e.deltaY * 0.01);

  if (camera.position.z < 6) camera.position.z = 6;
  if (camera.position.z > 25) camera.position.z = 25;
});

loadNASAData();
animate();