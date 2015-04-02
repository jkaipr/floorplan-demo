var Pulsar = Pulsar || {};

$(function() {
	Pulsar.Floorplan.init();
    var sampleJSON = {boxes: [
        {name: 'Switch rack 1', pos: {x: 120, y: 0, z: 120}, dim: {x: 60.0, y: 201.3, z: 100.0}, textures: {front: 'texture_switch_front_120.jpg', back: 'texture_switch_back_120.jpg'}},
        {name: 'Server rack 1', pos: {x: 230, y: 0, z: 120}, dim: {x: 80.0, y: 201.3, z: 100.0}, textures: {front: 'texture_nec_front_160.png', back: 'texture_nec_back_160.jpg'}},
        {name: 'Server rack 2', pos: {x: 350, y: 0, z: 120}, dim: {x: 80.0, y: 201.3, z: 100.0}, textures: {front: 'texture_nec_front_160.png', back: 'texture_nec_back_160.jpg'}},
        {name: 'Switch rack 2', pos: {x: 120, y: 0, z: 360}, dim: {x: 60.0, y: 201.3, z: 100.0}, textures: {front: 'texture_switch_front_120.jpg', back: 'texture_switch_back_120.jpg'}},
        {name: 'Server rack 3', pos: {x: 230, y: 0, z: 360}, dim: {x: 80.0, y: 201.3, z: 100.0}, textures: {front: 'texture_nec_front_160.png', back: 'texture_nec_back_160.jpg'}},
        {name: 'Server rack 4', pos: {x: 350, y: 0, z: 360}, dim: {x: 80.0, y: 201.3, z: 100.0}, textures: {front: 'texture_nec_front_160.png', back: 'texture_nec_back_160.jpg'}},
        {name: 'Clima', pos: {x: 180, y: 0, z: 0}, dim: {x: 240.0, y: 201.3, z: 60.0}, textures: {front: 'texture_clima_front_480.png', back: 'texture_nec_back_160.jpg', top: 'texture_clima_top_120.png'}},
        {name: 'Clima tile 1', pos: {x: 120, y: 0, z: 240}, dim: {x: 60.0, y: 1.0, z: 60.0}, textures: {top: 'texture_clima_floor_tile_120.png'}},
        {name: 'Clima tile 2', pos: {x: 240, y: 0, z: 240}, dim: {x: 60.0, y: 1.0, z: 60.0}, textures: {top: 'texture_clima_floor_tile_120.png'}},
        {name: 'Clima tile 3', pos: {x: 360, y: 0, z: 240}, dim: {x: 60.0, y: 1.0, z: 60.0}, textures: {top: 'texture_clima_floor_tile_120.png'}},
        {name: 'Clima tile 4', pos: {x: 120, y: 0, z: 480}, dim: {x: 60.0, y: 1.0, z: 60.0}, textures: {top: 'texture_clima_floor_tile_120.png'}},
        {name: 'Clima tile 5', pos: {x: 240, y: 0, z: 480}, dim: {x: 60.0, y: 1.0, z: 60.0}, textures: {top: 'texture_clima_floor_tile_120.png'}},
        {name: 'Clima tile 6', pos: {x: 360, y: 0, z: 480}, dim: {x: 60.0, y: 1.0, z: 60.0}, textures: {top: 'texture_clima_floor_tile_120.png'}}
    ]};
	Pulsar.Floorplan.addBoxesFromJSON(sampleJSON);
	Pulsar.Floorplan.render();
	setTimeout(Pulsar.Floorplan.render, 100);
});

