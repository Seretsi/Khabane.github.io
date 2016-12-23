var scene, camera, renderer;

var waterSurface, waterMesh;
var poolBottom, poolBottomMesh;
var poolWall1, poolWall1Mesh;
var poolWall2, poolWall2Mesh;
var sn;
var clock;
var waterCamera;

var waveDensity = .2;
var choppiness = 4;
var waveSize = .15;
var choppinessSize = .07;
var waveSpeed = .7;


init();
animate();

function init() {
    sn = new SimplexNoise();
    scene = new THREE.Scene();
    var WIDTH = window.innerWidth - 25,
        HEIGHT = window.innerHeight - 68;

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(WIDTH, HEIGHT);
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(45, WIDTH/HEIGHT, .1, 20000);
    camera.position.set(0,1.8,10);
    camera.rotation.x = -0.4;
    scene.add(camera);

    window.addEventListener('resize', function() {
        var WIDTH = window.innerWidth - 25,
            HEIGHT = window.innerHeight - 68;
        renderer.setSize(WIDTH, HEIGHT);
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix();
    });

    //buildSkyBox("skybox1.jpg");
    buildSkyBox2();

    buildLight();

    buildPlanes();


}

function buildSkyBox(file){
    var skyGeo = new THREE.CubeGeometry(500, 500, 500);
    var matFacesArray = [];
    var skyboxTexture = new THREE.TextureLoader().load( file );;
    //skyboxTexture.mapping = THREE.CubeReflectionMapping;

    for (var i = 0; i < 6; i++){
        matFacesArray.push(new THREE.MeshBasicMaterial({
            map: skyboxTexture,
            side: THREE.BackSide
        }));
    }

    var sky = new THREE.MeshFaceMaterial (matFacesArray);
    var skyBox = new THREE.Mesh(skyGeo, sky );
    scene.add ( skyBox );

}

function buildSkyBox2(){
    //skyboxTexture.mapping = THREE.CubeReflectionMapping;
    var urls = [
        "IMAGES/Skybox/Left.png", "IMAGES/Skybox/Right.png",
        "IMAGES/Skybox/Up.png", "IMAGES/Skybox/Down.png",
        "IMAGES/Skybox/Front.png", "IMAGES/Skybox/Back.png"
    ];

    var reflectionCube = new THREE.CubeTextureLoader().load( urls );
	reflectionCube.format = THREE.RGBFormat;

	scene.background = reflectionCube;

}

function buildLight(){
    renderer.setClearColor(new THREE.Color(0, 0, .3));

    var light = new THREE.DirectionalLight(0xffffff, .9);
    light.position.set(0,16,15);
    light.rotation.x = Math.PI/2;
    light.castShadow = true;
    light.target = camera;
    scene.add(light);

    scene.fog = new THREE.Fog(0xffffff, 30, 60);
}

