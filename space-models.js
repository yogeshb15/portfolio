// Lunar albedo and terrain are sampled from NASA SVS, CGI Moon Kit (LRO LROC / LOLA).
// https://svs.gsfc.nasa.gov/4720/ . Southern highland and Tycho relief is exaggerated 5×.
window.makeObservatorySpace = function makeObservatorySpace(T) {
  const materialCache = new Map();
  function surface(color, double = false, unlit = false) {
    const key = [color, double, unlit].join("/");
    if (!materialCache.has(key)) {
      const options = { color, side: double ? T.DoubleSide : T.FrontSide };
      const value = unlit ? new T.MeshBasicMaterial(options) : new T.MeshStandardMaterial({...options, roughness: .93});
      materialCache.set(key, value);
    }
    return materialCache.get(key);
  }
  function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
    const value = new T.Mesh(geometry, material);
    value.position.set(x, y, z);
    parent.add(value);
    return value;
  }
  const TAU = 2 * Math.PI;
  function unitSphere(parent, radius, color, x, y, z, unlit = false) {
    return mesh(parent, new T.SphereGeometry(radius, 24, 16), surface(color, false, unlit), x, y, z);
  }
  // Static geometry buckets keep both WebGL draws and software transforms small.
  function triangles(parent) {
    const byMaterial = new Map();
    return {
      add(mat, a, b, c) {
        if (!byMaterial.has(mat)) byMaterial.set(mat, []);
        byMaterial.get(mat).push(...a, ...b, ...c);
      },
      finish() {
        for (const [mat, coords] of byMaterial) {
          const geometry = new T.BufferGeometry();
          geometry.setAttribute("position", new T.Float32BufferAttribute(coords, 3));
          geometry.computeVertexNormals();
          mesh(parent, geometry, mat);
        }
      }
    };
  }
  function annulus(group, inner, outer, color, segments, start=0, arc=TAU) {
    return mesh(group, new T.RingGeometry(inner, outer, segments, 1, start, arc), surface(color, true));
  }
  function randomStream(seed) {
    return () => { seed = (Math.imul(1664525,seed) + 1013904223) >>> 0; return seed/4294967296; };
  }

  // Compressed radial spacing and enlarged planets give each orbit a visible occupant.
  function solarSystem() {
    const group = new T.Group();
    const disc = new T.Group();
    group.add(disc);
    disc.rotation.set(-.70, .08, -.16);
    const star = unitSphere(disc,.21,0xffc267,0,0,.05,true);
    star.scale.set(1,1,1.03);
    const planets = [
      [.34,2.40,.037,0xb5a7a0], [.49,.73,.059,0xe3b678], [.68,3.88,.073,0x438dc0],
      [.85,1.54,.054,0xb76b49], [1.16,5.72,.144,0xd3ad84], [1.41,2.55,.105,0xe9cd9e],
      [1.65,.45,.077,0x92d4d6], [1.89,4.15,.078,0x6287d7]
    ];
    planets.forEach(([orbit, phase, radius, color], index) => {
      annulus(disc, orbit-.004, orbit+.004, 0x526d79, 80);
      const body = unitSphere(disc, radius, color, Math.cos(phase)*orbit, Math.sin(phase)*orbit,.01);
      if (index===2) {
        unitSphere(body,.023,0xc9c7bf,.10,.065,.055);
      }
      if (index===5) {
        const ring = annulus(body, radius*1.32, radius*2.05, 0xcfb998, 48);
        ring.rotation.set(.70,-.17,.16);
      }
    });
    return group;
  }
  const ringBands = [
    [1.18,1.25,0x8c8074],[1.26,1.33,0xa39786],[1.34,1.42,0x978b7c],
    [1.43,1.52,0xb2a18a],[1.53,1.60,0xd5c2a7],[1.60,1.65,0xe7d4b4],
    [1.65,1.70,0xbba991],[1.70,1.76,0xe3cfb0],[1.77,1.82,0xccbaa0],
    [1.82,1.89,0xf3debb],[1.90,1.94,0xcab9a1],[1.94,1.99,0xe9d8bc],
    [2.07,2.11,0xa99d8c],[2.12,2.17,0xbcb09b],[2.17,2.23,0xcfc3aa],
    [2.23,2.27,0xa99e8d],[2.28,2.31,0xc7baa4],[2.34,2.35,0xd9cbb7]
  ];
  function saturnSystem() {
    const group = new T.Group();
    const gas = new T.Group();
    group.add(gas);
    gas.rotation.set(.37,.02,-.20);
    // Each latitude strip has its own material on both renderers.
    const palette = [0xe9cc9c,0xe2c393,0xcfad84,0xe9cfa5,0xd8b789,0xf5ddb7,0xdebd94,0xcfab82,0xe9c69a,0xdab98b];
    const stripes = 27;
    for (let i=0;i<stripes;i++) {
      const part = mesh(gas, new T.SphereGeometry(.77,40,2,0,TAU,i*Math.PI/stripes,Math.PI/stripes), surface(palette[i%palette.length]));
      part.scale.y=.904;
    }
    for (const [inside,outside,color] of ringBands) {
      const band = annulus(gas,inside*.77,outside*.77,color,92);
      band.rotation.x=-Math.PI/2;
    }
    return group;
  }
  function ringSector() {
    const group = new T.Group();
    const disk = new T.Group();
    group.add(disk);
    disk.position.y=-3.2;
    const theta=1.0, aperture=Math.PI-2*theta;
    for (const [inside,outside,color] of ringBands) {
      annulus(disk,1.86*inside,1.86*outside,color,66,theta,aperture);
    }
    group.rotation.set(-.48,.10,-.16);
    group.scale.setScalar(.84);
    return group;
  }
  // A local particle field illustrates optical depth. Individual grains are deliberately enlarged.
  function ringDivision() {
    const group = new T.Group();
    const rng = randomStream(565);
    const bucket = triangles(group);
    const palette=[0xb4c3c5,0xd8e2de,0xf0e9d9,0xc9c4b5,0xb8b4aa,0x929e9d].map(c=>surface(c));
    const rock = new T.IcosahedronGeometry(1,0);
    const base=rock.attributes.position;
    function fragment(x,y,z,size) {
      const randomPhase = rng()*TAU, sx = size*(.7+.65*rng()), sy=size*(.78+.43*rng()), sz=size*(.55+.62*rng());
      const a = Math.cos(randomPhase), b=Math.sin(randomPhase), mat = palette[Math.floor(rng()*palette.length)];
      function point(i) {
        const u=base.getX(i)*sx, v=base.getY(i)*sy;
        return [x+u*a-v*b,y+u*b+v*a,z+base.getZ(i)*sz];
      }
      for(let i=0; i<base.count; i+=3) bucket.add(mat,point(i),point(i+1),point(i+2));
    }
    for(let i=0;i<445;i++) {
      const x=(rng()-.5)*3.6;
      const dense=i<290;
      const lane=i>=432; // Less populated Cassini Division and a thin illustrative ringlet.
      const y=lane ? (i%2 ? -.035 + .023*rng() : (rng()-.5)*.30)
                   : dense ? -.17-rng()*.74 : .22+rng()*.61;
      fragment(x,y-x*x*.065,(rng()-.5)*.095,.016+.049*rng()**2);
    }
    bucket.finish();
    group.rotation.set(-.48,.12,-.13);
    return group;
  }

  const unpack = str => Uint8Array.from(atob(str),ch=>ch.charCodeAt(0));
  function globe() {
    const group = new T.Group(), bucket=triangles(group);
    const cols=100, rows=50, reflectance=unpack("0dLR0tHS09XV0NLU0tLT1NTT09PU1dfZ2tze3d7c29nZ2dzd3tzX1tfX19bV1NPT1NTS0dPR0dLQ0NTW19fX2NjY2djY19bX1tbV1NTT1NTV1NTV1NTS1NTT1NTT1dTT0tHS0sTJzMvOy8/P0M7R0tPT0tDOy8fHyMfJy83Nzs7MztDRz83Nzs3NzdDRz9DQ0tDP0dLUz8nHyMrKzs7Q0dDQ0dHQz87PztDR0NLT1NDNzszO0dLRz87NzMnJyMrNy8vPzcrJx8bBv8HEzdLV2Nrh4NzY08vIyMTAwsHAv76/wdTg1tTY19DS1M/LzdHV0c/Pzs7JxsPDwcfNzNHT1tvZ19LOzczMyMfExMbIxsTDycjKz9HQ1Nna19PR0NDRz8zP09DP0c7HxMTEysjHx8jQ0M7PzMzKxMO+v8HCwcXHwr67ub7Ex8rHw8TKz9HX2NbV09PV1tHP09LLyMrN1dbU1dLPzs3LycXCw8fFxMXIxsPExMnIyMrOz8zNzs7O0dba3t7e1NDSz87JxcfHys/PzMrNzs3Jx8jIy8fBwL/DyMfGxsrMycjBv8bCxcbIzdDIzdLT2Nba2tTV19fe7O3r6OLa0snEwsC/vLnBxcPIxcfJycnLzc7KydHP1NPOzs3Nz9HR0M/V1MLDyMjK1NTQz9LJzcvP1tLOz87Pzs3KxcHDxMbFxcnMy9HPzsnHw8fM0d/n29XOyMTBw8bGzs/V1djg5eXazsrAvcC9ubi4v8PGx8vM0tfa4OLg3tnb393h4uHX09PQyM3PzsnIxsfKy8vMysjIys3QzMvMyL/Iwr/Avr++wLq+vb/FyMvQ0dTOyc7QzdPd29jY0MfFw7y/w77CwsG+x9TQwsG6v7y5u765trzBy9DT2uTm6e7w5+Xo6Ojk4d/h2dPSzsrM09PM0M7R0cvHxcjIy8vP0cnKzcnDwsXFv7q9vbu8vLm9xcPFyczMztDJzs7O087LzMe8vbWzsbSzraSqtLe2uLi6uMG4s7m8wb/HztDY3djR19rb5O7r6u3n6Obn4tnW0c/Ny8PFysvJysrGwsHIzdHCwsC9wL/BydXWx72/vLy/vry1vsS9vcfOw8G+vsLHysfEw8C8urWwraminJudnJ+Ymqawrqqvr7Gxuby9ytXf0tLNxMDNz7/AztTe5Ofk5d7V087PycC9v8XDwsHBv8HAvsrEuMDIw8TDwcbIz8fDxsDCwLu8ubi3ube5wLu1s7Sppa/AvrWyqqaenaSzqqalpKuuqKmjoKiloZ+gnZufq7zL0c/CxMi9wb6hprfI1dnd3tTZ087Lw765vcO9vr68vcDCvri7tcTKyMbFvby8vcC+wr/Gw768vMG3t7i1t7zBwLWwoI+apqack5KjrbG6tbCtprCxna29taeopainoJ2enK27v77EvMK/yr64yMzPzNDZ3ebd19XOycW+vsbDubW5u7/Av768vLvQ1dDGwcPLyry8urzFx7y2vcXEt7q4uLi5wreuqZWVlZWVlY+Vo7e8s6GonpGNnZegs7u1p6iwsKmppK67vr3BtrO4wMO5vbvGysPJ1t3b19fc1NLR0M7Fvr21t7rByby/w83Fy9HczMPFx8rCw8jEw8TDxMDBxMvMv7u5trqqpZKIiYqNj5OQm6+usZCMj4GGjpGTkJqut6+xtbSrpqytsLO4w7WqrLq1wb68wsbHyc3O1NDV29LR2NfOycnJwri0ub+6vMbMyNDW0sjGw8PDyNHV0sXCyMW8vsPL08K3uLCsq6Ofj4SFhYiJhYiioqWRgoKBg4iNjJGap7C2uLesnqOtqaqwuLiwvbOzssXLxsfFw8XPz9bS0M7IytDKvb/ExsrOycDAwMDCxMTW4NXWy8jIyMzc3dHHusG+tLW0vL21ub23sa6hkIqAgoaIh4eKlpuVhIaAf4OFjYuUoZ6luKeeqpuXn5ihuba2tr7CurW3v8DFyMXGyt3q29XTyMzJysLCwr/CycjKycrCvcLH0djV0cjHzMzS1NPJxsa8v8O2trqxsLu7tbWxmoJ9iIeHh4KFioiLiIWLhIGBhoiHi5ugnaiIh5CUj6Wapbe/ubjFx7Oztre9xsTFxcXX5NLV29TPzcbDyMzKx8TCwMTQ08rG0M/Kw83L083N1NDOysnRx8bHwLq/u7OytratqI6EiIqGfX+GiIuMiYmMiYSDg4aHh46cp5qPhYeGioiqsLq/xsO9w7qytMPCw8PIz8m/trnJy9HX18nAv8bJ08KgtMy/xdLM1NPQ0cXC09rRztvUzc7My8O/vcSxubyws7rCuKWHkZORgH9+g4ablI6IjYSGiYOHkJOjmpegiIaFiYh8jr7Eu7/Bu7W6ury8wsTM0cy5uLK0wMnJ0NfRvsLCxcSUhKXNw7zDwtPY29nY1Nzb09LY0MnOzsW/v8LExLi4vL3Cxb+umZCZiYOCfX+Mq5uOhYOLiomKiImJlaKpnn19h4mCgJOyt7iqrrComqSusrzIzMbAube4uLzKx8nHxsbCyM7EqaS3xL+/yc3W0tfP0tra0c7OysTJy8jCwcjUzs3Kwr+8wcTGvLGXin6KfHd+hYmLjoiHj5CNjI2Mioqnq5KAgoSEgX6Wn5izvLqbjYuEjai4wbu5v8G2trO8v8nGxsPGx8rNzsbGvLzFxs3Uzs/WytHWztjEvb7FyMbDxcnOztDT1su/uLa/w7y4oYyCfnt4eXyAgo6ShJOenZecmpSen42LlY2YiX17gouDosTLloaEfoStuKimkbK4sbextrzK0tHKyMbGxcm/xsfC1dHW3eTj0M7b18zTyL/Gwb/Kx8TM0s3KztHKw7i+xLq5uK6ajIGAeXV4foKJl4qTrau2pqGTgoOHe4ySmHt0fHl2d4ymxaSGg46ws7ern4uKkam5uLW8z9bPzNHKw8C+ucDAxNXW29fe3dPW19rQycXMyMnKzcvJxMLCyMbKwr69wLq4usHJt6eNfIF+fHt8k66bjqGuuqGcjIabnYiHpZZyeHp3dneFlKy9qKapqaGyu6+fn6mnsru9t8jc1dDOzsXCv8LAwMLL1NTe2NbVzsnOx87NyL/Mz9HTzcTCxcjKz8rN0sS/vrzJxry5q4d9fX9/fo+mmZOcpJqLjXuGpqqtsLScf354e3t+iZuPmrSzrZaesr28qKCup7fCwsS83OHVysnIxcvFxcHFydLX0dHX08fFysne1MrGydDV3dPJzL64xtHR1tTDxL29uLrBvraJeXh7fnqBjYuOlJ6kkIiJjo2jt8a+qox6fYaaho+NhHqEl56braWvrJR/lbO8vsvIv93n2M/OxcHLx8TDx8rN0dDJ0c7CwcnPzs/XzMzO0NvWz8u/ub/LzMfIy8bFvrKxssCtk354fn55fX6Eio+NlJyUoa2fp7u5ubm1p4aZtKiXhISAgYuZpKiqsJ6Oj6C2sbbCvbjM4uPUzMvNzcPJx8nQwLXHx83OxsbQz8nK08vLy8vOzMXGvbq7wcnQzs3LyMC6tbqYnrOHeH2BfH6AhJKUhpigk7K0trK7v7jA0a+SpLKwm4eEg46WpKinrq+ok6Kxs7m1uLq0uuHm0cXDxsHAwL7O0cfBwsjOycnN2d3Syc/KysfFwL/AwsG3vc3V09TTzci9vb63rbS3m4GAgX5/goGZkoCNoYmWsqqvucG6w8m3qKWvvbCUhIiWuMCxrrOyua2tvr23rbnFurLN08fBvb23vr3AvcTXyMLKzsPO0dre0MfJ0cjHwb+9t7q+ucXQ3drg2tHDt7W6uLy3trqVl46Nl5CAg4iMiZiRkqiurbG0u8PD0sOrk6O9qaGclqivsa+vs7e7v8G8tLC1uLGxucLCwL66tb+5u77Gz8XHz8G3ws/IzMu9w8LIycbGv7a3u7/CydDWwra/vrq6t7mzrbayq5yZo6qai4KYnYyPiYyltbW4vbu1vs7PoZGaua6upJekn6qms7a4xsTHwbe0urusvLy+xL+8u7u9vLq9wcHBxsO5t7eztsPEuLu4vbu2t727w77DycnQzauVm8XBwb66wMHDt6qlr6mMgImem5mRiYaUubayuLG3ubq+xreenqqqpZWyu6aqqbK/wLu/u8PIvbGussvGxqa3wLm6uca9s7ayv8i8s7CxrbO6tbKyrbi9vbO2wMXExMTEz9LMpqfPzMq8vMLZ3ci8sbOVgHyCmJGZjoeDj7C2urK7wr6xwM68uLmxubm0tsG3sbG0tLmwura4w7qlqre8u8C1xcLBvrvBvraytLa0squlraejsK6qqaWyu8rKxr+9uba6xM/SwbzN0dDFvru7x9G/vsWynYqEjqCUmI2Gi5a4w8zAy8C1vsfExMK1u8LJzMXHxsC+rbLGv7O3s7Ofo7SusLC2vcDBwLy9vMC7sry1r66yoKScnq6so6qnr8PBxsrAtLe5ub7JyLu8x8jJw7y4t7q5urjIx7Kem6mYl6q5qq7G0tDQzsG4v8rAwby4wr68zN/Z1cTMwLG1vMC1pa+xq6qrrLrCubq4uL/AxLCxxK+ooa2lqp6hmpKqn6OZpq20w8HFxLW1uba2ury5xcTExsG4ubq2t7e1uLqmp62rnKSxycjL1+Hazc3Hx8W+vby4t7/AvcnX2tXDwrq5wbOhopuhp6SrvMfAvLW2tqy0u5qisLu0mZeop6CZpaGSq52nl56op7XFvrm+ure0tLW0ur69u768vLi8tbfEsq+xq6a0tbS2wcLQ1tvd2dTNycHAwby+v7++vb7DzcXBubu7uLOlpJubn5ylprnCv7qyuLessberrLy3saWjq6WYqbGrmKihkJeio6iuu7qyube7t7W0tLS3vby+vL++uMHBtaCwtbS3v7+6ucHM09jW2dnU0c3FzcTJv7nAxcbIyryyt7SyrrGmnKKakKGioqStvMC3s7i0srTFxsDBsamjoquvp66ropyfn5GXn6Ckq621ta+0tre1tLS1tL3Ev769wLq3vbepr6+lsri+vrzFzNTX1tXU09LLu7y7v7vEx8TR0cS5sbK1uLmknqyro5mcpqOnqLe5srO7u7O0zca4ta6omKmpnqa1rZ6eoJyYl5ydoqGpuLS5tre9ury6u724vrm5vMTDurW4ubGrqa+yv729wMrU2Njb2tXTysbAvry+xcTGy8a6tbu/wbWvnKColaaso6e0rq+tsr27uLKyu7Kwrauxr6atop2rqaeqnqObnJqcoJ+ioqytsb68vry9wb+2tb6+urzFv7Szu722qaS0ubu6vs3M0NvV1NHR08jGwcTGw8PExsXBubjAvbCorJaaoJqlrrSusa+3sLK7tq6wtbu6tKuxsbO0rKWeqKSiqqCmm5aXn6GjpKemqK+6tri7vsK8uLu/wb2/wMK8ur3BwrKrur67vsjIytfT0NLPzMzIwsPJx8TAx8m8vsW8t76+uLmimrOzqK+wrqmzvbvBz8G8t7S7usG4srSroaGkqa2srqWjsKmgoaOkpK2wqqeutbq3vcXDwr7Av8HCx8zNxcTDy8/Mys3Dv8fOyM7a2djRycnLzs7Ny8XDwMTEwcPDwsTFxsDJyry1rqiqq6ijqLu/xtrXxra2usG+uraroKCoqrKwq7Knq7SspKOjpaarqqursbW1u7q7wMXByMTCwsjOzs7Pzs3IyM7Jx8bGzs3S4N3gzsrKysfLx8PExcLBwsfLzMzNysK+yMu9tKWpsbm7v7m6u73Dzsy+v725s7Gwq6ysp6uvqrKrpqSsqKOop6uspp6jqK2xtbe7vL6/wsTAw8XFxsrLzc/NyMrKyMO/xMnK09rZ1tLMzMrDzM/FxMjGxsbGzNHO1c/IxMG/u7eysbjFwLy+wr3CwsjXyre8wryurbu6sqmmqamon56lpZuep6mrrq6tsbWvrq60uLW0u7zCv7/Cw8fIx8/a2M7Gwr/Avr68wMjLz8/PycHDxMzOyM3Kx8zPy8jJx8jBv7y6ubO3s6+srqSnsrG1trm4u8K/wMO4tLW3v8W2p6enrLGxs62jpKessq6strq3rq+vrra6tbO4w8HAxsbLxMXGxsXHwsTBw72zvcXK0c3GwcnKzc/P09PU29PQyszPzMXBvsDBxsS/wLuyu7Ort7+3ube2vL65trCzt7m7urnDw7q0sbu9usGxmqetr7SysrWyrq2vsbC0ub3BwcPCwL7BwL68ury/wMLDwL7AxcbF0NHRz83Oz9ja1tTV2NXV1M3LxcHAv8DCxcTDzNDSy8XFvL3Burq8w8PDvbmztLSztrm3vsnCubm6t7S9uLO2tLKzt7u5uLq7urq2uMDBxb69wcHCwsC/wb/Awb27u728v8C+xci/v8LIyMjLzM7X0s7NycbEwb/DwcLGyM3MyM3U1c3HyMS5u7q8vcHAwcbIxr+6usDCwcPFwLu8x8G/vry9vb69u7m3ur+9wsTDw8PEwcK9vcLDxMTFxcTFw8TEw8HCw8HEyMrIxsXExMHFzMjHzMbEw8HAv769v8G/wcPHycjMztDQz9HSzsbGxsfFvr/DwsPAvb29wcXKz83Jytva2djW1tjY2NnX1NLS0tDOzM/PztDW1tXT0c/O0NLS0dDS0tTV1dbX1dXQz9TX2NjX19XPy8vNz87R1dfa3N3c3N7e3t/i5unm5OHf3t3d3Nvb2djX1tTV09XX1tbX1dbb29k=");
    const palette=Array.from({length:36},(_,i)=>{
      const c=Math.round(48+5.4*i);
      return surface((c<<16)|((c-2)<<8)|(c-4));
    });
    const vertices = Array.from({length:rows+1},(_,row)=>{
      const lat=Math.PI*(.5-row/rows), cr=Math.cos(lat)*1.34;
      return Array.from({length:cols+1},(_,col)=>{
        const lon=TAU*(col/cols-.5);
        return [cr*Math.sin(lon),1.34*Math.sin(lat),cr*Math.cos(lon)];
      });
    });
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
      const shade=Math.max(0,Math.min(35,Math.round((reflectance[r*cols+c]-94)/4.1)));
      const mat=palette[shade], a=vertices[r][c], b=vertices[r+1][c], d=vertices[r][c+1], e=vertices[r+1][c+1];
      if(r<rows-1) bucket.add(mat,a,b,e);
      if(r>0) bucket.add(mat,a,e,d);
    }
    bucket.finish();
    return group;
  }

  // North is +Y and east is +X. Distances in the projected terrain are locally metric.
  function terrain(encoded,cols,rows,widthKm,heightKm,stepKm) {
    const group = new T.Group(), bucket=triangles(group);
    const heights = unpack(encoded), scale=3.16/widthKm;
    const mid=heights.reduce((sum,n)=>sum+n,0)/heights.length;
    const material = Array.from({length:16},(_,i)=>{
      const c=123+4*i;
      return surface((c<<16)|((c-2)<<8)|(c-3));
    });
    const foundation=surface(0x46494b), underside=surface(0x34393a);
    const verts = Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>[
      (c/(cols-1)-.5)*widthKm*scale,
      (.5-r/(rows-1))*heightKm*scale,
      (heights[r*cols+c]-mid)*stepKm*scale*5
    ]));
    const baseZ = -mid*stepKm*scale*5-.12;
    function wall(a,b) {
      const c=[a[0],a[1],baseZ],d=[b[0],b[1],baseZ];
      bucket.add(foundation,a,c,b);
      bucket.add(foundation,b,c,d);
    }
    for(let r=0;r<rows-1;r++) for(let c=0;c<cols-1;c++) {
      const a=verts[r][c],b=verts[r+1][c],d=verts[r][c+1],e=verts[r+1][c+1];
      const value = (heights[r*cols+c]+heights[(r+1)*cols+c+1])*.5;
      const grade=Math.max(0, Math.min(15,Math.round(value/17)));
      bucket.add(material[grade],a,b,e);
      bucket.add(material[grade],a,e,d);
      if (r===0) wall(d,a);
      if (r===rows-2) wall(b,e);
      if (c===0) wall(a,b);
      if (c===cols-2) wall(e,d);
    }
    const bottom=[verts[0][0],verts[0][cols-1],verts[rows-1][cols-1],verts[rows-1][0]].map(p=>[p[0],p[1],baseZ]);
    bucket.add(underside,bottom[0],bottom[1],bottom[2]);
    bucket.add(underside,bottom[0],bottom[2],bottom[3]);
    bucket.finish();
    group.rotation.set(-.66,.12,-.09);
    return group;
  }
  return {
    solar: solarSystem(), saturn: saturnSystem(), rings: ringSector(), cassini: ringDivision(), moon: globe(),
    lunarSurface: terrain("lI6HgX+csLapop+erLuUdnB7ncDKyMrCq6qqrbC6w8vBqIZ8fXp6fHp2e3pqb4SNpcfDw8LDw8V4XlZXWnOSq6ikn56mom9mdImavsTGy7Knp6iwuMLHyrShhH19eXp7emmDhWpqkKzCu8TCwcPK2VRHRENGUnCOqqmhoaCifIKKpJ6nlp6tvK+oq7K8w8rSq4mEfX16eXt8e4WEhIqQt8bLxsTIwszYRUVDRUREVXioqaOfoLSwsq+3n42Ehoy+vra2ubvCyMqQi4F8fHt7ent4hIOFk5+4zMvK0MvIycBFRkRIR0VLY5qppKOiwLS5t7+plZCDkbbFwMPEv8PKz6SahX19fHt7e31+hYeSqsLKyNfi0MrCo0VGTFhaUFNijqWjp6Syu6pyj5iqjZSgusbCv667yc63wq2PfHl7ent7en6CiaSym6OmsNiEgrmKS0tbFxxmS2iNpqOlqKyzeGBxeZqpprrIyb2ZhY2u2NbKtpd/fHx7fHx7f4WUqp2ZnJ2ivbq4pX9cU1sCAEtfbo+pp6Wos6BtYWhvlLu9xsTCuYCFeZfV1dDApIN+fH18fX+Fi66jnJydnZ2nzsWLaT9dbzIsY2CDoqmnpKO3p3xlanebuMLHtMK5kH6BntXb2cy0l4J/fn+GioiOl6yenZ2dn6G7toJZSXFndWthcpmkr6uklZmki2xygKvEz8O9w7urnam/1uDd2My8q5+Xm56aoKeutp+dn56eobeofVKBmoyFh3WMqK2rrKCcoKKZd4Ogv8zTyMjFt8TC0s/a2NjIycuzuMCstLi5x9DGop6fn6CoxKh0UcGybFyfsLq0sa+0tp+hp5mksM3Q19PMy8O5usO2yNXMxsLFvrjE3NLU0b/Csa+tn56ksszGnGdRzq5vX6DHtrCyury+wbTBram/2cLRzayp0rfOzMrPx8PDxcjL2NvZ3dK6pqWjn664vMfe2K+CWlLGvY6WtLivsbKxt8LBrrTMwcrHpZvKqqfSt8zOy8fGxMTHysnO0dndwqyioZ6foaivxNHKkW1ZUsbDucfBrqqvq6uuusu8xdnPwMSSfL/D0c2eycvOys/NysnJydHS1tjDqaCgoKGgoKCyx7mDbVlUxsLCwbGrq6ysrK6wus7LzcOywbChwsrFwrXNz9HT3NLWzcrHzcvU1rupoqCgn5+forTIvpBwWlXLzb7Dsbmys6+ur6+xvsTBr6GhsaOmqbK2ubzS2eLg4uHb18rFu8fYzKqjoZ+eoaGkrsnarYttWczdroaDuNC6tLKwsLPAysCQlpGOioOQoLPAytXm6+nl6evl0dHIxd/RsKSaoqKhoKOyz+zuuYpuxsSBYWSL2sq7sbS5wsPDsI6IgH14ho2dvsXS3OTo5+no6eDW2drU2dC9tLCooqKip7zY8f7ivY/IsnhhXn/UzMLEzc7ErLeUj4x/gX6Dl6nI2OHWxrq9vsTZ+OvU4OLXwritrbChoaO4zOj6+PXKo83Bi21riNLNx8zTxLihnph/f4KHhXinveTq4r+onJiPm6rE+u7t8M/GuK6vraiks73K8/Tw5NepztGpmZGw1MvHzcCRj5iOjH19goB8cKrK8fPLonpjWFxvfpC76/vn0sm8sK+91L3Y2+Xr5OHPx8bIyM3Ezc7JyszEmXFscXeLj46DfoqHus3ty5ppV0tHRk1XdJm/+/HW0MO3tcTg6+vp5e3hzL+3wMLDvq64v8LFwrKQbGhudnqBlIaClKjR6dmleFdLR0JAQUZUaorQ/9vVzL+/zsHW4ufn7Nq+srCzyMe9sbC3v7u0qpCHb3KEe3aDmp24zenxt4VWSklFQD8+QEJSasH46OHbzcS3rKuww9zgvrSop6CuxL+4s8Sguseoi4mMgXJ9foeRsNHr+O+ncE9JR0lBSEFAQUtosezz8u3QpIh7e36QsNTJvZ2ZlabMx725qmaT17KMhohrZXKLjJWtzOvz8Z56U0lJUXRQQkFBSW6g6PL45rGFeHNwcXWOr8q4lpOUmcjNvrzDm73Yv52MiW1od5CWn7i94+/zsYtrTUhJdlU/Pz9LaZnl9Pbalnp2cXFwcXORsbSVkpeUzMu9ysLJzs6+r5uajYKSk5ejys/b6t69kX1aSkZDQUBAQk97pezw78eMfHxxdnNyc4OhppuRl6C/zcXSztLW0cTCuLi0lpSgpLnYz9rf6b+ZimxQS0RCQEFIYpLH7uztxoJ9eXN2c3F0gaCln5ibusDOx9DWt97axrarm8CtqL7P5cumytjoz6uTf1xYTElETGKDruHp7N+qh4B3cnp3dHiRrqykmZrM18vJyda23dLTw52LqMnK5uvy47za2OLlzq2OgW9jY2JxibHN+eTj08yiiIN9d3h4iK62uLOkotjS0piK2dDV1NjWvqjAy8/Z4d/c09fV4Onxybiako2VmaK2zubm4dfP4MKvoJmFf4ObrLjGybei2tLJwbvMy9TZ3t/f39/G08HNy9jV0dba49fO2sPAu7vCydjt2OfjzNTc3tS+v6uVlZugu97cxqnc0sTGx8fK0dfg68faybu1r6y70dPP09PXy83D0dXi7PHs7d/Y6NrH0d/ftpetzbCemqHA6uTRt+TPxcXGxsnS1t7eo7iinqGfpKzA3NbS0tbBusfEw8bc5N/c2NXZ0MfU1qJ3cn23vaWfrNHl4NLG5NjIx8rGy9LX18KqppWQnJqepLbV2dfX18iosbe6wtDT1+DR3drRzNfHhHhzeK/Hs7C92tbOzdDe08vHxMXK1djPspmim5qamp2crcDh3NrW2ru1sLTN0NXUz9jRyNLX5NWWjYmTyc+7tczZzMvK1NLOzcvJyc3V1cenlo6cmJiZno2Eirrn09ve2sm/w9jUyNTJzsTI0Nnu9cKrsNru5sXA08vJzc7XuM3P0MvR2NXXxaagnZmampmcf32Co+fm3ufl4tXY3tjL1dLNzdPTvbTG2tHf7evf0MbVzsrOzdO42dLR1NbW2d3Pr6afnpuamZqDf4Oz5unn39zw5+LUxb2+w8LR39qbiJamoarP59bYzs7R0NLTxr/f2tTT39Le3tS4jpmjnZmZmZaNr9ro68umrc/m06+dl5iYqMjauo+NjYuPj7nm2tva1My3yL7A",56,42,300,220,0.02632450),
    tycho: terrain("cm1pbmhiY2hvdHyFg4iSnKCnrK+0t77Fys/Z5uro4uTj393e3t/h4+Lj5ePh2M7FwcLCvrm2tbazsbjP1c7Hva6dj4lmXVhoZFpZXWZudH6Ci5iipquusry/w8bJ0Nri5+nj5eXh3tvb4OLh4eTn5eDXzcTAw8bGw8HBvrmzts3V0Mi9sKOVjlxSTl9gWlZbZGtzen+MmqaqrbC2vsDFy8zS297i6Ofp5+bi39/g4ODh5ubj2dHNyMXFycrKyMnFv7i4yNLRybuupp6bVE5LVVhdWV5la3R7f46eq66ws7nBxMnP0dfd3N3i5eXj4uDh4d/f4eDh4+Hb0c3KyMnLzc7NzszHw8HJ0dHJuq+qqKZTUE1QTlteYWlveH+Ek6ays7W4v8bHzM7R1NfZ29vb3NnS0Nnh4+Tj4eHi4+La1M3Ix8rOz9DS0c3Nzs7PzMS5sKypplRSUVNMV2BlbnV8hIqarbe5vsDHycvRz8zJx8jJxsfJxb28xtTc3NbX3eLm6ujj2c/GxsvP0tTV0tPW0svDurOtqaOfVVNUV1NYXmdveYCJj52wuLzHyc7S1drRxb67t7Ouqqutr7Gxtbu8ubzF2efw9fLp3M3GyM7T19nY2tvRx7yzq6ilnplaVlVYWFleZnF+h46To7W8v8zO09ve3M3Auraso5uYmp6kpJ6dn6OlqKy90+b4+/ft3M/JzdTb4N/h387CuLGqpaOdl19bW1tXV19oeYaRlZyuwMfK0tTY3d3WxLmyqp6VkI6NkJWQiYiKkZmenqKxyOT2/Pru39LR2uHl5uffyr62sq2no5yWYGFhXVFOWGl/jpmeqbzO2Nve3+De1sS1raSXjoaDf3x9fXVwcHB4hI2QkJWkwt30+/nw4tvi6Ovt6t/Iu7S1squmnplhZWNZRUFNYXyQnaezxtfn6ejq5tjHs6qjlYZ9c2tnZ2RcV1lcW19nc3uAgoievN/x9/nv5urw8O7o3cm+tra0r6qhnF5mYVJAPUZZeY+erLnK2+/x7vHlzLytpZiFc2hcUElLRjw8QUhOTlNdZGxxdoGZvtbm8fPw8vXy6+LZycK5t7axq6OdWmFcTT87Rlp9kqCtvs3f8fXy7tnFtqOWhW9cUEc6MjArJScoMT9CRExRWWNqcH6Zscrc6/X6+fPn3NXHw7y6ubKspJ1YXVtQSUNMYYeZpK7B0N/v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aHqNn7bU5u/m4t/f6ezezL6ninXDoZCMk6q+xMfR3t7e4ODTvKmbjX94bWdeVEY4MDAuKyUhHx4dGRQWGiEoMT9JWGl8kZ2rxen68uXj3d3k39THu6ydidK0nZSducnDw9Df3dvf3t/Yw6qajYV5cGNZU0w+Ozg0MCwqKSspJCYnMTtGU1ttfZGlqrzc9fzw4t7Y29zSy8XBvbSi2sW0rLTIz8jCzdnZ2d/d3uTgx6+dmIt+bmBcXFBLSEA7NjM1PD07PDpFT11pcYSTpbK0y+v08Obd19Ta1MbExMnNxbPb0snFyMzOysHI09TX3t3d5+/lza+ooJF+bWZmYV1aUk1JREhQVVZSUVxlc32HmKGvusHZ7Ovl39vU09XMvrzCztbQv9fSzsrIyc3LxMrR1Nfa3+Ho7vHlxbGspJN/dnJua2lnYWFdYGZwb2ttdnyHj5mjqrjG0+Hi4eDd29bU0su6t8DR2dbJzszKxL/FycTDyMzR19je4uXl6ejVu7Gyp5KIgHh1dXVvcHJ5gIaHiI6Pj5mgqa25ztzh2tTX3Nzb2NbQxba6xdHW1c/KycrCvMPHxMTGx87U19vg4Nva2dXIuLu5ppiQiIWGhX58hI2SlZmfpKOiqKuyus7i493Pzdjd3NnY1Mq/tr7IztLT0svKzMbAxMXExMfKz9DT2t7b0s3JxsXCyc/Er6KdnqGhmZSYnJ2fo6qxsbK0tsLU5eff1srN2uDb3NnPxLy3wcfKz9HUzMzMx8LBwsTGycvOzdHW19PKx8S9ubnBy9TNvbO0uL67uLe1tLW0u8DAxcnR4O3u5dzVy8zb4N7h2cm/urnCxsfN0tbKzM3HwL3AxcfIx8rKz9DQzMfDxMK7sbK6yNXUysXHz9DRzc/T1NLW2dri5ebs7+fe1tLO0d7h4eDUxby4usLFxsvU2MbKzMW+vL/ExsbDxcfJzczFxL6/wr+yrK+0xM7Uz8zY3N7e4Obr6u3u6Ojn5ern3tbRzc3T3+Hf2s7DurW3vsPGy9XYwsjNx8K/wcXGxL/BxcXHyMK/uLi6uri0sa6wt8HCw8zP0djf6e/u7+7l4+Hc4ODY0cvFydPb2tbQyMC2sbS8wsjO1dC7xs3MycPExcXCv8DEwMHGwLqyr6+yuLq4s6yttbe2ubzBytbf5OXn5uDc19XZ2NPNycPFz9PRz8vDvrWwtL3Dy9DRwrHBy9DNyMjFw8LAv8PCxMjAtq+opaiwtri2srG1trOusbjAytTY293d2tXPz9LS0MzJxsfNz87Mx8G/ubW6wsfO0civqrvH0M/My8XExsPAxsfIysS4raOeoKatsbS0sbCvq6mrrrXBzdPZ2dfX1dHPz87NysrLzdDQzcrFwb+7u8DEyNDPvp2ktcLO0c/NyMbJx8fIycnKx7ywopiWm6OorK2qp6inqKmprbjH0dbSyszS19bRzMfGy8/R0tLOycXCv7u8wMPI0My3kKCvvsrS0c3KyMrIysrKysvJwLWklY6PlpygoqOkpaWnqq2vtsPNz8fAw8zX2dXMxMTM0dPS0s7HxMPAurzAxcrSzLKHn628x9LSzszKy8rJysrKy8vEu6qXjY2RlJeanKCgoqats7a4u8LGwLy+xtLW1c/Gxs7S09DMyMPDw8K9v8PKztXQsYU=",68,58,122,104,0.01993700)
  };
};
