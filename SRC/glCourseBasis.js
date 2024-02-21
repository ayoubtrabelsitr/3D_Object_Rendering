
// =====================================================
var gl;

// =====================================================
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var rotMatrix = mat4.create();
var distCENTER;
// =====================================================

var OBJ1 = null;
var OBJ2 = null;
var PLANE = null;

/*************skybox********************** */

class skyBox {

	// --------------------------------------------
	constructor() {
		this.shaderName = 'skybox';
		this.loaded = -1;
		this.shader = null;
		this.initAll();
	}


	// --------------------------------------------
	initAll() {

		var L = 20.0;
		
		var vertices = [

			// bottom
			-L, L, -L,
			-L, -L, -L,
			L, -L, -L,
			L, -L, -L,
			L, L, -L,
			-L, L, -L,

			//Left
			-L, -L, L,
			-L, -L, -L,
			-L, L, -L,
			-L, L, -L,
			-L, L, L,
			-L, -L, L,

			// Right
			L, -L, -L,
			L, -L, L,
			L, L, L,
			L, L, L,
			L, L, -L,
			L, -L, -L,

			//Top
			-L, -L, L,
			-L, L, L,
			L, L, L,
			L, L, L,
			L, -L, L,
			-L, -L, L,

			//Back
			-L, L, -L,
			L, L, -L,
			L, L, L,
			L, L, L,
			-L, L, L,
			-L, L, -L,

			//Front
			-L, -L, -L,
			-L, -L, L,
			L, -L, -L,
			L, -L, -L,
			-L, -L, L,
			L, -L, L
		];




		this.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		this.vBuffer.itemSize = 3;
		this.vBuffer.numItems = 36;


		loadShaders(this);

		this.initCubeMapTexture();

	}


	initCubeMapTexture() {
		var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    const faceInfos = [
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: 'skybox/right.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: 'skybox/left.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: 'skybox/top.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: 'skybox/bottom.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: 'skybox/front.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: 'skybox/back.jpg' },
    ];

    faceInfos.forEach((faceInfo) => {
        const { target, url } = faceInfo;
        const level = 0;
        const internalFormat = gl.RGBA;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;

        const image = new Image();
        image.src = url;

        image.addEventListener('load', function () {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.texImage2D(target, level, internalFormat, format, type, image);
            // gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        });
    });

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);



	}




	//------------------------------------------------------------------

	setShadersParams() {




		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
		this.shader.skyBox = gl.getUniformLocation(this.shader, "skyBox");



	}

	// - -------------------------------------------
	setMatrixUniforms() {



		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, distCENTER);
		mat4.multiply(mvMatrix, rotMatrix);
		gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);


	}




	// --------------------------------------------
	draw() {
		if (this.shader && this.loaded == 4) {
			this.setShadersParams();
			this.setMatrixUniforms(this);

			gl.drawArrays(gl.TRIANGLES, 0, this.vBuffer.numItems);
		}
	}

}

/************************************* */

// =====================================================
// OBJET 3D, lecture fichier obj
// =====================================================

