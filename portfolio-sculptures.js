// Freestanding gallery instruments. All dimensions below are in exhibit-local units.
window.makePortfolioSculptures = function makePortfolioSculptures(T) {
  const palette = {};
  function finish(name, color, metalness, roughness) {
    palette[name] = new T.MeshStandardMaterial({ color, metalness, roughness });
  }
  finish("bronze", 0x894a27, .58, .39);
  finish("brass", 0xd39c53, .63, .30);
  finish("edge", 0xf1c981, .52, .27);
  finish("gold", 0xffbb61, .32, .35);
  finish("iron", 0x253339, .47, .36);
  finish("green", 0x196358, .45, .32);
  finish("mint", 0x82c8aa, .24, .44);
  finish("wine", 0x71383c, .18, .48);
  finish("wood", 0x824c32, .11, .49);
  finish("ivory", 0xe3d2ab, .08, .58);
  finish("slate", 0x515d61, .26, .49);
  finish("ocean", 0x45728a, .26, .35);
  palette.glow = new T.MeshBasicMaterial({ color: 0xffdb8c });
  palette.signal = new T.MeshBasicMaterial({ color: 0xa3efe0 });
  const V = (x, y, z) => new T.Vector3(x, y, z);
  function group(parent, x=0, y=0, z=0) {
    const g = new T.Group();
    g.position.set(x,y,z);
    if (parent) parent.add(g);
    return g;
  }
  function part(parent, geometry, material, x=0, y=0, z=0) {
    const m = new T.Mesh(geometry, palette[material]);
    m.position.set(x,y,z);
    parent.add(m);
    return m;
  }
  function box(p, x,y,z, w,h,d, mat) {
    return part(p,new T.BoxGeometry(w,h,d),mat,x,y,z);
  }
  function spindle(p, x,y,z, rBottom,rTop,h, mat, sides=32) {
    return part(p,new T.CylinderGeometry(rTop,rBottom,h,sides,1),mat,x,y,z);
  }
  function bead(p, x,y,z, radius, mat, segments=16) {
    return part(p,new T.SphereGeometry(radius,segments,Math.max(6,Math.floor(segments/2))),mat,x,y,z);
  }
  function rod(p,a,b,r,mat,top=r,sides=6) {
    const direction=b.clone().sub(a);
    const mid=a.clone().add(b).multiplyScalar(.5);
    const m=spindle(p,mid.x,mid.y,mid.z,r,top,direction.length(),mat,sides);
    m.quaternion.setFromUnitVectors(V(0,1,0),direction.normalize());
    return m;
  }
  // Torus rings default to the XY plane. Rotate into XZ for horizontal circles.
  function ring(p, x,y,z, major,minor, mat, radial=44, tube=5) {
    return part(p,new T.TorusGeometry(major,minor,tube,radial),mat,x,y,z);
  }
  function equator(p,x,y,z,r,t,mat,radial=48) {
    const m=ring(p,x,y,z,r,t,mat,radial);
    m.rotation.x=Math.PI/2;
    return m;
  }
  function lathe(p,profile,mat,sides=32) {
    return part(p,new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),sides),mat);
  }
  function foot(p,r=.47,h=.26) {
    spindle(p,0,h*.14,0,r*.97,r,h*.28,"iron");
    spindle(p,0,h*.33,0,r,r*.96,h*.10,"edge");
    spindle(p,0,h*.55,0,r*.96,r*.84,h*.34,"green");
    spindle(p,0,h*.78,0,r*.85,r*.81,h*.12,"brass");
    spindle(p,0,h*.92,0,r*.81,r*.77,h*.16,"iron");
  }
  function peg(p,x,y,z,r=.028) { return bead(p,x,y,z,r,"edge",8); }

  // An astronomical table with inlaid orbit tracks and cantilevered planet arms.
  function orrery() {
    const g=group();
    foot(g,.92,.20);
    spindle(g,0,.23,0,.77,.74,.08,"wood");
    for(const r of [.37,.53,.69]) equator(g,0,.276,0,r,.007,"brass",36);
    for(let i=0;i<20;i++) {
      const a=i*Math.PI/10,r=.715;
      const tick=box(g,r*Math.cos(a),.278,r*Math.sin(a),i%5===0?.064:.030,.009,.009,"edge");
      tick.rotation.y=-a;
    }
    lathe(g,[[0,.27],[.19,.27],[.20,.32],[.14,.35],[.12,.55],[.07,.60],[.069,.95],[0,.98]],"brass");
    const planets=[
      [.35,.62,.38,.058,"bronze"],[.49,2.40,.47,.076,"mint"],
      [.65,-1.82,.58,.075,"ocean"],[.78,-.35,.66,.11,"ivory"],
      [.85,2.9,.72,.075,"wine"]
    ];
    for (const [r,a,y,size,color] of planets) {
      const x=r*Math.cos(a),z=r*Math.sin(a);
      spindle(g,0,y,0,.105,.105,.043,"iron",16);
      rod(g,V(0,y,0),V(x,y,z),.016,"brass");
      rod(g,V(x,y, z),V(x,y+.12,z),.015,"edge");
      bead(g,x,y+.12,z,size,color,14);
      if(color==="ivory") {
        const rr=equator(g,x,y+.12,z,size*1.4,.016,"brass",24);
        rr.rotation.z=.16;
      }
    }
    bead(g,0,1.08,0,.215,"gold",22);
    const meridian=ring(g,0,1.08,0,.28,.013,"edge",32);
    meridian.rotation.y=-.18; meridian.rotation.z=.27;
    const arc=ring(g,0,1.08,0,.29,.012,"bronze",32);
    arc.rotation.y=1.38;
    bead(g,0,1.385,0,.04,"glow",10);
    return g;
  }

  // A sampled two-peak function. The wire grid hugs the same surface as the faces.
  function surfacePlot() {
    const g=group();
    box(g,0,.045,0,1.90,.09,1.41,"iron");
    box(g,0,.112,0,1.86,.045,1.36,"brass");
    box(g,0,.16,0,1.78,.06,1.29,"green");
    const bottom=.205;
    const width=1.65,depth=1.12,cols=15,rows=12;
    const h=(x,z)=> .19+.86*Math.exp(-((x+.30)**2/.096+(z+.16)**2/.057))
      +.52*Math.exp(-((x-.38)**2/.055+(z-.12)**2/.12))
      +.085*Math.cos(x*3.5-z*3.6);
    const point=(i,j)=>{const x=width*(i/cols-.5),z=depth*(j/rows-.5);return V(x,bottom+h(x,z),z);};
    const byTone={};
    function triangle(a,b,c,shade) {
      (byTone[shade] ||= []).push(...a.toArray(),...b.toArray(),...c.toArray());
    }
    for(let j=0;j<rows;j++) for(let i=0;i<cols;i++) {
      const a=point(i,j),b=point(i+1,j),c=point(i,j+1),d=point(i+1,j+1);
      const height=(a.y+b.y+c.y+d.y)/4;
      const shade=height>.94?"edge":height>.72?"mint":height>.50?"green":"ocean";
      triangle(a,c,b,shade);triangle(b,c,d,shade);
      if(j===rows-1 || i===0 || i===cols-1 || j===0) {
        const segments=[];
        if(j===rows-1)segments.push([c,d]);
        if(i===0)segments.push([a,c]);
        if(j===0)segments.push([b,a]);
        if(i===cols-1)segments.push([d,b]);
        for(const [fa,fb] of segments) {
          const aa=V(fa.x,bottom,fa.z),bb=V(fb.x,bottom,fb.z);
          triangle(fa,aa,fb,"iron");triangle(aa,bb,fb,"iron");
        }
      }
    }
    for (const [shade,coords] of Object.entries(byTone)) {
      const geom=new T.BufferGeometry();
      geom.setAttribute("position",new T.Float32BufferAttribute(coords,3));
      geom.computeVertexNormals();part(g,geom,shade);
    }
    for(let j=0;j<=rows;j+=3) {
      for(let i=0;i<cols;i++){
        const a=point(i,j),b=point(i+1,j);a.y+=.008;b.y+=.008;
        rod(g,a,b,.007,"mint",.007,4);
      }
    }
    for(let i=0;i<=cols;i+=3) {
      for(let j=0;j<rows;j++){
        const a=point(i,j),b=point(i,j+1);a.y+=.008;b.y+=.008;
        rod(g,a,b,.006,"edge",.006,4);
      }
    }
    for(const [x,z] of [[-.30,-.16],[.38,.12]]) {
      const y=bottom+h(x,z);
      rod(g,V(x,y,z),V(x,y+.15,z),.013,"brass");bead(g,x,y+.18,z,.045,"glow",10);
    }
    return g;
  }

  // A spinning instrument with a pair of bearing towers and three nested gimbals.
  function gyroscope() {
    const g=group();
    foot(g,.69,.20);
    const center=V(0,1.10,0);
    for(const sign of [-1,1]) {
      rod(g,V(sign*.53,.18,0),V(sign*.78,1.1,0),.075,"iron",.046,12);
      rod(g,V(sign*.48,.20,.18),V(sign*.73,.88,0),.027,"brass",.027,8);
      rod(g,V(sign*.66,1.1,0),V(sign*.80,1.1,0),.074,"edge",.074,16);
      peg(g,sign*.80,1.10,0,.071);
    }
    const a=group(g,...center.toArray());
    a.rotation.set(.13,-.11,-.10);
    ring(a,0,0,0,.719,.050,"brass",52,6);
    const b=group(a);b.rotation.y=.66; b.rotation.z=.34;
    ring(b,0,0,0,.60,.041,"green",46,6);
    const c=group(b);c.rotation.x=.69;c.rotation.y=.15;c.rotation.z=-.22;
    ring(c,0,0,0,.48,.035,"edge",40,6);
    const rotor=group(c);rotor.rotation.set(.39,.15,.68);
    spindle(rotor,0,0,0,.34,.34,.114,"iron",36);
    for(const y of [-.055,.055])equator(rotor,0,y,0,.335,.022,"brass",36);
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3;
      peg(rotor,.23*Math.cos(a),.063,.23*Math.sin(a));
    }
    spindle(rotor,0,0,0,.041,.041,.83,"edge",14);
    bead(rotor,0,.43,0,.061,"mint",12);
    return g;
  }

  function armillary() {
    const g=group();
    foot(g,.51,.24);
    lathe(g,[[0,.24],[.24,.24],[.23,.28],[.13,.33],[.095,.46],[.14,.52],[.13,.57],[0,.57]],"brass");
    const mount=group(g,0,1.10,0);
    const outer=ring(mount,0,0,0,.635,.033,"bronze",36,4);
    outer.rotation.y=.12;
    const frame=group(mount);frame.rotation.z=-.36;frame.rotation.y=.28;
    rod(frame,V(0,-.71,0),V(0,.73,0),.022,"edge",.022,10);
    for(const y of [-.694,.694]) bead(frame,0,y,0,.052,"brass",12);
    for (const azimuth of [0,Math.PI/3,2*Math.PI/3]) {
      const r=ring(frame,0,0,0,.56,.012,"brass",32,4);r.rotation.y=azimuth;
    }
    for(const y of [-.26,0,.26]) equator(frame,0,y,0,Math.sqrt(.56**2-y**2),.014,"edge",28);
    const ecliptic=group(frame);ecliptic.rotation.x=.40;
    // The broad ecliptic belt is hollow so the central globe is visible.
    finish("belt", 0x196358, .45, .32);
    palette.belt.side=T.DoubleSide;
    part(ecliptic,new T.CylinderGeometry(.577,.577,.068,40,1,true),"belt");
    for(const y of [-.034,.034]) equator(ecliptic,0,y,0,.577,.012,"brass",28);
    for(let i=0;i<18;i++){
      const a=i*Math.PI/9;
      const tick=box(ecliptic,.581*Math.cos(a),0,.581*Math.sin(a),.012,.040,.010,"edge");
      tick.rotation.y=-a;
    }
    bead(frame,0,0,0,.222,"ocean",13);
    equator(frame,0,0,0,.224,.008,"mint",22);
    return g;
  }

  function openBook() {
    const g=group();
    box(g,0,.065,0,1.72,.13,1.04,"iron");
    box(g,0,.15,0,1.65,.04,.97,"brass");
    // Curved page-blocks with visible deckled fore-edges and a central valley.
    for(const sign of [-1,1]) {
      const cover=group(g,sign*.42,.25,0);
      cover.rotation.z=sign*.09;
      box(cover,0,0,0,.85,.055,1.00,"wine");
      box(cover,0,.045,0,.79,.06,.92,"ivory");
      const strips=10;
      for(let i=0;i<strips;i++) {
        const u0=i/strips,u1=(i+1)/strips;
        const p=u=> .34+.11*Math.sin(Math.PI*u)-.035*u;
        const x0=sign*(u0*.78+.015),x1=sign*(u1*.78+.015);
        const a=V(x0,p(u0),0),b=V(x1,p(u1),0);
        const strip=box(g,(x0+x1)/2,(a.y+b.y)/2,0,a.distanceTo(b)+.006,.045,.91,"ivory");
        strip.rotation.z=Math.atan2(b.y-a.y,b.x-a.x);
      }
      for(let i=0;i<4;i++){
        const z=.22-i*.105;
        rod(g,V(sign*.10,.397,z),V(sign*.32,.474,z),.007,"bronze",.006,4);
        rod(g,V(sign*.32,.474,z),V(sign*(.58-(i%2)*.08),.449,z),.006,"bronze",.006,4);
      }
    }
    // Raised conic-section study rising out of the open pages.
    for(const side of [-1,1]) {
      rod(g,V(side*.54,.39,-.29),V(side*.48,.68,-.29),.024,"brass",.024,8);
    }
    const ellipsoid=group(g,0,1.07,-.29);ellipsoid.rotation.z=.34;
    for (const angle of [0,Math.PI/3,2*Math.PI/3]) {
      const frame=group(ellipsoid);
      frame.rotation.y=angle;
      const m=ring(frame,0,0,0,.41,.014,"brass",36);
      m.scale.y=1.35;
    }
    for(const h of [-.27,0,.27]) {
      const r=Math.sqrt(1-(h/.554)**2)*.41;
      equator(ellipsoid,0,h,0,r,.014,h===0?"signal":"green",32);
    }
    rod(ellipsoid,V(0,-.66,0),V(0,.65,0),.015,"edge");
    bead(ellipsoid,0,.66,0,.038,"glow",10);
    return g;
  }
  function network() {
    const g=group();
    foot(g,.51,.23);
    const poles=group(g,0,1.04,0);
    poles.rotation.set(.12,-.20,.12);
    const top=V(0,.73,0),base=V(0,-.73,0), upper=[],lower=[];
    for(let i=0;i<5;i++) {
      const a=i*Math.PI*2/5,b=a+Math.PI/5;
      upper.push(V(.65*Math.cos(a),.31,.65*Math.sin(a)));
      lower.push(V(.65*Math.cos(b),-.31,.65*Math.sin(b)));
    }
    for(let i=0;i<5;i++) {
      const next=(i+1)%5,prev=(i+4)%5;
      for(const [a,b,mat] of [[upper[i],upper[next],"edge"],[lower[i],lower[next],"bronze"],
        [upper[i],lower[i],"brass"],[upper[i],lower[prev],"green"],
        [upper[i],top,"brass"],[lower[i],base,"brass"]]) rod(poles,a,b,.016,mat,.016,5);
      bead(poles,...upper[i].toArray(),.068,i===0?"glow":"mint",10);
      bead(poles,...lower[i].toArray(),.057,"edge",10);
    }
    for(const a of [top,base]) bead(poles,...a.toArray(),.075,"mint",12);
    const core=part(poles,new T.IcosahedronGeometry(.235,0),"green");
    core.rotation.z=.4;
    for(const k of [0,2,4])rod(poles,V(0,0,0),upper[k],.010,"signal",.010,5);
    spindle(g,0,.26,0,.18,.07,.14,"brass",20);
    return g;
  }
  function volumes() {
    const g=group();
    box(g,0,.065,0,1.64,.13,.92,"iron");
    box(g,0,.145,0,1.55,.036,.86,"edge");
    function book(x,z,height,width,thickness,color,angle) {
      const b=group(g,x,.17+height/2,z);
      b.rotation.y=angle;
      box(b,0,0,0,width-.046,height-.06,thickness-.038,"ivory");
      for (const face of [-1,1]) box(b,0,0,face*thickness/2,width,height,.030,color);
      const fore=width*.5-.022;
      for (let n=-1;n<=1;n++)box(b,fore,0,n*thickness/4,.008,height-.10,.005,"brass");
      const spine=-width*.5+.018;
      box(b,spine,0,0,.051,height,thickness+.022,color);
      for (const y of [-.39,-.33,.35,.40]) box(b,spine,y*height,0,.058,.02,thickness+.033,"brass");
      const front=thickness/2+.021;
      for (const sign of [-1,1]){
        box(b,0,sign*(height/2-.09),front,width-.125,.010,.009,"brass");
        box(b,sign*(width/2-.06),0,front,.010,height-.18,.009,"brass");
      }
      ring(b,0,height*.08,front+.008,width*.17,.013,"edge",24,4);
      const jewel=box(b,0,height*.08,front+.019,width*.16,width*.16,.012,"mint");
      jewel.rotation.z=Math.PI/4;
      box(b,0,-height*.20,front+.01,width*.45,.018,.008,"edge");
      box(b,0,-height*.25,front+.01,width*.29,.012,.008,"brass");
    }
    book(-.37,-.17,1.43,.64,.21,"green",-.20);
    book(.39,-.04,1.18,.54,.19,"wine",.24);
    book(-.02,.20,.96,.56,.14,"iron",-.09);
    return g;
  }
  function telescope() {
    const g=group();
    const tripod=group(g);
    for(let i=0;i<3;i++) {
      const a=.34+i*Math.PI*2/3;
      const floor=V(.71*Math.cos(a),.02,.71*Math.sin(a)),top=V(.14*Math.cos(a),1.03,.14*Math.sin(a));
      rod(tripod,floor,top,.035,"wood",.069,8);
      rod(tripod,floor,floor.clone().lerp(top,.11),.040,"brass",.048,8);
      rod(tripod,floor.clone().lerp(top,.47),V(0,.42,0),.018,"edge",.018,6);
      rod(tripod,top.clone().lerp(floor,.15),top,.071,"bronze",.073,8);
    }
    spindle(tripod,0,1.065,0,.215,.174,.12,"brass",28);
    spindle(tripod,0,1.19,0,.105,.10,.14,"green",24);
    ring(tripod,0,1.285,.04,.127,.031,"edge",26);
    rod(tripod,V(0,1.28,-.12),V(0,1.28,.16),.048,"brass",.048,12);
    const tube=group(g,0,1.37,0);
    tube.rotation.z=-1.05;tube.rotation.x=.16;
    spindle(tube,0,.08,0,.095,.163,1.43,"brass",32);
    // Narrow stepped focuser and blackened eye stop oppose the wide objective.
    spindle(tube,0,-.71,0,.059,.092,.26,"iron",20);
    spindle(tube,0,-.85,0,.065,.058,.055,"edge",20);
    spindle(tube,0,.835,0,.176,.18,.14,"green",28);
    spindle(tube,0,.919,0,.181,.174,.028,"edge",28);
    spindle(tube,0,.941,0,.158,.158,.012,"ocean",28);
    for(const [y,r] of [[-.59,.105],[-.48,.111],[.04,.143],[.68,.165],[.73,.17]]) spindle(tube,0,y,0,r,r,.030,"bronze",22);
    const finder=group(tube,-.16,-.25,0);
    for(const y of [-.14,.17]) box(finder,.07,y,0,.13,.035,.04,"wood");
    spindle(finder,0,.01,0,.043,.055,.52,"green",16);
    for(const y of [-.25,.28]) spindle(finder,0,y,0,.055,.056,.035,"edge",16);
    return g;
  }
  function dish() {
    const g=group();
    foot(g,.56,.20);
    lathe(g,[[0,.2],[.19,.2],[.17,.27],[.10,.33],[.095,.55],[.14,.59],[.13,.65],[0,.65]],"brass",24);
    for(const dir of [-1,1]) rod(g,V(dir*.11,.54,0),V(dir*.27,.86,0),.047,"green",.043,8);
    rod(g,V(-.31,.86,0),V(.31,.86,0),.067,"bronze",.067,14);
    const bowl=group(g,0,.87,0);bowl.rotation.set(.48,-.29,-.12);
    // Circular paraboloid opens along +Z. A second profile forms its outer shell.
    const shellGroup=group(bowl);shellGroup.rotation.x=Math.PI/2;
    const r=.71,profile=[[0,-.014],[.12,-.015],[.27,.01],[.48,.105],[r,.265],[r,.31],[.48,.146],[.27,.047],[.12,.012],[0,.008]];
    lathe(shellGroup,profile,"mint",48);
    ring(bowl,0,0,.294,r,.022,"edge",48);
    for(let i=0;i<12;i++) {
      const a=i*Math.PI/6,c=Math.cos(a),s=Math.sin(a);
      rod(bowl,V(.10*c,.10*s,.022),V(.38*c,.38*s,.105),.011,"green",.011,5);
      rod(bowl,V(.38*c,.38*s,.105),V(.69*c,.69*s,.30),.011,"green",.011,5);
      if(i%4===0)rod(bowl,V(.64*c,.64*s,.261),V(0,0,.55),.019,"brass",.014,7);
    }
    rod(bowl,V(0,0,.51),V(0,0,.64),.057,"iron",.039,14);
    bead(bowl,0,0,.64,.040,"glow",12);
    return g;
  }

  // Consolidate rigid parts by finish. This preserves authored normals while reducing draw calls.
  function consolidate(model) {
    model.updateMatrixWorld(true);
    const groups=new Map(), world=new T.Vector3(), normal=new T.Vector3(), normalMatrix=new T.Matrix3();
    const point=new T.Vector3();
    const bounds=new T.Box3().setFromObject(model,true), extent=bounds.getSize(new T.Vector3());
    const center=bounds.getCenter(new T.Vector3()), scale=2.15/Math.max(extent.x,extent.y,extent.z);
    const origin=V(center.x,bounds.min.y,center.z);
    model.traverse(item=>{
      if(!item.isMesh)return;
      const geo=item.geometry,position=geo.attributes.position,normals=geo.attributes.normal;
      const buffer=groups.get(item.material)||{points:[],normals:[]};
      groups.set(item.material,buffer);
      normalMatrix.getNormalMatrix(item.matrixWorld);
      const order=geo.index?.array, count=order?.length??position.count;
      for(let k=0;k<count;k++) {
        const i=order?order[k]:k;
        point.fromBufferAttribute(position,i);world.copy(point).applyMatrix4(item.matrixWorld).sub(origin).multiplyScalar(scale);
        normal.fromBufferAttribute(normals,i).applyNormalMatrix(normalMatrix);
        buffer.points.push(world.x,world.y,world.z);buffer.normals.push(normal.x,normal.y,normal.z);
      }
      geo.dispose();
    });
    const result=new T.Group();
    for(const [mat,buffer] of groups) {
      const geo=new T.BufferGeometry();
      geo.setAttribute("position",new T.Float32BufferAttribute(buffer.points,3));
      geo.setAttribute("normal",new T.Float32BufferAttribute(buffer.normals,3));
      geo.computeBoundingSphere();result.add(new T.Mesh(geo,mat));
    }
    return result;
  }
  const designs={about:orrery,projects:surfacePlot,experience:gyroscope,publications:armillary,education:openBook,skills:network,certifications:volumes,observatory:telescope,contact:dish};
  return Object.fromEntries(Object.entries(designs).map(([key,build])=>[key,consolidate(build())]));
};
