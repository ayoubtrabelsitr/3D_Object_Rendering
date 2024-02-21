
precision mediump float;
uniform samplerCube skyBox;
varying vec3 texCoord;
// uniform mat4 uPMatrix;

void main(void)
{
	vec3 t = vec3(texCoord.x, texCoord.z, texCoord.y);
	gl_FragColor = textureCube(skyBox, t); 

}