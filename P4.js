// UBC CPSC 314 (2015W2) -- P4

// ASSIGNMENT-SPECIFIC API EXTENSION
THREE.Object3D.prototype.setMatrix = function(a) {
  this.matrix=a;
  this.matrix.decompose(this.position,this.quaternion,this.scale);
}

// SETUP RENDERER & SCENE
var canvas = document.getElementById('canvas');
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x000000); // white background colour
canvas.appendChild(renderer.domElement);

// TEXTURE LOADER
var textureLoader = new THREE.TextureLoader();

// OBJ LOADER
var manager = new THREE.LoadingManager();

// SETUP CAMERA
var camera = new THREE.PerspectiveCamera(75,1,0.1,1000); // view angle, aspect ratio, near, far

// SETUP CONTROLS OF THE CAMERA
var controls = new THREE.PointerLockControls(camera);
controls.getObject().rotation.y = Math.PI;
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
scene.add( controls.getObject() );

// add player light and ambient light
var playerLight = new THREE.PointLight(0xb0b0b0,1,100);

playerLight.position.copy(controls.getObject().position);

playerLight.castShadow = true;
playerLight.shadow.camera.near = 1;
playerLight.shadow.camera.far = 100;
playerLight.shadow.bias = 0.01;

scene.add(playerLight);
scene.add(new THREE.AmbientLight(0x707070));

// SETUP FRAMERATE COUNTER
var stats = new Stats();
stats.setMode(0);
// align top-left
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';
canvas.appendChild(stats.domElement);

// ADAPT TO WINDOW RESIZE
function resize() {
  renderer.setSize(window.innerWidth,window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
}

// EVENT LISTENER RESIZE
window.addEventListener('resize',resize);
resize();

//SCROLLBAR FUNCTION DISABLE
window.onscroll = function () {
 window.scrollTo(0,0);
}

//AXIS HELPER
var axisHelper = new THREE.AxisHelper(100);
//scene.add(axisHelper);

// CLOCK
var clock = new THREE.Clock(false);
var clock2 = new THREE.Clock(false);
var clock_door = new THREE.Clock(true);
var clock_s = new THREE.Clock(true);

// RAYCASTER
var raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0.01, 1000 );

// CONSTANTS
var velocity = 0.5;
var gravity = 2;
var downVelocity = 0;
var jumpVelocity = .6;
var preservedVelocity = 0;
var previousHeight = 0;
var previousTime = 0;
var bulletSpeed = 170;

// Pressure Plate
var trigger = false; 
var stimulus = 0; // 0: player, 1: cube
var offColor = new THREE.Color(0xcc0033);
var onColor = new THREE.Color(0x66ff33);
var plate; var plateBase; 
var plateRay = new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(),0,0);

var plateBaseGeom = new THREE.BoxGeometry(4,1,4);
var plateBaseMaterial = new THREE.MeshPhongMaterial({color:0x111111});
var plateBase = new THREE.Mesh(plateBaseGeom,plateBaseMaterial);

var plateGeom = new THREE.BoxGeometry(3.3,1,3.3);
plateGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0,0.5,0));
var plateMaterial = new THREE.MeshPhongMaterial({color:offColor});

function initTrigger(x, y, z, target) {
  stimulus = target;
  trigger = false;
  plateBase.position.set(x,y,z);
  scene.add(plateBase);
  plateMaterial.color.copy(offColor);
  plate = new THREE.Mesh(plateGeom, plateMaterial);
  plateBase.add(plate);
  plateRay = new THREE.Raycaster(new THREE.Vector3(x,y-.1,z),new THREE.Vector3(0,1,0),0.1,50);
}

function onTrigger() {
  console.log("triggered");
  trigger = true;
  plate.material.color.copy(onColor);
  plate.position.y -= 0.45;
  if(!gateOpen) {
    init_animation(0,gateW*2,1);
    gateOpen = true;
  }
}

function updateTrigger() {
  if(trigger) {return;}
  if(stimulus===0) {
    var hit = plateRay.intersectObject(player);
    if(hit.length!=0) {
      onTrigger();
    }
  } else {
    var hit = plateRay.intersectObject(cube);
    if(hit.length!=0) {
      onTrigger();
    }
  }
}

// GATES
var gateW = 15;
var gateGeometry = makeCube();
gateGeometry.applyMatrix(new THREE.Matrix4().makeScale(gateW,20,1));
gateGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,10,0));


var gatetex = THREE.ImageUtils.loadTexture('textures/gate.jpg');
var gateMaterial = new THREE.MeshBasicMaterial({map:gatetex});

var lgate = new THREE.Mesh(gateGeometry,gateMaterial);

var rgate = new THREE.Mesh(gateGeometry,gateMaterial);

var lgateBB = new THREE.Box3();
var rgateBB = new THREE.Box3();

// LIGHTING UNIFORMS
var lightColor = new THREE.Color(1,1,1);
var ambientColor = new THREE.Color(0.4,0.4,0.4);
var lightPosition = new THREE.Vector3(-9,13,7);

var litColor = new THREE.Color(0.3,0.4,0.6);
var unLitColor = new THREE.Color(0.15,0.2,0.3);
var outlineColor = new THREE.Color(0.04,0.1,0.15);

var kAmbient = 0.4;
var kDiffuse = 0.8;
var kSpecular = 0.8;
var shininess = 10.0;



var fireMaterial = new THREE.PointsMaterial({
  color: 0xFFFFFF,
  size: 0.3,
   map: THREE.ImageUtils.loadTexture(
     "images/particle.png"
  ),
  blending: THREE.AdditiveBlending,
  transparent: true
});  
var firepoints = new THREE.Geometry();  
var fireSystem = new THREE.Points(firepoints, fireMaterial);
var fireCount = 200;
var fireDie = 0;

for (var i = 0; i<fireCount; i++){
      var vertex = new THREE.Vector3();
      vertex.x = Math.random() * 1-0.5;
      vertex.y = Math.random() * 1-0.5;
      vertex.z = Math.random() * 2-1;
      firepoints.vertices.push(vertex);
  }



// MATERIALS
var normalMaterial = new THREE.MeshNormalMaterial();
var GGXMaterial = new THREE.ShaderMaterial({
 uniforms: {
  lightColor:{type: 'c',value: lightColor},
  ambientColor:{type: 'c',value: ambientColor},
  lightPosition : {type: 'v3', value: lightPosition},
  kAmbient:{type: 'f',value:kAmbient},
  kDiffuse:{type: 'f',value:kDiffuse},
  kSpecular:{type:'f',value:kSpecular},
  shininess:{type: 'f',value:shininess},
}
});