// Helper function to convert hex color to RGB format
function hexToRgb(hex) {
	const bigint = parseInt(hex.substring(1), 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return [r / 255, g / 255, b / 255];
}
class objmesh {

	// --------------------------------------------
	constructor(objFname) {
		this.objName = objFname;
		this.shaderName = 'obj';
		this.loaded = -1;
		this.shader = null;
		this.mesh = null;

		this.lightDirection = [1.0, 1.0, 1.0] // init light direction
		this.lightColor = [1.0, 1.0, 1.0] // init light Color
		this.surfaceColor = [0.8, 0.4, 0.4] // init surface color
		this.diffuseStrength = 3.0; // init diffuse strength
		this.cameraPosition = [0.0, 0.0, 0.0]; // init camera position
		this.roughness = 0.3; 	// init roughness 
		this.Ni = 1.0; // init index of refraction
		this.choix = 1; 

		loadObjFile(this);
		loadShaders(this);
		
	}

	setChoix(newChoix) {
		this.choix = newChoix;
	}
	setCameraPosition(newCameraPosition) {
		this.cameraPosition = newCameraPosition;
	}
	setLightDirection(newLightDirection) {
		this.lightDirection = newLightDirection;
	}
	setRoughness(newRoughness) {
		this.roughness = newRoughness;
	}
	setDiffuseStrength(newDiffuseStrength) {
		this.diffuseStrength = newDiffuseStrength;
	}
	setNi(newNi) {
		this.Ni = newNi;
	}

	setLightColor(newLightColor) {
		this.lightColor = hexToRgb(newLightColor);
	}

	setSurfaceColor(newSurfaceColor) {
		this.surfaceColor = hexToRgb(newSurfaceColor);
	}
	

	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.nAttrib = gl.getAttribLocation(this.shader, "aVertexNormal");
		gl.enableVertexAttribArray(this.shader.nAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.vertexAttribPointer(this.shader.nAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		


		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "uRMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");

		// Additional uniforms for Lambertian reflection model
		this.shader.lightDirection = gl.getUniformLocation(this.shader, "lightDirection");
		this.shader.lightColor = gl.getUniformLocation(this.shader, "lightColor");
		this.shader.surfaceColor = gl.getUniformLocation(this.shader, "surfaceColor");
		this.shader.diffuseStrength = gl.getUniformLocation(this.shader, "diffuseStrength");
		this.shader.roughness = gl.getUniformLocation(this.shader, "roughness");
		this.shader.Ni = gl.getUniformLocation(this.shader, "Ni");
		// Additional uniforms for camera
		this.shader.cameraPosition = gl.getUniformLocation(this.shader, "cameraPosition");

		this.shader.choix = gl.getUniformLocation(this.shader, "choix");
		

	}


	// --------------------------------------------
	setMatrixUniforms() {
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, distCENTER);
		mat4.multiply(mvMatrix, rotMatrix);
		gl.uniformMatrix4fv(this.shader.rMatrixUniform, false, rotMatrix);
		gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
		gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);

		// Set the lighting uniforms
		gl.uniform3fv(this.shader.lightDirection, this.lightDirection);
		gl.uniform3fv(this.shader.lightColor, this.lightColor);
		gl.uniform3fv(this.shader.surfaceColor, this.surfaceColor);
		gl.uniform1f(this.shader.diffuseStrength, this.diffuseStrength);
		gl.uniform1f(this.shader.roughness, this.roughness);
		gl.uniform1f(this.shader.Ni, this.Ni);
		// Set the camera uniforms
		gl.uniform3fv(this.shader.cameraPosition, this.cameraPosition);

		gl.uniform1f(this.shader.choix, this.choix);


	}

	// --------------------------------------------
	draw() {
		if (this.shader && this.loaded == 4 && this.mesh != null) {
			this.setShadersParams();
			this.setMatrixUniforms();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
			gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
	}
}



// =====================================================
// PLAN 3D, Support géométrique
// =====================================================

class plane {

	// --------------------------------------------
	constructor() {
		this.shaderName = 'plane';
		this.loaded = -1;
		this.shader = null;
		this.initAll();
	}

	// --------------------------------------------
	initAll() {
		let F = 1.0;
		let vertices = [
			-F, -F, 0.0,
			F, -F, 0.0,
			F, F, 0.0,
			-F, F, 0.0
		];

		var texcoords = [
			0.0, 0.0,
			0.0, 1.0,
			1.0, 1.0,
			1.0, 0.0
		];

		this.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		this.vBuffer.itemSize = 3;
		this.vBuffer.numItems = 4;

		this.tBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
		this.tBuffer.itemSize = 2;
		this.tBuffer.numItems = 4;

		loadShaders(this);
	}


	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.tAttrib = gl.getAttribLocation(this.shader, "aTexCoords");
		gl.enableVertexAttribArray(this.shader.tAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.vertexAttribPointer(this.shader.tAttrib, this.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");

		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, distCENTER);
		mat4.multiply(mvMatrix, rotMatrix);

		gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
	}

	// --------------------------------------------
	draw() {
		if (this.shader && this.loaded == 4) {
			this.setShadersParams();

			gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vBuffer.numItems);
			gl.drawArrays(gl.LINE_LOOP, 0, this.vBuffer.numItems);
		}
	}

}


// =====================================================
// FONCTIONS GENERALES, INITIALISATIONS
// =====================================================



// =====================================================
function initGL(canvas) {
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		gl.viewport(0, 0, canvas.width, canvas.height);

		gl.clearColor(0.7, 0.7, 0.7, 1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);
	} catch (e) { }
	if (!gl) {
		console.log("Could not initialise WebGL");
	}
}


// =====================================================
loadObjFile = function (OBJ3D) {
	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function () {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			var tmpMesh = new OBJ.Mesh(xhttp.responseText);
			OBJ.initMeshBuffers(gl, tmpMesh);
			OBJ3D.mesh = tmpMesh;
		}
	}

	xhttp.open("GET", OBJ3D.objName, true);
	xhttp.send();
}



// =====================================================
function loadShaders(Obj3D) {
	loadShaderText(Obj3D, '.vs');
	loadShaderText(Obj3D, '.fs');
}

// =====================================================
function loadShaderText(Obj3D, ext) {   // lecture asynchrone...
	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function () {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			if (ext == '.vs') { Obj3D.vsTxt = xhttp.responseText; Obj3D.loaded++; }
			if (ext == '.fs') { Obj3D.fsTxt = xhttp.responseText; Obj3D.loaded++; }
			if (Obj3D.loaded == 2) {
				Obj3D.loaded++;
				compileShaders(Obj3D);
				Obj3D.loaded++;
			}
		}
	}

	Obj3D.loaded = 0;
	xhttp.open("GET", Obj3D.shaderName + ext, true);
	xhttp.send();
}

