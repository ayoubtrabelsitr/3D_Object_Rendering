precision mediump float;

#define PI 3.141592

varying vec4 pos3D;
varying vec3 N;
uniform samplerCube skyboxTexture;
uniform vec3 lightDirection ;
uniform vec3 lightColor ;
uniform vec3 cameraPosition ;
uniform vec3 surfaceColor ; 
uniform float diffuseStrength ; 
uniform float roughness ; 
uniform float Ni; 
uniform float choix;
vec3 L; // Light vector
vec3 V_CT; // view vector (cook torrance)
vec3 V; // view vector
vec3 H; // halfWay vector
vec3 Ks; // Fraction of reflectance that is specular
vec3 Kd; // Fraction of reflectance that is diffuse




////Beckman Distrubution
float D(vec3 H, vec3 N,float roughness){

	float sigma = pow(roughness,2.0);
	float cosTheta = max(0.0, dot(N,H));

	float val1  = exp(-(((1.0/pow(cosTheta,2.0))-1.0)/max(0.00001,2.0 * pow(sigma,2.0))));
	//
	float val2 = PI * max(0.00001,2.0 * pow(sigma,2.0)) * pow(cosTheta,4.0);

	float D = val1/val2;
	return D ;

}

// /// geometrical attenuation factor G
float G(vec3 L,vec3 V,vec3 H,vec3 N){

	float val1=(2.0*(dot(N,H)*dot(N,V)))/(dot(V,H));
	float val2=(2.0*(dot(N,H)*dot(N,L)))/(dot(V,H));

	float G = min(min(1.0,val1),val2);
	return G ;
}
// /// Fresnel Factor 
vec3 F(vec3 V,vec3 H,float Ni){
	float c=max(0.0,dot(V,H));
	
	float g=sqrt((pow(Ni,2.0))+(pow(c,2.0))-1.0);
	vec3 F=vec3((1.0/2.0)*(pow(g-c,2.0))/pow(g+c,2.0)*(1.0+((pow(c*(g+c)-1.0,2.0))/(pow(c*(g-c)+1.0,2.0)))));
	return F;
}

// ///// Specular (cook-torrance) 
vec3 CookTorrance(vec3 L,vec3 V,vec3 N,vec3 H, float Ni, float roughness){

	
	vec3 F = F(L,H,Ni);
	float D = D(H,N,roughness);
	float G = G(L,V,H,N);

	vec3 ct = D * G * F / max(0.00001,4.0*max(0.0,dot(N,L))*max(0.0,dot(N,V)));
	
	return ct;
}


// Fonction pour calculer Rs (réflexion spéculaire pour lumière non polarisée)
float calculateRs(float eta_i, float eta_t, float cos_theta_i, float cos_theta_t) {
    return pow((eta_i * cos_theta_i - eta_t * cos_theta_t) / (eta_i * cos_theta_i + eta_t * cos_theta_t), 2.0);
}

// Fonction pour calculer Rp (réflexion spéculaire pour lumière non polarisée)
float calculateRp(float eta_i, float eta_t, float cos_theta_i, float cos_theta_t) {
    return pow((eta_i * cos_theta_t - eta_t * cos_theta_i) / (eta_i * cos_theta_t + eta_t * cos_theta_i), 2.0);
}

// Fonction pour calculer R (réflexion totale)
float calculateReflectance(float Rs, float Rp) {
    return (Rs + Rp) / 2.0;
}

// Fonction pour calculer Ts (transmission spéculaire pour lumière non polarisée)
float calculateTs(float eta_i, float eta_t, float cos_theta_i, float cos_theta_t) {
    return 1.0 - calculateRs(eta_i, eta_t, cos_theta_i, cos_theta_t);
}

// Fonction pour calculer Tp (transmission spéculaire pour lumière non polarisée)
float calculateTp(float eta_i, float eta_t, float cos_theta_i, float cos_theta_t) {
    return 1.0 - calculateRp(eta_i, eta_t, cos_theta_i, cos_theta_t);
}

// Fonction pour calculer T (transmission totale)
float calculateTransmittance(float Ts, float Tp) {
    return  (Ts + Tp) / 2.0;
}

void main(void)
{
	
	L = normalize(lightDirection);
	V_CT = normalize(cameraPosition-pos3D.xyz);
	V = normalize(pos3D.xyz - cameraPosition);
	H = normalize(L + V_CT);
	Ks = F(L,H,Ni);
	Kd = 1.0 - Ks;
	

	vec3 Fspecular = CookTorrance(L,V_CT,normalize(N),H,Ni, roughness);
	vec3 Fdiffuse = surfaceColor* max(0.0,dot(N,normalize(-pos3D.xyz))) / PI;

	vec3 BRDF = Kd * Fdiffuse + Fspecular;
	float diffuseLight =  max(0.0,dot(N, normalize(L)));
	vec3 col = BRDF* lightColor *  diffuseStrength * diffuseLight;

    

	



    float eta_i = 1.0; // Indice de réfraction du milieu incident
    float eta_t = Ni; // Indice de réfraction du milieu de transmission
    float cos_theta_i = dot(N,-V);// Cosinus de l'angle d'incidence
	float sin_theta_i = sqrt(max(0.0, 1.0 - cos_theta_i * cos_theta_i)); 
    float cos_theta_t = sqrt(1.0 - pow(eta_i / eta_t * sin_theta_i, 2.0));// Cosinus de l'angle de transmission

    // Calcul des coefficients de Fresnel
    float Rs = calculateRs(eta_i, eta_t, cos_theta_i, cos_theta_t);
    float Rp = calculateRp(eta_i, eta_t, cos_theta_i, cos_theta_t);
    float R = calculateReflectance(Rs, Rp);

    float Ts = calculateTs(eta_i, eta_t, cos_theta_i, cos_theta_t);
    float Tp = calculateTp(eta_i, eta_t, cos_theta_i, cos_theta_t);
    float T = calculateTransmittance(Ts, Tp);


    vec3 reflected_color = textureCube(skyboxTexture, reflect(N,-V)).rgb;
    vec3 transmitted_color = textureCube(skyboxTexture, refract(V, N, eta_i / eta_t)).rgb;

    vec3 c1 =  reflected_color * R + transmitted_color * T;
	vec3 c2 =  reflected_color * R ;
 

	if(choix == 1.0){
		gl_FragColor = vec4(col, 1.0);
	}
	if(choix == 2.0){
		gl_FragColor = vec4(c2, 1.0);
	}
	if(choix == 3.0){
		gl_FragColor = vec4(c1, 1.0);
	}
    

}