var guntext = textureLoader.load('images/gun_text.jpg');
var totalbullets = 0;
var gunMaterial = new THREE.ShaderMaterial({
  uniforms: {
    lightColor:{type: 'c',value: lightColor},
    ambientColor:{type: 'c',value: ambientColor},
    lightPosition : {type: 'v3', value: lightPosition},
    kAmbient:{type: 'f',value:kAmbient},
    kDiffuse:{type: 'f',value:kDiffuse},
    kSpecular:{type:'f',value:kSpecular},
    shininess:{type: 'f',value:shininess},
    texture:{type: 't', value: guntext},
  },
  blending: THREE.AdditiveBlending,
  transparent: false
});
// LOAD SHADERS
var shaderFiles = [
'glsl/ggx.fs.glsl',
'glsl/ggx.vs.glsl',
'glsl/gun.fs.glsl',
'glsl/gun.vs.glsl',
];

new THREE.SourceLoader().load(shaderFiles, function(shaders) {

  GGXMaterial.vertexShader = shaders['glsl/ggx.vs.glsl'];
  GGXMaterial.fragmentShader = shaders['glsl/ggx.fs.glsl'];
  GGXMaterial.needsUpdate = true;

  gunMaterial.vertexShader = shaders['glsl/gun.vs.glsl'];
  gunMaterial.fragmentShader = shaders['glsl/gun.fs.glsl'];
  gunMaterial.needsUpdate = true;
});

// create the particle variables
var particleCount = 2000;
var particles = new THREE.Geometry();
// create the particle variables
var pMaterial = new THREE.PointsMaterial({
  color: 0xFFFFFF,
  size: 0.2,
  map: textureLoader.load(
    "images/particle.png"
    ),
  blending: THREE.AdditiveBlending,
  transparent: true
});

// also update the particle system to
// sort the particles which enables
// the behaviour we want
// particleSystem.sortParticles = true;

// now create the individual particles
for (var p = 0; p < particleCount; p++) {

  // create a particle with random position values
  
  var vertex = new THREE.Vector3();

  vertex.x = Math.random() * 20-10;
  vertex.y = Math.random() * 20;
  vertex.z = Math.random() * 20-10;
  // add it to the geometry
  particles.vertices.push(vertex);
}

// create the particle system
var particleSystem = new THREE.Points(particles, pMaterial);



// LOAD gun
var gun;
function loadOBJ(file, material, scale, xOff, yOff, zOff, xRot, yRot, zRot) {
  var onProgress = function(query) {
    if ( query.lengthComputable ) {
      var percentComplete = query.loaded / query.total * 100;
      console.log( Math.round(percentComplete, 2) + '% downloaded' );
    }
  };
  var onError = function() {
    console.log('Failed to load ' + file);
  };
  var loader = new THREE.OBJLoader()
  loader.load(file, function(object) {
    object.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });

    object.position.set(xOff,yOff,zOff);
    object.rotation.x= xRot;
    object.rotation.y = yRot;
    object.rotation.z = zRot;
    object.scale.set(scale,scale,scale);    
    camera.add(object);

    gun = object;
  }, onProgress, onError);
}

loadOBJ('obj/gun.obj', gunMaterial, 2.2, 2,-1.5,-5.2, 0.1, 0.1,-0.5,0.2);
var mouse = new THREE.Vector2(0,0);
var fireMatrix = new THREE.Matrix4();
fireMatrix.makeTranslation(0,0,-1);
fireSystem.setMatrix(fireMatrix);


function makeAim(){
  var geo = new THREE.Mesh(new THREE.RingGeometry(0.1,0.115,88), new THREE.MeshBasicMaterial({color:0x108fad}));
  return geo;
}
var aim = makeAim();
var aimPos = new THREE.Matrix4();
aimPos.makeTranslation(mouse.x,mouse.y,-3);
aim.setMatrix(aimPos);
camera.add(aim);

// MATERIALS
var wallTexture = textureLoader.load('textures/wall1.jpg');
wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(5,5);

var wallTexture3 = textureLoader.load('textures/wall1.jpg');
wallTexture3.wrapS = wallTexture3.wrapT = THREE.RepeatWrapping;
wallTexture3.repeat.set(10,10);

var wallMaterial = new THREE.MeshPhongMaterial( { map: wallTexture, shininess: 1 } );
var specWallMaterial = new THREE.MeshPhongMaterial({shiniess: 0});
specWallMaterial.map = wallTexture3;
// portal bullet goes through glass
var glassMaterial = new THREE.MeshPhongMaterial({color:0x99ffff,shininess: 20});
glassMaterial.transparent = true;
glassMaterial.opacity = 0.4;

var bluColor = 0x1aa3ff;
var orgColor = 0xffa31a;

var bluPortalTex = textureLoader.load('textures/Blue_Portal.png');
var bluAlphaTex = textureLoader.load('textures/b_alpha.png');
var orgPortalTex = textureLoader.load('textures/Orange_Portal.png');
var orgAlphaTex = textureLoader.load('textures/o_alpha.png');

var bluPortalMaterial = new THREE.MeshBasicMaterial({map:bluPortalTex});
bluPortalMaterial.transparent = true;
bluPortalMaterial.side = THREE.DoubleSide;
// bluPortalMaterial.opacity = 1.0;
bluPortalMaterial.alphaMap = bluAlphaTex;
var orgPortalMaterial = new THREE.MeshBasicMaterial({map:orgPortalTex});
orgPortalMaterial.transparent = true;
// orgPortalMaterial.opacity = 1.0;
orgPortalMaterial.alphaMap = orgAlphaTex;
orgPortalMaterial.side = THREE.DoubleSide;

var exit_xw = 10;
var exit_yw = 15;
var exit_zw = 2;
var exitGeometry = new THREE.BoxGeometry(exit_xw,exit_yw,exit_zw);

// Cube
var cubeTexture = textureLoader.load('textures/cube.png');
var cubeNormalMap = textureLoader.load('textures/cube_normal.png');
var cube_l = 5;
var cubeGeometry = new THREE.BoxGeometry(cube_l,cube_l,cube_l);
var cubeMaterial = new THREE.MeshPhongMaterial({
  map:cubeTexture, 
  normalMap:cubeNormalMap, 
  normalScale: new THREE.Vector2(2,2),
  shininess: 30,
});
var cube = new THREE.Mesh(cubeGeometry,cubeMaterial);
var cubeBB;

