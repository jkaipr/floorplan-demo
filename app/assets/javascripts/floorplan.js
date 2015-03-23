var Pulsar = Pulsar || {};

$(function() {
	Pulsar.Floorplan.init();
    sampleJSON = {boxes: [
        {name: 'Switch rack 1', pos: {x: 100, y: 0, z: 100}, dim: {x: 60.0, y: 201.3, z: 100.0}, textures: {front: 'texture_switch_front_120.jpg', back: 'texture_switch_back_120.jpg'}},
        {name: 'Server rack 1', pos: {x: 210, y: 0, z: 100}, dim: {x: 80.0, y: 201.3, z: 100.0}, textures: {front: 'texture_nec_front_160.png', back: 'texture_nec_back_160.jpg'}},
        {name: 'Server rack 2', pos: {x: 340, y: 0, z: 100}, dim: {x: 80.0, y: 201.3, z: 100.0}, textures: {front: 'texture_nec_front_160.png', back: 'texture_nec_back_160.jpg'}},
        {name: 'Switch rack 2', pos: {x: 100, y: 0, z: 400}, dim: {x: 60.0, y: 201.3, z: 100.0}, textures: {front: 'texture_switch_front_120.jpg', back: 'texture_switch_back_120.jpg'}},
        {name: 'Server rack 3', pos: {x: 210, y: 0, z: 400}, dim: {x: 80.0, y: 201.3, z: 100.0}, textures: {front: 'texture_nec_front_160.png', back: 'texture_nec_back_160.jpg'}},
        {name: 'Server rack 4', pos: {x: 340, y: 0, z: 400}, dim: {x: 80.0, y: 201.3, z: 100.0}, textures: {front: 'texture_nec_front_160.png', back: 'texture_nec_back_160.jpg'}}]
    };
	Pulsar.Floorplan.addBoxesFromJSON(sampleJSON);
	Pulsar.Floorplan.render();
	setTimeout(Pulsar.Floorplan.render, 100);
});

