varying vec3 viewVector;
varying vec3 normalVector;

void main() {
  viewVector = normalize(vec3(projectionMatrix * modelViewMatrix * vec4(position,1.0)));
  normalVector = normalize(normalMatrix * normal);
  
  gl_Position = projectionMatrix *  modelViewMatrix * vec4(position, 1.0);
}