// Button


// PLAYER OBJ
var playerH = 10; var playerW = 5;
var playerVec = new THREE.Vector3(playerW/2+1, playerH/2+1, playerW/2+1);
var playerGeometry_scale = new THREE.Matrix4().set(playerW,0,0,0, 0,playerH,0,-playerH/2, 0,0,playerW,0, 0,0,0,1);
var playerGeometry = makeCube();
playerGeometry.applyMatrix(playerGeometry_scale);
var player = new THREE.Mesh(playerGeometry,normalMaterial);
player.position.copy(controls.getObject().position);
scene.add(player);
var playerBB = new THREE.Box3().setFromObject(player);
// player velocity
var playerVelocity = new THREE.Vector3();

var bullets=[];
var shoot = [];
var time =[];
var gunposition = [];
var gundir = [];

function addBulletLight(bullet) {
  // Light For Bullets
  var color = (bullet.type)? orgColor : bluColor;

  var light = new THREE.PointLight(color,1,20);

  light.position.set(bullet.sphere.position);

  light.castShadow = true;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 20;
  light.shadow.bias = 0.01;

  bullet.light = light;
  scene.add(light);
}

function makeBullet(type){
  var color = (type)? orgColor : bluColor;
  var sphere = new THREE.Mesh(new THREE.SphereGeometry(0.2,32,32), new THREE.MeshBasicMaterial({color:color}));
  raycaster.setFromCamera( mouse, camera );
  shoot.push(clock_s.getElapsedTime());
  gunposition.push(new THREE.Vector3().copy(controls.getObject().position));
  gundir.push(new THREE.Vector3().copy(raycaster.ray.direction));
  gun.add(fireSystem);
  var dist = 200;
  var intersect = raycaster.intersectObjects(objects);
  if(intersect.length!=0) {
    dist = intersect[0].distance;
  }
  scene.add(sphere);
  var bullet = {
    sphere: sphere,
    distance: dist,
    type: type, // 0 for blue, 1 for orange
    intersections: intersect,
    light: undefined,
  };
  addBulletLight(bullet);
  bullets.push(bullet);
  return bullet;
}

function removeBullet(index) {
  bullets.splice(index, 1);
  shoot.splice(index, 1);
  time.splice(index, 1);
  gunposition.splice(index, 1);
  gundir.splice(index, 1);
}

var cubes = [];
var objects = [];
var BBs = [];
var ceilings = [];
var exitBB;

var nextLvl = false;
var curLvl = 1;
var maxLvl = 4;

var exitMaterial = new THREE.MeshBasicMaterial({color:0x00a000});
exitMaterial.transparent = true;
exitMaterial.opacity = 0.25;
var exit = new THREE.Mesh(exitGeometry,exitMaterial);

function cleanUpRoom() {
  controls.getObject().position.set(0,playerH,0);
  controls.getObject().rotation.y = Math.PI;
  for(i = scene.children.length - 1; i >= 4; i--) {
    scene.remove(scene.children[i]);
  }
  openPortals = [[],[]];
  objects.splice(0,objects.length);
  BBs.splice(0,BBs.length);
  ceilings.splice(0,ceilings.length);
  console.log('room clean up')
  gateOpen = false;
}

function setUpRoom1() {
  $("#lvl").html("<b>LVL 1</b>");
  console.log('room1 set');
  var r1floorGeometry = new THREE.BoxGeometry(30,20,20);
  var r1floor1 = new THREE.Mesh(r1floorGeometry,wallMaterial);
  r1floor1.position.set(0,-10,0);
  var r1floor1BB = new THREE.Box3().setFromObject(r1floor1);
  var r1floor2 = new THREE.Mesh(r1floorGeometry,wallMaterial);
  r1floor2.position.set(0,-10,50);
  var r1floor2BB = new THREE.Box3().setFromObject(r1floor2);
  var r1floor3Geometry = new THREE.BoxGeometry(30,1,70);
  var r1floor3 = new THREE.Mesh(r1floor3Geometry,wallMaterial);
  r1floor3.position.set(0,-20.5,25)
  var r1floor3BB = new THREE.Box3().setFromObject(r1floor3);
  var r1wallGeometry = new THREE.BoxGeometry(1,50,70);
  var r1wall1 = new THREE.Mesh(r1wallGeometry,wallMaterial);
  r1wall1.position.set(15.5,-5,25);
  var r1wall1BB = new THREE.Box3().setFromObject(r1wall1);
  var r1wall2 = new THREE.Mesh(r1wallGeometry,wallMaterial);
  r1wall2.position.set(-15.5,-5,25);
  var r1wall2BB = new THREE.Box3().setFromObject(r1wall2);
  var r1wallGeometry2 = new THREE.BoxGeometry(30,20,1);
  var r1wall3 = new THREE.Mesh(r1wallGeometry2,wallMaterial);
  r1wall3.position.set(0,10,-10.5);
  var r1wall3BB = new THREE.Box3().setFromObject(r1wall3);
  var r1wall4 = new THREE.Mesh(r1wallGeometry2,specWallMaterial);
  r1wall4.position.set(0,10,60.5);
  var r1wall4BB = new THREE.Box3().setFromObject(r1wall4);
  var r1ceiling = new THREE.Mesh(r1floor3Geometry,wallMaterial);
  r1ceiling.position.set(0,20.5,25);
  var r1ceilingBB = new THREE.Box3().setFromObject(r1ceiling);

  exit.position.set(0,7.5,60);
  exitBB = new THREE.Box3().setFromObject(exit);

  lgate.position.set( gateW/2,0,55);
  rgate.position.set(-gateW/2,0,55);
  lgateBB = new THREE.Box3().setFromObject(lgate);
  rgateBB = new THREE.Box3().setFromObject(rgate);

  initTrigger(0,lgate.position.y,lgate.position.z-8,0);

  scene.add(r1floor1);
  scene.add(r1floor2);
  scene.add(r1floor3);
  scene.add(r1wall1);
  scene.add(r1wall2);
  scene.add(r1wall3);
  scene.add(r1wall4);
  scene.add(r1ceiling);
  scene.add(exit);
  scene.add(lgate);
  scene.add(rgate);

  objects.splice(0,0,r1floor1,r1floor2,r1floor3,r1wall1,r1wall2,r1wall3,r1ceiling);
  BBs.splice(0,0,r1floor1BB,r1floor2BB,r1floor3BB,r1wall1BB,r1wall2BB,r1wall3BB,r1wall4BB,r1ceilingBB,lgateBB,rgateBB);
  ceilings.splice(0,0,r1ceilingBB);
}