function buildPlanes(){

    waterCamera = new THREE.CubeCamera(1, 10, 256);
    waterCamera.position.set(0,-4.25,0);
    scene.add(waterCamera);

    waterSurface = new THREE.PlaneGeometry(80, 80, 250, 250);
    var waterMaterial = new THREE.MeshPhongMaterial({
        vertexColors: THREE.VertexColors,
        color: 0xffffff,
        shading: THREE.SmoothShading,
        transparent: true,
        opacity: .75,
        reflectivity: 1.1,
        emissive: 0x111111,
        envMap: waterCamera.renderTarget.texture
    });

    waterMesh = new THREE.Mesh(waterSurface, waterMaterial);
    waterMesh.rotation.x = Math.PI * -.5;
    //waterMesh.rotation.z = Math.PI * -.25;
    waterMesh.position.y = -4.25;
    waterMesh.position.z = -20;
    scene.add(waterMesh);

    waterCamera.position = waterMesh.position;

    // load a texture, set wrap mode to repeat
    var pool_texture = new THREE.TextureLoader().load( "pool_texture.jpg" );
    pool_texture.mapping = THREE.UVMapping;
    pool_texture.wrapS = THREE.RepeatWrapping;
    pool_texture.wrapT = THREE.RepeatWrapping;
    pool_texture.repeat.set( 4, 4 );

    /*FIXME*/
        // load a texture, set wrap mode to repeat
        var pool_wall_texture = new THREE.TextureLoader().load( "pool_wall_texture2.jpg" );
        pool_wall_texture.mapping = THREE.UVMapping;
        pool_wall_texture.anisotropic =
        pool_wall_texture.wrapS = THREE.RepeatWrapping;
        pool_wall_texture.wrapT = THREE.RepeatWrapping;
        pool_wall_texture.repeat.set( 2, 2 );

    poolBottom = new THREE.PlaneGeometry(7.5,7.5,25,25);

    var bottomMaterial = new THREE.MeshPhongMaterial({
        map: pool_texture,
        // vertexColors: THREE.FaceColors,
        // color: 0xAAAAAA,
        shading: THREE.SmoothShading
    });

    poolBottomMesh = new THREE.Mesh(poolBottom, bottomMaterial);
    poolBottomMesh.rotation.x = Math.PI * -.5;
    poolBottomMesh.rotation.z = Math.PI * -.25;
    poolBottomMesh.position.y = -2.5;
    //scene.add(poolBottomMesh);

    poolWall1 = new THREE.PlaneGeometry(1.5,7.5,5,25);
    poolWall2 = new THREE.PlaneGeometry(1.5,7.5,25,5);
    var wallMaterial = new THREE.MeshPhongMaterial({
        map: pool_wall_texture,
        // vertexColors: THREE.FaceColors,
        // color: 0x888888,
        shading: THREE.SmoothShading
    });

    poolWall1Mesh = new THREE.Mesh(poolWall1, wallMaterial);
    poolWall2Mesh = new THREE.Mesh(poolWall2, wallMaterial);
    poolWall1Mesh.rotation.z = Math.PI * -.5;
    poolWall1Mesh.rotation.y = Math.PI * -.25;
    poolWall2Mesh.rotation.z = Math.PI * -.5;
    poolWall2Mesh.rotation.y = Math.PI * .25;

    poolWall1Mesh.position.set(2.65,-1.75,-2.65);
    poolWall2Mesh.position.set(-2.65,-1.75,-2.65);
    //scene.add(poolWall1Mesh);
    //scene.add(poolWall2Mesh)

    waterMesh.geometry.dynamic = true;
}

function updateWaves(){
    updateValues();

    var delta = clock.getDelta();
    var vertices = waterMesh.geometry.vertices;
    var faces = waterMesh.geometry.faces;

    for(var i = 0; i < vertices.length; i++){

        var z = sn.noise3d(vertices[i].x*waveDensity, vertices[i].y*waveDensity, waveSpeed * clock.getElapsedTime());

        var zz = sn.noise3d(vertices[i].y*choppiness, vertices[i].x*choppiness, waveSpeed * clock.getElapsedTime());

        var value = z*waveSize + zz*choppinessSize;

        waterMesh.geometry.vertices[i].z = value;

    }
    waterMesh.geometry.verticesNeedUpdate = true;
    waterMesh.geometry.computeFaceNormals();
    waterMesh.geometry.computeVertexNormals();

    waterCamera.updateCubeMap(renderer, scene);
}

function updateValues(){
    waveSize = document.getElementById("waveSizeRange").value;
    waveDensity = document.getElementById("waveDensityRange").value;
    choppinessSize = document.getElementById("choppinessRange").value;
    waveSpeed = document.getElementById("waveSpeedRange").value;
}

function animate() {
    setTimeout( function(){
        requestAnimationFrame(animate);
    }, 1000/45);

    updateWaves();

    renderer.render(scene, camera);
}
