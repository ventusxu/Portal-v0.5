varying vec3 viewVector;
varying vec3 normalVector;
varying vec2 vUv;
void main() {
  vUv = uv; // texture coordinates
  viewVector = normalize(vec3(projectionMatrix * modelViewMatrix * vec4(position,1.0)));
  normalVector = normalize(normalMatrix * normal);
  
  gl_Position = projectionMatrix *  modelViewMatrix * vec4(position, 1.0);
}