function setUpRoom2() {
  $("#lvl").html("<b>LVL 2</b>");
  console.log('room2 set');
  var floor_xw = 30;
  var floor1_yw = 20;
  var floor1_zw = 20;
  var floor1 = new THREE.Mesh(new THREE.BoxGeometry(floor_xw,floor1_yw,floor1_zw),wallMaterial);
  floor1.position.set(0,-floor1_yw/2,0);
  var floor1BB = new THREE.Box3().setFromObject(floor1);

  var floor2_yw = 1;
  var floor2_zw = 35;
  var floor2 = new THREE.Mesh(new THREE.BoxGeometry(floor_xw,floor2_yw,floor2_zw),wallMaterial);
  var floor2_z = floor1_zw/2 + floor2_zw/2;
  floor2.position.set(0,-floor1_yw,floor2_z);
  var floor2BB = new THREE.Box3().setFromObject(floor2);

  var floor3_yw = 50;
  var floor3_zw = 20;
  var floor3_z = floor2_z + floor2_zw/2 + floor3_zw/2;
  var floor3 = new THREE.Mesh(new THREE.BoxGeometry(floor_xw,floor3_yw,floor3_zw),wallMaterial);
  var floor3_y = floor3_yw/2 - floor1_yw;
  floor3.position.set(0,floor3_y,floor3_z);
  var floor3BB = new THREE.Box3().setFromObject(floor3);

  var wall_t = 1;
  var wall1_h = floor1_yw + 100;
  var wall1_l = floor_xw;
  var wall1 = new THREE.Mesh(new THREE.BoxGeometry(wall1_l,wall1_h,wall_t),wallMaterial);
  var wall1_y = wall1_h/2 - floor1_yw;
  wall1.position.set(0,wall1_y, -floor1_zw/2);
  var wall1BB = new THREE.Box3().setFromObject(wall1);

  var wall2_h = wall1_h;
  var wall2_l = floor_xw;
  var wall2 = new THREE.Mesh(new THREE.BoxGeometry(wall2_l,wall2_h,wall_t),specWallMaterial);
  wall2.position.set(0,wall1_y, floor3_z + floor3_zw/2);
  var wall2BB = new THREE.Box3().setFromObject(wall2);

  var wall3_h = wall1_h;
  var wall3_l = floor1_zw + floor2_zw + floor3_zw;
  var wall3 = new THREE.Mesh(new THREE.BoxGeometry(wall_t,wall3_h,wall3_l),specWallMaterial);
  wall3.position.set(floor_xw/2, wall1_y, wall3_l/2 - floor1_zw/2);
  var wall3BB = new THREE.Box3().setFromObject(wall3);

  var wall4_h = wall1_h;
  var wall4_l = floor1_zw + floor2_zw + floor3_zw;
  var wall4 = new THREE.Mesh(new THREE.BoxGeometry(wall_t,wall4_h,wall4_l),specWallMaterial);
  wall4.position.set(-floor_xw/2, wall1_y, wall4_l/2 - floor1_zw/2);
  var wall4BB = new THREE.Box3().setFromObject(wall4);

  var ceiling_t = 1;
  var ceiling_xw = floor_xw;
  var ceiling_zw = wall3_l;
  var ceiling = new THREE.Mesh(new THREE.BoxGeometry(ceiling_xw,ceiling_t,ceiling_zw),specWallMaterial);
  ceiling.position.set(0,wall3_h-floor1_zw,ceiling_zw/2 - floor1_zw/2);
  var ceilingBB = new THREE.Box3().setFromObject(ceiling);

  exit.position.set(0,floor3_y+floor3_yw/2+exit_yw/2,floor1_zw+floor2_zw+floor3_zw-10);
  exitBB = new THREE.Box3().setFromObject(exit);

  lgate.position.set( gateW/2,exit.position.y-exit_yw/2,exit.position.z-10);
  rgate.position.set(-gateW/2,lgate.position.y,lgate.position.z);
  lgateBB = new THREE.Box3().setFromObject(lgate);
  rgateBB = new THREE.Box3().setFromObject(rgate);

  initTrigger(0,lgate.position.y,lgate.position.z-7,0);

  scene.add(floor1);
  scene.add(floor2);
  scene.add(floor3);
  scene.add(wall1);
  scene.add(wall2);
  scene.add(wall3);
  scene.add(wall4);
  scene.add(ceiling);
  scene.add(exit);
  scene.add(lgate);
  scene.add(rgate);

  objects.splice(0,0,floor1,floor2,floor3,wall1);
  BBs.splice(0,0,floor1BB,floor2BB,floor3BB,wall1BB,wall2BB,wall3BB,wall4BB,ceilingBB,lgateBB,rgateBB);
  ceilings.splice(0,0,ceilingBB);
}