// =====================================================
function compileShaders(Obj3D) {
	Obj3D.vshader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(Obj3D.vshader, Obj3D.vsTxt);
	gl.compileShader(Obj3D.vshader);
	if (!gl.getShaderParameter(Obj3D.vshader, gl.COMPILE_STATUS)) {
		console.log("Vertex Shader FAILED... " + Obj3D.shaderName + ".vs");
		console.log(gl.getShaderInfoLog(Obj3D.vshader));
	}

	Obj3D.fshader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(Obj3D.fshader, Obj3D.fsTxt);
	gl.compileShader(Obj3D.fshader);
	if (!gl.getShaderParameter(Obj3D.fshader, gl.COMPILE_STATUS)) {
		console.log("Fragment Shader FAILED... " + Obj3D.shaderName + ".fs");
		console.log(gl.getShaderInfoLog(Obj3D.fshader));
	}

	Obj3D.shader = gl.createProgram();
	gl.attachShader(Obj3D.shader, Obj3D.vshader);
	gl.attachShader(Obj3D.shader, Obj3D.fshader);
	gl.linkProgram(Obj3D.shader);
	if (!gl.getProgramParameter(Obj3D.shader, gl.LINK_STATUS)) {
		console.log("Could not initialise shaders");
		console.log(gl.getShaderInfoLog(Obj3D.shader));
	}
}


// =====================================================
function webGLStart() {

	var canvas = document.getElementById("WebGL-test");

	canvas.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;
	canvas.onwheel = handleMouseWheel;

	initGL(canvas);

	mat4.perspective(60, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.identity(rotMatrix);
	mat4.rotate(rotMatrix, rotX, [1, 0, 0]);
	mat4.rotate(rotMatrix, rotY, [0, 0, 1]);

	distCENTER = vec3.create([0, -0.2, -3]);
	
	PLANE = new plane();
	OBJ3 = new objmesh('sphere.obj');
	OBJ1 = new objmesh('porsche.obj');
	OBJ2 = new objmesh("bunny.obj");
	skybox = new skyBox();
	tick();
}

// =====================================================
function drawScene() {
	gl.clear(gl.COLOR_BUFFER_BIT);

	// PLANE.draw();
	//OBJ1.draw();
	// OBJ2.draw();
	
	OBJ3.draw();
	skybox.draw();

}

function updateObject() {

	const cameraPositionInput1 = document.getElementById("cameraPositionInput1").value;
	const cameraPositionInput2 = document.getElementById("cameraPositionInput2").value;
	const cameraPositionInput3 = document.getElementById("cameraPositionInput3").value;
	const cameraPositionInput = cameraPositionInput1 + ", " + cameraPositionInput3 + ", " + cameraPositionInput2;

	// Retrieve values from input fields
	const lightDirectionInput1 = document.getElementById("lightDirectionInput1").value;
	const lightDirectionInput2 = document.getElementById("lightDirectionInput2").value;
	const lightDirectionInput3 = document.getElementById("lightDirectionInput3").value;
	const lightDirectionInput = lightDirectionInput1 + ", " + lightDirectionInput3 + ", " + lightDirectionInput2;
	const lightColorInput = document.getElementById("lightColorPicker").value;
	const surfaceColorInput = document.getElementById("surfaceColorPicker").value;
	const diffuseStrengthInput = parseFloat(document.getElementById("diffuseStrengthInput").value);
	const roughnessInput = parseFloat(document.getElementById("roughnessInput").value);
	const NiInput = parseFloat(document.getElementById("NiInput").value);
	OBJ3.setCameraPosition(cameraPositionInput.split(',').map(parseFloat));
	OBJ3.setLightDirection(lightDirectionInput.split(',').map(parseFloat));
	OBJ3.setLightColor(lightColorInput);
	OBJ3.setSurfaceColor(surfaceColorInput);
	OBJ3.setDiffuseStrength(diffuseStrengthInput);
	OBJ3.setRoughness(roughnessInput);
	OBJ3.setNi(NiInput);

	OBJ3.draw();
}

document.getElementById("objects").addEventListener("change", function (e) {
	OBJ3 = new objmesh(e.target.value + '.obj');
	updateObject();
});

document.getElementById("choix").addEventListener("change", function (e) {
	
	if(e.target.value=="Opaque"){
		OBJ3.setChoix(1.0);
	} 
	if(e.target.value=="Mirror"){
		OBJ3.setChoix(2.0);
	}
	if(e.target.value=="Transparant"){
		OBJ3.setChoix(3.0);
	}
	
	updateObject();
});