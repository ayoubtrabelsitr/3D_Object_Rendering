attribute vec3 aVertexPosition;



uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec3 texCoord;



void main(void) {
	texCoord = aVertexPosition;
	vec4 pos =  uPMatrix * uMVMatrix *  vec4(texCoord , 1.0);
	gl_Position =  pos.xyzw;
	
}