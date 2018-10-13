uniform vec3 lightColor;
uniform vec3 ambientColor;
uniform vec3 lightPosition;
uniform float kAmbient;
uniform float kDiffuse;
uniform float kSpecular;
uniform float shininess;

varying vec3 viewVector;
varying vec3 normalVector;

void main() {
  vec3 lightVector = normalize(lightPosition);
  vec3 lightReflect = normalize(reflect(-lightVector,normalVector));
  vec3 halfVector = normalize(lightVector + viewVector);
  
  float diffuse = max (0.0, dot(normalVector, lightVector));

  float pi = 3.1415926;
  float alpha_square = 2.0/(shininess+2.0);
  float dotNM_square = dot(halfVector,normalVector)*dot(halfVector,normalVector);
  float denom = dotNM_square*(alpha_square-1.0)+1.0;
  float specular = max ( 0.0, alpha_square/(pi*denom*denom) );
  
  gl_FragColor = vec4(kAmbient * ambientColor + diffuse * lightColor * kDiffuse + lightColor * specular * kSpecular, 1.0);
}