function setUpRoom3() {
  $("#lvl").html("<b>LVL 3</b>");
  console.log('room3 set');
  var floor1_xw = 30;
  var floor1_yw = 1;
  var floor1_zw = 70;
  var floor1 = new THREE.Mesh(new THREE.BoxGeometry(floor1_xw,floor1_yw,floor1_zw),wallMaterial);
  floor1.position.set(0,-floor1_yw/2,floor1_zw/2 - 10);
  var floor1BB = new THREE.Box3().setFromObject(floor1);

  var secret_yw = 1;
  var secret_zw = 40;
  var secret = new THREE.Mesh(new THREE.BoxGeometry(floor1_xw,secret_yw,secret_zw),wallMaterial);
  secret.position.set(0, -secret_yw/2,floor1.position.z + floor1_zw/2 +secret_zw/2);
  var secretBB = new THREE.Box3().setFromObject(secret);

  var wallseMat = new THREE.MeshBasicMaterial({color:0xFFFFFF});
  wallseMat.transparent = true;
  wallseMat.opacity = 0.1;
  var wallse = new THREE.Mesh(new THREE.BoxGeometry(floor1_xw,20,1),wallseMat);
  wallse.position.set(0,10,floor1.position.z + floor1_zw/2 );
  var wallseBB = new THREE.Box3().setFromObject(wallse);

  var floor2_yw = 40;
  var floor2_zw = secret_zw;
  var floor2 = new THREE.Mesh(new THREE.BoxGeometry(floor1_xw,floor2_yw,floor2_zw),wallMaterial);
  floor2.position.set(0,20+floor2_yw/2,floor1_zw+floor2_zw/2 - 10);
  var floor2BB = new THREE.Box3().setFromObject(floor2);

  var wall1_h = floor2_yw + 50;
  var wall1_t = 1;
  var wall1_l = floor1_xw;
  var wall1 = new THREE.Mesh(new THREE.BoxGeometry(wall1_l,wall1_h,wall1_t),wallMaterial);
  wall1.position.set(0,wall1_h/2, -10);
  var wall1BB = new THREE.Box3().setFromObject(wall1);

  var wall2_h = floor2_yw + 50;
  var wall2_t = 1;
  var wall2_l = floor1_xw;
  var wall2 = new THREE.Mesh(new THREE.BoxGeometry(wall2_l,wall2_h,wall2_t),specWallMaterial);
  wall2.position.set(0,wall2_h/2, floor1_zw + floor2_zw - 10);
  var wall2BB = new THREE.Box3().setFromObject(wall2);

  var wall3_h = wall1_h;
  var wall3_t = 1;
  var wall3_l = floor1_zw + floor2_zw;
  var wall3 = new THREE.Mesh(new THREE.BoxGeometry(wall3_t,wall3_h,wall3_l),specWallMaterial);
  wall3.position.set(floor1_xw/2,wall3_h/2, wall3_l/2 - 10);
  var wall3BB = new THREE.Box3().setFromObject(wall3);

  var wall4_h = wall1_h;
  var wall4_t = 1;
  var wall4_l = floor1_zw + floor2_zw;
  var wall4 = new THREE.Mesh(new THREE.BoxGeometry(wall4_t,wall4_h,wall4_l),specWallMaterial);
  wall4.position.set(-floor1_xw/2,wall4_h/2, wall4_l/2 - 10);
  var wall4BB = new THREE.Box3().setFromObject(wall4);

  var ceiling1_zw = 45;
  var ceiling1 = new THREE.Mesh(new THREE.BoxGeometry(floor1_xw,floor1_yw,ceiling1_zw),wallMaterial);
  ceiling1.position.set(0,floor1_yw/2 + 15,ceiling1_zw/2 -10);
  var ceiling1BB = new THREE.Box3().setFromObject(ceiling1);

  var ceiling2_zw = floor1_zw + floor2_zw;
  var ceiling2 = new THREE.Mesh(new THREE.BoxGeometry(floor1_xw,floor1_yw,ceiling2_zw),specWallMaterial);
  ceiling2.position.set(0,wall1_h,ceiling2_zw/2 -10);
  var ceiling2BB = new THREE.Box3().setFromObject(ceiling2);

  exit.position.set(0,floor2.position.y+floor2_yw/2+exit_yw/2,wall2.position.z-exit_zw/2);
  exitBB = new THREE.Box3().setFromObject(exit);

  lgate.position.set( gateW/2,exit.position.y-exit_yw/2,exit.position.z-10);
  rgate.position.set(-gateW/2,lgate.position.y,lgate.position.z);
  lgateBB = new THREE.Box3().setFromObject(lgate);
  rgateBB = new THREE.Box3().setFromObject(rgate);

  cube.position.set(0,cube_l/2,floor1.position.z+floor1_zw/2+secret_zw/2);
  var cubeBB = new THREE.Box3().setFromObject(cube);
  scene.add(cube);

  initTrigger(0,ceiling1.position.y+0.5, 15,1);

  scene.add(floor1);
  scene.add(secret);
  scene.add(wallse);
  scene.add(floor2);
  scene.add(ceiling1);
  scene.add(ceiling2);
  scene.add(wall1);
  scene.add(wall2);
  scene.add(wall3);
  scene.add(wall4);
  scene.add(exit);
  scene.add(lgate);
  scene.add(rgate);

  objects.splice(0,0,floor1,floor2,ceiling1,wall1,wall2,wall3,wall4,secret);
  BBs.splice(0,0,floor1BB,floor2BB,ceiling1BB,ceiling2BB,wall1BB,wall2BB,wall3BB,wall4BB,secretBB,wallseBB,cubeBB,lgateBB,rgateBB);
  ceilings.splice(0,0,ceiling1BB,ceiling2BB);
}

function setUpRoomFinal() {
  var floor1_xw = 70;
  var floor1_yw = 1;
  var floor1_zw = 70;
  var floor1 = new THREE.Mesh(new THREE.BoxGeometry(floor1_xw,floor1_yw,floor1_zw),wallMaterial);
  floor1.position.set(0,-floor1_yw/2,floor1_zw/2 - 10);
  var floor1BB = new THREE.Box3().setFromObject(floor1);
  scene.add(floor1);

  // THIS IS FOR MY GREAT TA
  var photoGeom = new THREE.PlaneGeometry(24,18);
  photoGeom.applyMatrix(new THREE.Matrix4().makeRotationZ(-Math.PI/2));
  var photo = textureLoader.load('photos/silver.png');
  var photoMat = new THREE.MeshBasicMaterial({map:photo});
  var easterEgg = new THREE.Mesh(photoGeom, photoMat);
  easterEgg.position.set(0,15,-10);
  scene.add(easterEgg);

  objects.push(floor1);
  BBs.push(floor1BB);
}

function setUpRoom() {
  switch (curLvl) {
    case 1:
    setUpRoom1();
    break;
    case 2:
    setUpRoom2();
    break;
    case 3:
    setUpRoom3();
    break;
    case 4:
    setUpRoomFinal();
    break;
  }
}

function updateRoom() {
  if (playerBB.intersectsBox(exitBB)) {
    if (curLvl!=maxLvl) {
      curLvl++;
    } else {
      curLvl=0;
    }
    cleanUpRoom();
    setUpRoom();
  }
}

// SET UP THE FIRST ROOM
setUpRoom1();

// function drawCube()
function makeCube() {
  var unitCube = new THREE.BoxGeometry(1,1,1);
  return unitCube;
}

// MATRICES

//scene.add(particleSystem);

// PORTAL
var blu_ptr; var org_ptr;
var ptr_geom = new THREE.SphereGeometry(0.5,16,16);
var blu_ptr = new THREE.Mesh(ptr_geom,new THREE.MeshBasicMaterial({color:bluColor}));
var org_ptr = new THREE.Mesh(ptr_geom,new THREE.MeshBasicMaterial({color:orgColor}));

