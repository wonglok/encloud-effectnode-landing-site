export const ballify = /* glsl */ `
  // -----
  #define M_PI 3.1415926535897932384626433832795
  float atan2 (in float y, in float x) {
    bool xgty = (abs(x) > abs(y));
    return mix(M_PI/2.0 - atan(x,y), atan(y,x), float(xgty));
  }

  // ------
  vec3 fromBall (float r, float az, float el) {
    return vec3(
      r * cos(el) * cos(az),
      r * cos(el) * sin(az),
      r * sin(el)
    );
  }

  void toBall (vec3 pos, out float az, out float el) {
    az = atan2(pos.y, pos.x);
    el = atan2(pos.z, sqrt(pos.x * pos.x + pos.y * pos.y));
  }

  // float az = 0.0;
  // float el = 0.0;
  // vec3 noiser = vec3(lastVel);
  // toBall(noiser, az, el);
  // lastVel.xyz = fromBall(1.0, az, el);

  vec3 ballify (vec3 pos, float r) {
    float az = atan2(pos.y, pos.x);
    float el = atan2(pos.z, sqrt(pos.x * pos.x + pos.y * pos.y));
    return vec3(
      r * cos(el) * cos(az),
      r * cos(el) * sin(az),
      r * sin(el)
    );
  }
`;

export const transform3 = /* glsl */ `
  mat3 rotateQ (vec3 axis, float rad) {
    float hr = rad / 2.0;
    float s = sin( hr );
    vec4 q = vec4(axis * s, cos( hr ));
    vec3 q2 = q.xyz + q.xyz;
    vec3 qq2 = q.xyz * q2;
    vec2 qx = q.xx * q2.yz;
    float qy = q.y * q2.z;
    vec3 qw = q.w * q2.xyz;

    return mat3(
      1.0 - (qq2.y + qq2.z),  qx.x - qw.z,            qx.y + qw.y,
      qx.x + qw.z,            1.0 - (qq2.x + qq2.z),  qy - qw.x,
      qx.y - qw.y,            qy + qw.x,              1.0 - (qq2.x + qq2.y)
    );
  }

  mat3 rotateX (float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat3(
      1.0, 0.0, 0.0,
      0.0, c, s,
      0.0, -s, c
    );
  }

  mat3 rotateY (float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat3(
      c, 0.0, -s,
      0.0, 1.0, 0.0,
      s, 0.0, c
    );
  }

  mat3 rotateZ (float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat3(
      c, s, 0.0,
      -s, c, 0.0,
      0.0, 0.0, 1.0
    );
  }
`;

export const transform4 = /* glsl */ `
  mat4 rotationX( in float angle ) {
    return mat4(	1.0,		0,			0,			0,
            0, 	cos(angle),	-sin(angle),		0,
            0, 	sin(angle),	 cos(angle),		0,
            0, 			0,			  0, 		1);
  }

  mat4 rotationY( in float angle ) {
    return mat4(	cos(angle),		0,		sin(angle),	0,
                0,		1.0,			 0,	0,
            -sin(angle),	0,		cos(angle),	0,
                0, 		0,				0,	1);
  }

  mat4 rotationZ( in float angle ) {
    return mat4(	cos(angle),		-sin(angle),	0,	0,
            sin(angle),		cos(angle),		0,	0,
                0,				0,		1,	0,
                0,				0,		0,	1);
  }
  mat4 scale(float x, float y, float z){
      return mat4(
          vec4(x,   0.0, 0.0, 0.0),
          vec4(0.0, y,   0.0, 0.0),
          vec4(0.0, 0.0, z,   0.0),
          vec4(0.0, 0.0, 0.0, 1.0)
      );
  }

  mat4 translate(float x, float y, float z){
      return mat4(
          vec4(1.0, 0.0, 0.0, 0.0),
          vec4(0.0, 1.0, 0.0, 0.0),
          vec4(0.0, 0.0, 1.0, 0.0),
          vec4(x,   y,   z,   1.0)
      );
  }
`;

export const toolset = /* glsl */ `

  ${ballify}
  ${transform3}
  ${transform4}

`;