Pulsar.Floorplan = function() {
	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

	var container, info;
	var camera, scene, renderer, controls;
	var plane, intersected;
	var mouse, raycaster;

    var radious = 1600, theta = -90, phi = 90,
        gridCellSize = 60, gridLines = 10;
    var gridDimension = gridLines * gridCellSize / 2;

	var cubeGeo, cubeMaterial;

	var objects = [];

    // spline test
    var heatflow = function() {
        var spline, particles = [], lineEndTouched = false;

        /**
         *
         * @param position
         * @param size
         * @param color
         * @param speed from 1 to 1000
         * @returns heatParticle object
         */
        function makeHeatParticle(position, size, color, speed, spline) {
            // #030FE6 dark blue
            // #02FCFB light blue
            // #02FCFB middle green
            // #F1FF02 yellow
            // #F30000 red

            var tangent = new THREE.Vector3();
            var axis = new THREE.Vector3();
            var up = new THREE.Vector3(0, 1, 0);
            var increment = speed/1000.0;
            var counter = 2 * increment, heatParticle = {};
            heatParticle.spline = spline;
            //heatParticle.geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
            // API: THREE.CylinderGeometry(bottomRadius, topRadius, height, segmentsRadius, segmentsHeight)
            heatParticle.geometry = new THREE.CylinderGeometry(0, 5, 10, 5, 4, false);

            heatParticle.material = new THREE.MeshBasicMaterial({
                color: color,
                opacity: 0.0,
                transparent: true
            });

            heatParticle.mesh = new THREE.Mesh(heatParticle.geometry, heatParticle.material);
            heatParticle.move = function () {
                if (counter <= 1) {
                    var rgb = Pulsar.Color.gradientPointColor(counter, Pulsar.Color.hexToRgb('#02FCFB'), Pulsar.Color.hexToRgb('#030FE6'));

                    heatParticle.mesh.material =  new THREE.MeshBasicMaterial({
                        color: Pulsar.Color.rgbToHex(rgb),
                        opacity: 0.5,
                        transparent: true
                    });
                    //heatParticle.mesh.material.color.setRGB(rgb.r, rgb.g, rgb.b);
                    //heatParticle.mesh.material.color = Pulsar.Color.rgbToHex(rgb);
                    //heatParticle.material.color.setRGB(rgb.r, rgb.g, rgb.b);
                    heatParticle.mesh.position.copy(heatParticle.spline.spline.getPointAt(counter));
                    tangent = heatParticle.spline.spline.getTangentAt(counter).normalize();
                    axis.crossVectors(up, tangent).normalize();
                    var radians = Math.acos(up.dot(tangent));
                    heatParticle.mesh.quaternion.setFromAxisAngle(axis, radians);
                    counter += increment;
                } else {
                    lineEndTouched = true;
                    counter = 2 * increment;
                }
            };
            particles.push(heatParticle);
            return heatParticle;
        }

        function makeSpline(points) {
            var thisSpline = {};
            thisSpline.numPoints = 50;

            thisSpline.spline = new THREE.SplineCurve3(points);

            thisSpline.material = new THREE.LineBasicMaterial({
                visible: false
            });

            thisSpline.geometry = new THREE.Geometry();
            thisSpline.splinePoints = thisSpline.spline.getPoints(thisSpline.numPoints);

            for (var i = 0; i < thisSpline.splinePoints.length; i++) {
                thisSpline.geometry.vertices.push(thisSpline.splinePoints[i]);
            }
            thisSpline.line = new THREE.Line(thisSpline.geometry, thisSpline.material);
            return thisSpline;
        }



        var that = {
            init: function () {
                $.each([
                    [[-50, -55, -90], [-30, -40, -95], [-10, -30, -100]],
                    [[190, 185, 150], [210, 200, 145], [230, 210, 140]]], function(idxZ, zValues) { // z axis
                    $.each([110, 90, 70, -10, -30, -50, -130, -150, -170], function(idxX, xValue) { //
                        that.addLine([
                            new THREE.Vector3(xValue, 0, zValues[0][0]),
                            new THREE.Vector3(xValue, 80, zValues[0][1]),
                            new THREE.Vector3(xValue, 100, zValues[0][2])
                        ]);
                        that.addLine([
                            new THREE.Vector3(xValue, 0, zValues[1][0]),
                            new THREE.Vector3(xValue, 100, zValues[1][1]),
                            new THREE.Vector3(xValue, 120, zValues[1][2])
                        ]);
                        that.addLine([
                            new THREE.Vector3(xValue, 0, zValues[2][0]),
                            new THREE.Vector3(xValue, 120, zValues[2][1]),
                            new THREE.Vector3(xValue, 140, zValues[2][2])
                        ]);
                    });
                });

                that.animate();
                setInterval(that.moveParticles, 40);
            },
            addLine: function(points) {
                var line = makeSpline(points);
                scene.add(line.line);

                //var box1 = makeHeatParticle({}, {x:5,y:5,z:5}, 0xff0000, 5, line);
                //scene.add(box1.mesh);

                var boxIntervalId = setInterval(function() {
                    if (lineEndTouched) {
                        clearInterval(boxIntervalId);
                    } else {
                        that.addHeatParticle(line);
                    }
                }, 500);
            },
            addHeatParticle: function(line) {
                var particle = makeHeatParticle({}, {x:5,y:5,z:5}, 0xff0000, 20, line);
                scene.add(particle.mesh);
            },
            moveParticles: function() {
                $.each(particles, function() {
                    this.move();
                });
            },
            animate: function() {
                requestAnimationFrame(that.animate);
                render();
            }
        };
        return that;
    }();

    function init() {
		container = document.createElement( 'div' );
		document.body.appendChild( container );

        info = document.createElement( 'div' );
        info.style.position = 'absolute';
        info.style.top = '10px';
        info.style.width = '100%';
        info.style.textAlign = 'center';
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

        Pulsar.Floorplan.Heatflow.init();
		document.addEventListener( 'mousemove', onDocumentMouseMove, false );
        //document.addEventListener( 'mouseup', onDocumentMouseUp, false );
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

    function onDocumentMouseUp(event) {
        event.preventDefault();

        mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
        raycaster.setFromCamera( mouse, camera );

        var intersects = raycaster.intersectObjects( scene.children );
        if ( intersects.length > 0 ) {
            if ( intersected != intersects[ 0 ].object ) {
                intersected = intersects[ 0 ].object;

                var gui = new dat.GUI();
                gui.add(intersected, 'name');
                gui.add(intersected, 'position');

            }
        }
        render();
    }

	function render() {
		renderer.render( scene, camera );
	}

    function addBox(position, dimensions, textures, name) {
        cubeGeo = new THREE.BoxGeometry( dimensions.x , dimensions.y , dimensions.z );
        var colorMaterial = new THREE.MeshLambertMaterial({
            color: 0xcad1d8, shading: THREE.FlatShading
        });
        if (textures.front) {
            var frontTexture = THREE.ImageUtils.loadTexture('/assets/' + textures.front);
            frontTexture.minFilter = THREE.LinearFilter;
        }
        if (textures.back) {
            var backTexture = THREE.ImageUtils.loadTexture('/assets/'  + textures.back);
            backTexture.minFilter = THREE.LinearFilter;
        }
        if (textures.top) {
            var topTexture = THREE.ImageUtils.loadTexture('/assets/'  + textures.top);
            topTexture.minFilter = THREE.LinearFilter;
        }
        var materials = [
            colorMaterial,
            colorMaterial,
            topTexture ? new THREE.MeshLambertMaterial({
                color: 0xcad1d8, shading: THREE.FlatShading,
                map: topTexture
            }) : colorMaterial,
            colorMaterial,
            frontTexture ? new THREE.MeshLambertMaterial({
                color: 0xcad1d8, shading: THREE.FlatShading,
                map: frontTexture
            }) : colorMaterial,
            backTexture ? new THREE.MeshLambertMaterial({
                color: 0xcad1d8, shading: THREE.FlatShading,
                map: backTexture
            }) : colorMaterial
        ];
        cubeMaterial = new THREE.MeshFaceMaterial( materials );

        var voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
        if (name) voxel.name = name;
        position = { x: position.x - gridDimension + dimensions.x / 2, y: position.y + dimensions.y / 2, z: position.z - gridDimension + dimensions.z / 2};
        voxel.position.copy( position );
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
    this.Heatflow = heatflow;
	return this;
}();