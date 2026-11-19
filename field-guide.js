// Each stop pairs a particular model or camera with a short, sourced field note.
window.observatoryGuide = (() => {
  const references = {
    planets: ["NASA · The planets", "https://science.nasa.gov/solar-system/planets/"],
    saturn: ["NASA · Saturn facts", "https://science.nasa.gov/saturn/facts/"],
    cassini: ["NASA Cassini · The Great Divide", "https://science.nasa.gov/resource/the-great-divide/"],
    moon: ["NASA · Lunar craters", "https://science.nasa.gov/moon/lunar-craters/"],
    tycho: ["NASA LRO · Tycho’s central peak", "https://science.nasa.gov/resource/tycho-craters-central-peak-on-the-moon/"],
    eclipse: ["NASA · A solar eclipse guide", "https://science.nasa.gov/feature/solar-eclipse-guide/"],
    guitar: ["Yamaha · How a guitar makes sound", "https://europe.yamaha.com/en/musical-instruments/guitars-basses-amps/explore/musical-instrument-guide/acoustic-guitar/structure001.html"],
    strings: ["Yamaha · Strings and pitch", "https://europe.yamaha.com/en/musical-instruments/guitars-basses-amps/explore/musical-instrument-guide/acoustic-guitar/structure003.html"],
    scope: ["NASA · Telescopes 101", "https://science.nasa.gov/universe/telescopes-101/"],
    optics: ["OpenStax · Telescope optics", "https://openstax.org/books/college-physics-2e/pages/26-5-telescopes"],
    bearings: ["Ordnance Survey · Compass bearings", "https://www.ordnancesurvey.co.uk/mapzone/map-skills/compass-bearings/page-two"],
    north: ["NOAA · Magnetic declination", "https://www.ncei.noaa.gov/node/2181"]
  };
  const stops = {
    reset: {
      title:"The studio", heading:"Choose a starting point", theme:"studio",
      text:"Three instruments sit beneath an eclipsed Sun. Select a marker to pick one up, or leave the studio and explore the Solar System.",
      links:["solar","guitar","telescope","compass"]
    },
    solar: {
      title:"Solar System", heading:"Choose a world", parent:"reset", theme:"space",
      text:"Eight planets orbit the Sun. Follow Saturn out to its icy rings, or start closer to home and descend from the Moon’s near side to a single crater.",
      note:"Planet sizes and orbital spacing are compressed so all eight fit in view. The positions are illustrative.",
      source:"planets", links:["saturn","moon","eclipse"]
    },
    saturn: {
      title:"Saturn", heading:"A world encircled by ice", parent:"solar",
      text:"Saturn’s broad rings sit in a thin plane around its equator. Turn the planet until the rings appear edge-on, then enter the ring plane to inspect its bands.",
      source:"saturn", links:["rings"]
    },
    rings: {
      title:"Saturn’s rings", heading:"Find the dark lane", parent:"saturn",
      text:"Count outward from the brighter B ring. A dark lane separates it from the outer A ring. Even the dense bands consist of countless pieces, mostly water ice, orbiting Saturn individually.",
      source:"saturn", links:["cassini"]
    },
    cassini: {
      title:"Cassini Division", heading:"Read a gap in the rings", parent:"rings",
      text:"The Cassini Division spans roughly 4,700 km. The moon Mimas helps shape the outer edge of the B ring through repeated gravitational tugs. Fainter material still orbits within the division.",
      note:"The particles in this close-up are enlarged to show the change in density.", source:"cassini", links:[]
    },
    moon: {
      title:"Earth’s Moon", heading:"Read the lunar near side", parent:"solar",
      text:"The dark plains are maria, basins filled by ancient lava. The brighter, rougher highlands preserve a longer record of impacts. Head down to the surface to compare their textures.",
      note:"The near-side markings are sampled from lunar-orbiter imagery.", source:"moon", links:["lunarSurface"]
    },
    lunarSurface: {
      title:"Lunar surface", heading:"The shape of an impact", parent:"moon",
      text:"An impact excavates rock and throws debris beyond the rim. In a large crater the walls can collapse into terraces and the deeply compressed floor can rebound into a central peak. Tycho shows all three features.",
      source:"moon", links:["tycho"]
    },
    tycho: {
      title:"Tycho crater", heading:"Descend to the central peak", parent:"lunarSurface",
      text:"Tycho is about 85 km across. Its central peak rises roughly 2 km above the crater floor. Orbit low across the bowl to see how the summit sits inside the rim.",
      note:"The elevation is exaggerated fivefold. Open the central peak for a closer view.", source:"tycho", links:["summit"]
    },
    summit: {
      title:"Central peak", heading:"Stand over the rebound", parent:"tycho",
      text:"The summit marks the centre of the impact bowl. Deep rock rebounded after compression, leaving a mountain inside the crater. Rotate down toward the horizon to compare the peak with the surrounding floor.",
      note:"This is a close-up of the same fivefold-exaggerated elevation mesh.", source:"tycho", links:[]
    },
    eclipse: {
      title:"Solar eclipse", heading:"Reveal the solar corona", parent:"solar",
      text:"At totality, the Moon covers the Sun’s bright visible surface. The much fainter outer atmosphere, the corona, becomes visible around the lunar silhouette.",
      note:"This alignment study exaggerates the separations. Rotate it to see how the two discs line up.", source:"eclipse", links:[]
    },
    telescope: {
      title:"Telescope", heading:"Follow a beam of starlight", parent:"reset", theme:"optics",
      text:"Look for the wide objective at the brass end of the tube. This instrument is a refractor. Its glass bends incoming light toward a focus, where the eyepiece can magnify the image.",
      source:"scope", links:["objective"]
    },
    objective: {
      title:"Objective lens", heading:"Where parallel rays meet", parent:"telescope",
      text:"Light from a distant point arrives nearly parallel. In this cutaway, three rays from the left pass through a converging lens and meet at the same focal point. Rotate the assembly to see the rays in depth.",
      note:"The diagram uses the thin-lens approximation.", source:"optics", links:["eyepiece"]
    },
    eyepiece: {
      title:"Eyepiece", heading:"Change the magnification", parent:"objective",
      text:"For this 600 mm objective, divide its focal length by the eyepiece focal length. Switch eyepieces to change Saturn’s apparent size in the circular view.",
      note:"A simulated eyepiece view. The two choices use the same apparent field of view.", source:"optics", experiment:"eyepiece", links:["saturn"]
    },
    guitar: {
      title:"Acoustic guitar", heading:"Where the sound begins", parent:"reset", theme:"music",
      text:"A plucked string moves little air on its own. Follow it to the bridge, where its vibration passes into the wooden top of the guitar.",
      source:"guitar", links:["bridge"]
    },
    bridge: {
      title:"Bridge & soundboard", heading:"From six strings to a wooden top", parent:"guitar",
      text:"Look across the saddle and follow the strings over the sound hole. The bridge transfers their motion into the soundboard. The vibrating wood and the air inside the body help carry that sound into the room.",
      source:"guitar", links:["octave"]
    },
    octave: {
      title:"Vibrating string", heading:"Hear the twelfth fret", parent:"bridge",
      text:"Try the open A string, then stop it at the twelfth fret. With tension and string mass per unit length held constant, halving the vibrating length doubles the fundamental frequency.",
      note:"The curved string shows the shape of its fundamental mode. Pluck to hear a synthesized note.", source:"strings", experiment:"octave", links:[]
    },
    compass: {
      title:"Jack Sparrow’s compass", heading:"A fictional compass with a real counterpart", parent:"reset", theme:"navigation",
      text:"In Pirates of the Caribbean, Jack’s compass leads its holder toward what they most desire. Inspect the compass rose, then try the magnetic principle used by an ordinary navigation compass.",
      links:["rose"]
    },
    rose: {
      title:"Compass rose", heading:"Read a bearing", parent:"compass",
      text:"The fixed rose gives a direction its angle. Start at north and read clockwise. East is 90°, south 180° and west 270°. The pivot at the centre lets the needle turn above the markings.",
      source:"bearings", links:["declination"]
    },
    declination: {
      title:"Magnetic north", heading:"Compare two norths", parent:"rose",
      text:"The brass marker gives true north. The red needle follows the horizontal component of the local magnetic field. Change the example declination to watch the angle between them.",
      note:"These angles are examples. Actual declination depends on location and date.", source:"north", experiment:"declination", links:[]
    }
  };
  stops.cassini.photo={
    path:"assets/cassini-division.webp", width:800,height:800,
    alt:"Dark curved ringlets separate Saturn’s bright B ring from its dimmer A ring.",
    caption:"Cassini photographed the division in visible light on 28 January 2016.",
    credit:"NASA/JPL-Caltech/Space Science Institute",url:references.cassini[1]
  };
  const peakPhoto={
    path:"assets/tycho-peak.webp",width:800,height:367,
    alt:"A sunlit mountain rises from Tycho’s crater floor, casting a long shadow.",
    caption:"Lunar Reconnaissance Orbiter caught sunrise on Tycho’s central peaks on 10 June 2011.",
    credit:"NASA Goddard/Arizona State University",url:references.tycho[1]
  };
  stops.tycho.photo=stops.summit.photo=peakPhoto;
  return { stops, references };
})();