var portalH = playerH+2; var portalW = playerH/2+3;

var portalXVec = new THREE.Vector3(-0.1,0,0);
var portalYVec = new THREE.Vector3(0,-0.1,0);
var portalZVec = new THREE.Vector3(0,0,-0.1);

var portalVecs = [portalXVec, portalYVec, portalZVec];

var openPortals = [[],[]];

function Portal(type, orient) {
  this.mesh = undefined;
  this.type = type;
  this.orient  = orient;
  this.dir = new THREE.Vector3();
  this.BB   = undefined;
  this.isOpen = false;
  this.dest = undefined;
}

function computeOrient(N) {
  var orient = 0; // 0 for x, 1 for y, 2 for z
  if (N.x==0) {
    orient++;
    if (N.y==0) {
      orient++;
    }
  }
  return orient;
}

function setDir(portal, N) {
  portal.dir.copy(N);
}

function openPortal(type, hit) {
  var normal = new THREE.Vector3();
  normal.copy(hit.face.normal);

  var N = normal.multiplyScalar(-1);
  var orient = computeOrient(normal);
  var point = new THREE.Vector3();
  point.copy(hit.point);

  for (i=0; i<3; i++) {
    var temp = portals[type][i];
    if (i!=orient) {
      temp.isOpen = false;
      scene.remove(temp.mesh);
    } else {
      temp.mesh.position.copy(point.add(N.multiply(portalVecs[i])));
      temp.BB = new THREE.Box3().setFromObject(temp.mesh);
      scene.add(temp.mesh);
      temp.isOpen = true;
      setDir(temp, hit.face.normal);
      openPortals[type].pop();
      openPortals[type].push(temp);
    }
  }

  var hit_pt = new THREE.Vector3();
  hit_pt.copy(hit.point);
  var temp_n = new THREE.Vector3();
  temp_n.copy(hit.face.normal);

  var dest = new THREE.Vector3();
  dest.copy(hit_pt.add(temp_n.multiply(playerVec)));
  dest.add(new THREE.Vector3(0,playerH/2,0));

  openPortals[type][0].dest = dest;

  // // Debugging Purpose
  // if (type === 0) {
  //   blu_ptr.position.copy(dest);
  //   scene.add(blu_ptr);
  // } else {
  //   org_ptr.position.copy(dest);
  //   scene.add(org_ptr);
  // }
}

function canTP() {
  return openPortals[0].length!=0 && openPortals[1].length!=0;
}

function hitPortal() {
  if (!canTP()) return false;

  for (i=0;i<2;i++) {
    var temp = openPortals[i][0];
    if (playerBB.intersectsBox(temp.BB)) {
      return true;
    }
  }
}

var multiplier = 60;
var speed = new THREE.Vector3();
var frames = 10;
function changeDir(enter, out) {
  if (enter.dir.equals(new THREE.Vector3(0,1,0))) {
    if(out.orient != 1) {
      var final = new THREE.Vector3();
      final.copy(out.dir);
      playerVelocity = final.multiplyScalar(-downVelocity*multiplier/frames);
      speed.copy(playerVelocity);
      clock2 = new THREE.Clock(false);
      clock2.start();
    } else {

    }
  }
}

function handleTP() {
  if(!canTP()) { return; }

  for (i=0;i<2;i++) {
    var temp = openPortals[i][0];
    if (playerBB.intersectsBox(temp.BB)) {
      var out = openPortals[+!i][0];
      var dest = new THREE.Vector3();
      dest.copy(out.dest);
      controls.getObject().position.copy(dest);
      var base_dir = new THREE.Vector3(0,0,-1);
      var dp = base_dir.dot(out.dir);
      if(dp!=0) {
        controls.getObject().rotation.y = Math.acos(dp);
      } else {
        var cp = new THREE.Vector3(0,0,-1).copy(base_dir).cross(out.dir);
        var ang = (cp.y>0)?Math.PI/2:-Math.PI/2;
        controls.getObject().rotation.y = ang;
      }
      changeDir(temp,out);
      break;
    }
  }
  // speed = new THREE.Vector3();
}

// Set Up Portals
var bluPortalX = new Portal(0,0);
var bluPortalY = new Portal(0,1);
var bluPortalZ = new Portal(0,2);

var orgPortalX = new Portal(1,0);
var orgPortalY = new Portal(1,1);
var orgPortalZ = new Portal(1,2);

var portalGeometryX = new THREE.PlaneGeometry(portalW,portalH);
portalGeometryX.applyMatrix(new THREE.Matrix4().makeRotationY(Math.PI/2));

var portalGeometryY = new THREE.PlaneGeometry(portalW,portalH);
portalGeometryY.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI/2));

var portalGeometryZ = new THREE.PlaneGeometry(portalW,portalH);

bluPortalX.mesh = new THREE.Mesh(portalGeometryX, bluPortalMaterial);
bluPortalY.mesh = new THREE.Mesh(portalGeometryY, bluPortalMaterial);
bluPortalZ.mesh = new THREE.Mesh(portalGeometryZ, bluPortalMaterial);

orgPortalX.mesh = new THREE.Mesh(portalGeometryX, orgPortalMaterial);
orgPortalY.mesh = new THREE.Mesh(portalGeometryY, orgPortalMaterial);
orgPortalZ.mesh = new THREE.Mesh(portalGeometryZ, orgPortalMaterial);

bluPortalX.BB = new THREE.Box3();
bluPortalY.BB = new THREE.Box3();
bluPortalZ.BB = new THREE.Box3();

orgPortalX.BB = new THREE.Box3();
orgPortalY.BB = new THREE.Box3();
orgPortalZ.BB = new THREE.Box3();

var portals = [[bluPortalX, bluPortalY, bluPortalZ],
[orgPortalX, orgPortalY, orgPortalZ]];

var portalBBs = [[bluPortalX.BB, bluPortalY.BB, bluPortalZ.BB],
[orgPortalX.BB, orgPortalY.BB, orgPortalZ.BB]];

// LISTEN TO KEYBOARD
var keyboard = new THREEx.KeyboardState();

// BOOLEANS
var controlsEnabled = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var pickCube = false;
var dropCube = false;
var hasCube = false;
var isJumping = false;
var canJump = true;
var isOnObject = false;
var collision = false;
var headsUp = false;