Pulsar.Floorplan = function() {
	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

	var container, info;
	var camera, scene, renderer, controls;
	var plane, cube, intersected;
	var mouse, raycaster, isShiftDown = false;

    var onMouseDownPosition, isMouseDown = false,
        radious = 1600, theta = -90, onMouseDownTheta = -90, phi = 90, onMouseDownPhi = 90,
        gridCellSize = 60, gridLines = 10;
    var gridDimension = gridLines * gridCellSize / 2;

	var rollOverMesh, rollOverMaterial;
	var cubeGeo, cubeMaterial;

	var objects = [];

	function init() {
		container = document.createElement( 'div' );
		document.body.appendChild( container );

        info = document.createElement( 'div' );
        info.style.position = 'absolute';
        info.style.top = '10px';
        info.style.width = '100%';
        info.style.textAlign = 'center';
        //info.innerHTML = '<a href="http://threejs.org" target="_blank">three.js</a> - voxel painter - webgl<br><strong>click</strong>: add voxel, <strong>shift + click</strong>: remove voxel';
        container.appendChild( info );

        // camera
        camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.x = radious * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 ); //515;
        camera.position.y = radious * Math.sin( phi * Math.PI / 360 ); //850;
        camera.position.z = radious * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 ); //-515;
        camera.lookAt(new THREE.Vector3 (0.0, 50.0, 0.0));
        camera.updateProjectionMatrix();

        // controls
        controls = new THREE.OrbitControls( camera );
        controls.damping = 0.2;
        controls.minPolarAngle = 0;
        controls.maxPolarAngle = Math.PI/2;
        controls.addEventListener( 'change', render );

		scene = new THREE.Scene();

		// grid
		var geometry = new THREE.Geometry();
		for ( var i = - gridDimension; i <= gridDimension; i += gridCellSize ) {
			geometry.vertices.push( new THREE.Vector3( - gridDimension, 0, i ) );
			geometry.vertices.push( new THREE.Vector3(   gridDimension, 0, i ) );

			geometry.vertices.push( new THREE.Vector3( i, 0, - gridDimension ) );
			geometry.vertices.push( new THREE.Vector3( i, 0,   gridDimension ) );
		}

		var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2, transparent: true } );

		var line = new THREE.Line( geometry, material, THREE.LinePieces );
		scene.add( line );

		raycaster = new THREE.Raycaster();
		mouse = new THREE.Vector2();

		var geometry = new THREE.PlaneBufferGeometry( 1000, 1000 );
		geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

		plane = new THREE.Mesh( geometry );
		plane.visible = false;
		scene.add( plane );

		objects.push( plane );

		// Lights
		var ambientLight = new THREE.AmbientLight( 0x606060 );
		scene.add( ambientLight );

		var directionalLight = new THREE.DirectionalLight( 0xffffff );
		directionalLight.position.set( -10, 7.5, 10 ).normalize();
		scene.add( directionalLight );

		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setClearColor( 0xf0f0f0 );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		container.appendChild( renderer.domElement );

        onMouseDownPosition = new THREE.Vector2();

		document.addEventListener( 'mousemove', onDocumentMouseMove, false );
		//document.addEventListener( 'mousedown', onDocumentMouseDown, false );
        //document.addEventListener( 'mouseup', onDocumentMouseUp, false );
        //document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
        document.addEventListener( 'keydown', onDocumentKeyDown, false );
		document.addEventListener( 'keyup', onDocumentKeyUp, false );
		//

		window.addEventListener( 'resize', onWindowResize, false );
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}

	function onDocumentMouseMove( event ) {
		event.preventDefault();

		mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
		raycaster.setFromCamera( mouse, camera );

        if (isMouseDown) {
            theta = - ( ( event.clientX - onMouseDownPosition.x ) * 0.5 ) + onMouseDownTheta;
            phi = ( ( event.clientY - onMouseDownPosition.y ) * 0.5 ) + onMouseDownPhi;
            phi = Math.min( 180, Math.max( 0, phi ) );

            camera.position.x = radious * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
            camera.position.y = radious * Math.sin( phi * Math.PI / 360 );
            camera.position.z = radious * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
            camera.updateMatrix();
        } else {
            //var intersects = raycaster.intersectObjects( objects );
            //if ( intersects.length > 0 ) {
            //    var intersect = intersects[ 0 ];
            //    rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
            //    rollOverMesh.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
            //}
        }

        var intersects = raycaster.intersectObjects( scene.children );
        if ( intersects.length > 0 ) {
            if ( intersected != intersects[ 0 ].object ) {
                intersected = intersects[ 0 ].object;
                if (intersected.name) {
                    info.innerHTML = '<p>Name: ' + intersected.name + '</p>';
                } else {
                    info.innerHTML = '';
                }
            }
        }

		render();
	}

	function onDocumentMouseDown( event ) {
		event.preventDefault();
        isMouseDown = true;

		mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
		raycaster.setFromCamera( mouse, camera );

        onMouseDownTheta = theta;
        onMouseDownPhi = phi;
        onMouseDownPosition.x = event.clientX;
        onMouseDownPosition.y = event.clientY;

		//var intersects = raycaster.intersectObjects( objects );
		//if ( intersects.length > 0 ) {
		//	var intersect = intersects[ 0 ];
        //
		//	// delete cube
		//	if ( isShiftDown ) {
		//		if ( intersect.object != plane ) {
		//			scene.remove( intersect.object );
		//			objects.splice( objects.indexOf( intersect.object ), 1 );
		//		}
        //
		//	// create cube
		//	} else {
		//		var voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
		//		voxel.position.copy( intersect.point ).add( intersect.face.normal );
		//		voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
		//		scene.add( voxel );
		//		objects.push( voxel );
		//	}
		//	render();
		//}
	}

    function onDocumentMouseUp(event) {
        event.preventDefault();

        isMouseDown = false;
        onMouseDownPosition.x = event.clientX - onMouseDownPosition.x;
        onMouseDownPosition.y = event.clientY - onMouseDownPosition.y;

        if (onMouseDownPosition.length() > 5) {
            return;
        }

        //interact();
        render();
    }

    function onDocumentMouseWheel(event) {
        radious -= event.wheelDeltaY;

        var x = radious * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
        var y = radious * Math.sin( phi * Math.PI / 360 );
        if (Math.abs(x) + Math.abs(y) > 300) {
            camera.position.x = x;
            camera.position.y = y;
            camera.position.z = radious * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
            camera.updateMatrix();

            //interact();
            render();
        } else {
            radious += event.wheelDeltaY;
        }
    }

	function onDocumentKeyDown( event ) {
		switch( event.keyCode ) {
			case 16: isShiftDown = true; break;
		}
	}

	function onDocumentKeyUp( event ) {
		switch ( event.keyCode ) {
			case 16: isShiftDown = false; break;
		}
	}

	function render() {
		renderer.render( scene, camera );
	}

    function addBox(position, dimensions, textures, name) {
        cubeGeo = new THREE.BoxGeometry( dimensions.x , dimensions.y , dimensions.z );
        var materials = [
            new THREE.MeshLambertMaterial({
                color: 0xcad1d8, shading: THREE.FlatShading
            }),
            new THREE.MeshLambertMaterial({
                color: 0xcad1d8, shading: THREE.FlatShading
            }),
            new THREE.MeshLambertMaterial({
                color: 0xcad1d8, shading: THREE.FlatShading
            }),
            new THREE.MeshLambertMaterial({
                color: 0xcad1d8, shading: THREE.FlatShading
            }),
            new THREE.MeshLambertMaterial({
                color: 0xcad1d8, shading: THREE.FlatShading,
                map: THREE.ImageUtils.loadTexture('/assets/' + textures.front)
            }),
            new THREE.MeshLambertMaterial({
                color: 0xcad1d8, shading: THREE.FlatShading,
                map: THREE.ImageUtils.loadTexture('/assets/'  + textures.back)
            })
        ];
        cubeMaterial = new THREE.MeshFaceMaterial( materials );

        var voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
        if (name) voxel.name = name;
        position = { x: position.x - gridDimension + dimensions.x / 2, y: position.y + dimensions.y / 2, z: position.z - gridDimension + dimensions.z / 2};
        voxel.position.copy( position ); //.add( intersect.face.normal );
        //voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
        scene.add( voxel );
        objects.push( voxel );
        render();
    }

    function addBoxesFromJSON(json) {
        $.each(json.boxes, function(i, box) {
            Pulsar.Floorplan.addBox(box.pos, box.dim, box.textures, box.name);
        });
    }

    this.addBox = addBox;
    this.addBoxesFromJSON = addBoxesFromJSON;
	this.init = init;
	this.render = render;
	return this;
}();