// Standalone cutaways and experiments, expressed as meshes for both renderers.
window.makeInstrumentLabs = (T, parts) => {
  const {v, material, mesh, box, ring, rod, group, compassLetters} = parts;
  const ivory = material(0xf2d9a5), brass = material(0xc89757,.3), metal = material(0x495b5f,.4);
  const ink = material(0x172321), wood = material(0x795034);
  const mint = new T.MeshBasicMaterial({color:0xa4efd0, side:T.DoubleSide});
  const gold = new T.MeshBasicMaterial({color:0xffcf75, side:T.DoubleSide});
  const red = new T.MeshBasicMaterial({color:0xe67764, side:T.DoubleSide});
  const sphere = (p,r,m,x=0,y=0,z=0) => mesh(p,new T.SphereGeometry(r,30,18),m,x,y,z);
  const standalone = () => new T.Group();
  function disc(p,r,mat,x,y,z) {
    const face = mesh(p,new T.CylinderGeometry(r,r,.06,64),mat,x,y,z);
    face.rotation.x = Math.PI/2;
    return face;
  }

  const objective = standalone();
  // A wire-rimmed lens leaves the paths through its centre visible from either side.
  for (const offset of [-.06,.06]) {
    const rim=ring(objective,.58,.035,brass,-.37+offset,0,0);
    rim.rotation.y=Math.PI/2;
  }
  for (const azimuth of [0,Math.PI/3,2*Math.PI/3]) {
    const points=[];
    for (let i=0;i<=12;i++) {
      const radius=-.55+i*.55/6;
      points.push(v(-.37+.10*(1-radius*radius/.3025),radius*Math.cos(azimuth),radius*Math.sin(azimuth)));
    }
    for(let i=1;i<points.length;i++) rod(objective,points[i-1],points[i],.008,metal);
  }
  for (const [y,z] of [[.43,0],[-.22,.37],[-.22,-.37]]) {
    const middle=v(-.37,y,z), focus=v(.99,0,0);
    rod(objective,v(-1.9,y,z),middle,.013,mint);
    rod(objective,middle,focus,.013,gold);
    rod(objective,focus,v(1.55,-.41*y,-.41*z),.009,gold);
  }
  sphere(objective,.056,gold,.99);
  rod(objective,v(-.37,-.59,0),v(-.37,-.78,0),.055,brass);
  box(objective,.83,.07,.43,ink,-.37,-.82,0);

  const eyepiece=standalone();
  disc(eyepiece,1.26,ink,0,0,-.18);
  ring(eyepiece,1.26,.043,brass,0,0,-.10);
  ring(eyepiece,1.32,.026,metal,0,0,-.13);
  const apparent=group(eyepiece,0,0,.17);
  const globe=sphere(apparent,.23,ivory);
  globe.scale.y=.91;
  const saturnRings=mesh(apparent,new T.RingGeometry(.28,.48,64),brass);
  saturnRings.material.side=T.DoubleSide;
  saturnRings.rotation.set(1.10,.14,-.24);
  for (let i=0;i<45;i++) {
    const a=i*2.4,r=1.11*Math.sqrt((i+.5)/45);
    sphere(eyepiece,.008+(i%3)*.002,ivory,r*Math.cos(a),r*Math.sin(a),-.105);
  }

  const octave=standalone();
  box(octave,3.35,.30,.12,wood,0,-.18,0);
  box(octave,3.20,.13,.14,ink,0,-.018,0);
  for(let i=1;i<=12;i++) {
    const x=-1.5+3*(1-Math.pow(2,-i/12));
    box(octave,.018,.12,.16,brass,x,.007,0);
  }
  for (const x of [-1.5,1.5]) box(octave,.055,.17,.20,ivory,x,.12,0);
  const wave=group(octave,-1.5,.205,0);
  for(let i=0;i<44;i++) {
    const a=i/44,b=(i+1)/44;
    rod(wave,v(a*3,.40*Math.sin(Math.PI*a),0),v(b*3,.40*Math.sin(Math.PI*b),0),.014,mint);
  }
  rod(octave,v(-1.5,.20,0),v(1.5,.20,0),.008,ivory);
  const fretFinger=sphere(octave,.075,gold,0,.20,.018);
  fretFinger.visible=false;

  const declination=standalone();
  disc(declination,1.13,ink,0,0,0);
  ring(declination,1.15,.045,brass,0,0,.03);
  for(let i=0;i<72;i++) {
    const a=i*Math.PI/36, r=i%6===0?.925:1.01;
    rod(declination,v(r*Math.sin(a),r*Math.cos(a),.050),v(1.07*Math.sin(a),1.07*Math.cos(a),.050),i%6===0?.015:.006,ivory);
  }
  rod(declination,v(0,-.84,.065),v(0,1.0,.065),.014,gold);
  function vane(parent,length,width,m,z) {
    const shape=new T.Shape();
    shape.moveTo(-width,0);shape.lineTo(0,length);shape.lineTo(width,0);shape.closePath();
    m.side=T.DoubleSide;return mesh(parent,new T.ShapeGeometry(shape),m,0,0,z);
  }
  const north=vane(declination,.16,.075,gold,.07);north.position.y=.90;
  const letters=group(declination,0,0,.061);
  compassLetters(letters,.79,.13,ivory);
  const needle=group(declination);
  vane(needle,.88,.095,red,.106);vane(needle,-.78,.085,ivory,.106);
  sphere(declination,.073,brass,0,0,.13);

  const eclipse=standalone();
  // A corona silhouette and a foreground lunar disc align from the initial camera.
  disc(eclipse,.91,gold,0,0,-.45);
  for(let i=0;i<90;i++) {
    const a=2*Math.PI*i/90, extent=.99+.21*(.5+.5*Math.sin(a*3))+.085*Math.sin(i*5.31);
    const ray=vane(eclipse,extent-.86,.036,i%4===0?gold:ivory,-.46);
    ray.rotation.z=-a;ray.position.x=.86*Math.sin(a);ray.position.y=.86*Math.cos(a);
  }
  const moon=sphere(eclipse,.88,material(0x131b1b),0,0,.10);
  moon.scale.z=.75;
  function change(id,value) {
    if(id==="eyepiece") apparent.scale.setScalar(25/value);
    if(id==="declination") needle.rotation.z=-value*Math.PI/180;
    if(id==="octave") {
      wave.position.x=value===12?0:-1.5;
      wave.scale.x=value===12?.5:1;
      wave.scale.y=1;
      fretFinger.visible=value===12;
    }
  }
  return {models:{objective,eyepiece,octave,declination,eclipse},change, wave};
};