function updateFrame() {
  updateBullets();
  //updateParticles();
  if(fireDie<fireCount*totalbullets){
   updateFire();
  }else if (totalbullets>0){
    gun.remove(fireSystem);
  }
}
function updateFire(){
  //fireSystem.rotation.z += 0.1;

  var pCount = fireCount;
  while (pCount--) {
      var movedot = new THREE.Vector3();
      movedot.z = 1;
      // get the particle
      var dot = fireSystem.geometry.vertices[pCount];

      // check if we need to reset
      if (dot.z <-20) {
        dot.z = 0;
        movedot.z = 0;
        fireDie++;
        fireSystem.material.opacity-=1/fireCount;
      }else{

        // update the velocity with
        // a splat of randomniz
        movedot.x = (Math.random()-Math.random()) * 0.01;
        movedot.y = (Math.random()-Math.random()) * 0.01;
        movedot.z = -Math.random()*1.2;
        // and the position
        dot.x+=movedot.x;
        dot.y+=movedot.y;
        dot.z+=movedot.z;
      }
    }
  firepoints.verticesNeedUpdate = true;
}
  function updateBullets(){
  // animate the bullets
  for(i=0;i<bullets.length;i++) {
    var m = new THREE.Matrix4();
    var bullet = bullets[i];
    time[i]=clock_s.getElapsedTime()-shoot[i];
    if(bulletSpeed*time[i]< bullet.distance) {
      m.makeTranslation(gunposition[i].x+gundir[i].x*bulletSpeed*time[i], gunposition[i].y+gundir[i].y*bulletSpeed*time[i], gunposition[i].z+bulletSpeed*time[i]*gundir[i].z);
      bullet.sphere.setMatrix(m);
      bullet.light.setMatrix(m);
    } else {
      scene.remove(bullet.light);
      scene.remove(bullet.sphere);
      removeBullet(i);
      if (bullet.intersections.length > 0) {
        openPortal(bullet.type, bullet.intersections[0]);
      }
    }
  }
}

function updateParticles(){
  particleSystem.rotation.y += 0.01;

  // add some rotation to the system
  var pCount = particleCount;
  while (pCount--) {
    particles.verticesNeedUpdate = true
    var movedot = new THREE.Vector3();
    movedot.y = 10;
    // get the particle
    var dot =
    particleSystem.geometry.vertices[pCount];

    // check if we need to reset
    if (dot.y < 0) {
      dot.y = 20;
      movedot.y = 0;
    }

    // update the velocity with
    // a splat of randomniz
    movedot.y = -Math.random() * 0.2;

    // and the position
    //dot.x+=dot.velocity.x;
    dot.y+=movedot.y;
    //dot.z+=dot.velocity.z;
  }

  // flag to the particle system
  // that we've changed its vertices.
  particleSystem.geometry.__dirtyVertices = true;
}

var onKeyDown = function ( event ) {
  switch ( event.keyCode ) {
    case 90: // z
      break;
    case 38: // up
    case 87: // w
      moveForward = true;
      break;
    case 37: // left
    case 65: // a
      moveLeft = true; break;
    case 40: // down
    case 83: // s
      moveBackward = true;
      break;
    case 39: // right
    case 68: // d
      moveRight = true;
      break;
    case 32: // space
      if (controlsEnabled) {
        if ( canJump === true ) {
          previousHeight = controls.getObject().position.y;
          isJumping = true;
          canJump = false;
          isOnObject = false;
        }
      }
      break;
    case 72: // help
      console.log('help');
      $("#tips").toggle();
      $("#instruction").fadeToggle();
      break;
    case 79: //gate control
      if(!gateOpen) {
        init_animation(0,gateW*2,2);
        gateOpen = true;
      } else {
        init_animation(gateW*2,0,2);
        gateOpen = false;
      }
      break;
    case 69: // e
    if (controlsEnabled){
        if (hasCube) {
          dropCube = true;
          hasCube = false;
        } else { 
          pickCube = true;
        }
      break;
    }
  }
}

var onKeyUp = function ( event ) {
  switch( event.keyCode ) {
    case 38: // up
    case 87: // w
    moveForward = false;
    break;
    case 37: // left
    case 65: // a
    moveLeft = false;
    break;
    case 40: // down
    case 83: // s
    moveBackward = false;
    break;
    case 39: // right
    case 68: // d
    moveRight = false;
    break;
  }
};

keyboard.domElement.addEventListener('keydown', onKeyDown);
keyboard.domElement.addEventListener('keyup', onKeyUp);

function onMouseMove(e) {
  var dx = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
  var dy = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
}


function onPointerLockChange(e) {
  requestedElement = canvas;
  if (keyboard.domElement.pointerLockElement === requestedElement ||
    keyboard.domElement.mozPointerLockElement === requestedElement ||
    keyboard.domElement.webkitPointerLockElement === requestedElement) {
    // Pointer was just locked
    // Enable the mousemove listener
    controlsEnabled = true;
    controls.enabled = true;
    keyboard.domElement.addEventListener('mousemove', onMouseMove);
    keyboard.domElement.addEventListener('mousedown', onClick);
  } else {
    // Pointer was just unlocked
    // Disable the mousemove listener
    controlsEnabled = false;
    controls.enabled = false;
    keyboard.domElement.removeEventListener("mousemove", onMouseMove);  
    keyboard.domElement.removeEventListener('mousedown', onClick);
    clock.stop();
  }
}

keyboard.domElement.addEventListener('pointerlockchange', onPointerLockChange, false);
keyboard.domElement.addEventListener('mozpointerlockchange', onPointerLockChange, false);
keyboard.domElement.addEventListener('webkitpointerlockchange', onPointerLockChange, false);

function activatePL(e) {
  element = canvas;
  element.requestPointerLock = element.requestPointerLock ||
  element.mozRequestPointerLock ||
  element.webkitRequestPointerLock;
  // Ask the browser to lock the pointer
  element.requestPointerLock();
}
canvas.addEventListener('click', activatePL);

function isObjectBelow(i) {
  var y_temp = playerBB.min.y;
  var bool = false;
  if (playerBB.min.y > BBs[i].max.y) {
    playerBB.min.y = BBs[i].max.y;
    if (playerBB.intersectsBox(BBs[i])) {
      bool = true;
    } else {
      bool = false;
    }  
    playerBB.min.y = y_temp;
  }
  return bool;
}

