# Earth imagery

All texture assets are stored locally; runtime does not hotlink external imagery.

| Asset | Source | Processing | Credit |
|---|---|---|---|
| earth-day-4k.jpg | https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_8192.png | NASA Blue Marble land, ocean color and sea ice; resized from 8192×4096 to 4096×2048; JPEG quality 90 | NASA Goddard Space Flight Center / Reto Stöckli; enhancements by Robert Simmon |
| earth-clouds-2k.jpg | https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg | Original 2048×1024 luminance map, used as cloud opacity in shader | NASA Goddard Space Flight Center / Reto Stöckli; enhancements by Robert Simmon |
| storm-sat.png | Local generated asset (ImageGen, satellite-style top-down typhoon) | 1024×1024 luminance decal; shader maps it around the view-locked storm center and relights it | Generated for this project; no third-party imagery |
| earth-poster.jpg | Local browser screenshot of this scene | Cropped above preview controls; static fallback | Rendering based on the NASA textures above |

NASA media guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/
NASA surface source page: https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/
Cloud source description: https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/

The scene uses historical composite imagery, not live Earth observations. No NASA logos or endorsement are implied.
