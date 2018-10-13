PORTAL 0.5 TEAM MEMBERS
Name
Caiyi Ku	
Zhixuan Xu	
Guanzheng Wang	

##################
# WHAT:		  #
##################

We have made a simplified Portal game inspired by Portal created by Valve.

<[Main Goal]>
Use portals to navigate through the chamber and reach the goal.
Player can go through portals to teleport from one portal to another.
Player can also make some tricks to reache some unreachable places.

<[Controls]>
W/A/S/D or ArrowKeys -> Move
Space                -> Jump
E                    -> Pick/Drop
LeftClick            -> Shoot Blue Portal
RightClick           -> Shoot Orange Portal
H                    -> Show Controls

##################
# HOW:		  #
##################
Algorithms and Data Structures:

The main data structure we used is array.

We used an array to store each bullet shot from the gun.

We also used arrays to store the positions and directions of the gun when it fires, so the bullet can fly from its corresponding position and direction. We then used another array to keep track of the time when the bullet is shot, for animation purpose.

In the particle system, we set each particle to be the vertex of the geometry, and move each particle in random velocity for each frame in animation. We also used a for loop to decrease the opacity of the particle system in each frame to create a fading effect.

##################
# HOWTO:         #
##################
Feature Options
-=Advanced rendering effects=-
- Bump mapping on cubes
- Normal maps on cubes (extracted from the original texture).
- Alpha maps on portals (created by ourselves from the original texture using python)

-=Advanced Shaders=-
- We used GGX Shading Model which provides a more realistic lighting effect on rough surfaces.
  The formula can be found in the source below.


-=Particle System=-
- Particle system is used to generate a special effect when bullets are shot from the portal gun.
- Particle system is also used to give a huge welcome in level 1.

-=Collision detection=-
- Player cannot pass through walls unless there is a portal through it
- Player can walk on floors/ceilings


-=Animation=-
- There is animation when the bullet is shot from the gun to the wall and make a portal.
- Door opening and closing are also animated.


##################
# SOURCES:	  #
##################
- PointLockControl: (According to)
http://mrdoob.github.io/three.js/examples/misc_controls_pointerlock.html

- GGX Shader: (According to)
http://www.filmicworlds.com/2014/04/21/optimizing-ggx-shaders-with-dotlh/

- Apply Custom Shaders:(for our gun)
https://csantosbh.wordpress.com/2014/01/09/custom-shaders-with-three-js-uniforms-textures-and-lighting/

- GGX Shading Formula:
http://graphicrants.blogspot.ca/2013/08/specular-brdf-reference.html

- Portal Gun Model:
http://tf3dm.com/3d-model/portal-gun-from-portal-2-74735.html

- Blue Portal Texture:
http://kirby-bulborb.wikia.com/wiki/File:Blue_Portal.png

- Orange Portal Texture:
http://orig05.deviantart.net/58ec/f/2012/361/2/5/portal___orange_portal_by_maxiesnax-d5pcfmj.png

- Wall Texture:
http://vignette3.wikia.nocookie.net/vectronic/images/5/50/Wiki-background/revision/20150621173037
http://previewcf.turbosquid.com/Preview/2013/06/18__16_28_10/walltexture.jpgf8e1ee5c-aa56-40f9-986a-a583fbad830bLarge.jpg