function isObjectAbove(i) {
  var y_temp = playerBB.max.y;
  var bool = false;
  if (playerBB.max.y < BBs[i].min.y) {
    playerBB.max.y = BBs[i].min.y;
    if (playerBB.intersectsBox(BBs[i])) {
      bool = true;
    } else {
      bool = false;
    }  
    playerBB.max.y = y_temp;
  }
  return bool;
}

function detectCollision() {
  collision = false;
  isOnObject = false;
  clock.start();
  player.position.copy(controls.getObject().position);
  playerBB = new THREE.Box3().setFromObject(player);
  for (i=0;i<BBs.length;i++) {
    var j;
    if (playerBB.intersectsBox(BBs[i])) {
      collision = true;
      if ( playerBB.min.y == BBs[i].max.y) {
        if (!j) {
          collision = false;
        }
        isOnObject = true;
      } else {
        j = true;
      }
    }
    if (isOnObject) {
      canJump = true;
      isJumping = false;
      previousTime = clock.getElapsedTime();
    } else if (isObjectBelow(i)) {
      if (-downVelocity > (playerBB.min.y - BBs[i].max.y)) {
        controls.getObject().position.y = BBs[i].max.y+playerH;
        isOnObject = true;
      }
    } else if (isObjectAbove(i)) {
      if ( isJumping && (jumpVelocity+downVelocity>BBs[i].min.y-playerBB.max.y) ) {
        previousTime = clock.getElapsedTime();
        controls.getObject().position.y = BBs[i].min.y ;
        isJumping = false;
      }
    }
  }

  if (!isOnObject) { canJump = false; }
}

function updateCamera() {
  var t = clock.getElapsedTime();
  var t2 = clock2.getElapsedTime();
  var extraMove = new THREE.Vector3().copy(speed);
  extraMove.multiplyScalar(t2);
  downVelocity = -gravity*t;
  downVelocity = (downVelocity<-30)?-30:downVelocity;
  var move = new THREE.Vector3();

  if (moveForward)  move.z -= velocity;
  if (moveBackward) move.z += velocity;
  if (moveLeft)     move.x -= velocity;
  if (moveRight)    move.x += velocity;

  controls.getObject().translateX(move.x);
  controls.getObject().translateZ(move.z);
  controls.getObject().position.x += extraMove.x;
  controls.getObject().position.z += extraMove.z;

  if ( isJumping ) {
    move.y = jumpVelocity;
    controls.getObject().translateY( move.y );
  }

  detectCollision();

  if (collision) {
    clock2 = new THREE.Clock(false);
    speed = new THREE.Vector3();
    controls.getObject().translateX(-move.x);
    controls.getObject().translateZ(-move.z);
    controls.getObject().position.x -= extraMove.x;
    controls.getObject().position.z -= extraMove.z;

  }

  player.position.copy(controls.getObject().position);
  playerLight.position.copy(player.position);

  handleTP();

  detectCollision();

  if (!isOnObject) {
    controls.getObject().translateY(downVelocity);
  } else {
    if (!hitPortal()) {
      clock = new THREE.Clock(false);
      downVelocity = 0;
    }
  }
}

var p0; // start position or angle
var p1; // end position or angle
var door_time_length; // total time of animation
var door_time_start; // start time of animation
var door_time_end; // end time of animation
var p; // current frame
var animate = false; // animate?

// function init_animation()
// Initializes parameters and sets animate flag to true.
// Input: start position or angle, end position or angle, and total time of animation.
function init_animation(p_start,p_end,t_length){
  p0 = p_start;
  p1 = p_end;
  door_time_length = t_length;
  door_time_start = clock_door.getElapsedTime();
  door_time_end = door_time_start + door_time_length;
  animate = true; // flag for animation
  return;
}

var gateOpen = false;

function animateDoor() {
  if(!animate) {return;}

  var time = clock_door.getElapsedTime();
  if (time > door_time_end){
    animate = false;
    return;
  }

  p = (p1 - p0)*((time-door_time_start)/door_time_length) + p0;

  var lgateMove = new THREE.Vector3( gateW/2+p,lgate.position.y,lgate.position.z);
  var rgateMove = new THREE.Vector3(-gateW/2-p,lgate.position.y,rgate.position.z);
  lgate.position.copy(lgateMove);
  rgate.position.copy(rgateMove);
  BBs[BBs.length-2] = new THREE.Box3().setFromObject(lgate);
  BBs[BBs.length-1] = new THREE.Box3().setFromObject(rgate);
  console.log(lgateBB.max.x,rgateBB.min.x);
}

function onClick(e){
  if (!hasCube) {
    if (e.button==0) { // left click
      makeBullet(0);
    }
    if (e.button==2) { // right click
      makeBullet(1);
    }
    totalbullets++;
    fireSystem.material.opacity = 1;
  }
}

function goto1() {
  cleanUpRoom();
  setUpRoom1();
}
function goto2() {
  cleanUpRoom();
  setUpRoom2();
}
function goto3() {
  cleanUpRoom();
  setUpRoom3();
}
function goto4() {
  cleanUpRoom();
  setUpRoomFinal();
}

cubes.push(cube);
function updateCube() {
  if (cubes.length!=0) {
    if (pickCube) {
      raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
      var hitList = raycaster.intersectObject(cube);
      if (hitList.length>0 && hitList[0].distance<15) { 
        BBs.pop();
        scene.remove(cube);
        camera.add(cube);
        cube.setMatrix(new THREE.Matrix4().makeTranslation(0,0,-15));
        pickCube = false;
        hasCube = true;
      }
    } else if (dropCube) {
      camera.remove(cube);
      scene.add(cube);
      var dir = new THREE.Vector3();
      controls.getDirection(dir);
      var cube_pos = new THREE.Vector3();
      cube.position.copy(cube_pos.copy(controls.getObject().position).add(dir.multiplyScalar(15)));
      BBs.push(new THREE.Box3().setFromObject(cube));
      dropCube = false;
    }
    //if (isHoldingCube) return;
  }
}

// SETUP UPDATE CALL-BACK
function update() {
  $("#timer").html("<b>TIME: "+clock_door.getElapsedTime().toFixed(1)+" s</b>");
  stats.begin();

  stats.end();
  updateFrame();
  updateTrigger();
  updateRoom();
  animateDoor();
  requestAnimationFrame(update);
  if (controlsEnabled) {
    updateCamera();
    updateCube();
  }
  renderer.render(scene,camera);
}

update();