# Sandfield Training: Leaftlet.js and GeoJSON

This is the repo for the Sandfield training of 06/03/2020 by Mason Galland.

When I first endeavored on this quest I thought to myself _"This will be easy, I will just show off a few basic features of this cute map library"_, I was so wrong, finding myself side tracked and falling down the rabbit hole of GeoJSON, geo data optimization, and standards. 

Unfortunately given time constraints I was not able to explore the geo data processing and standards aspects as in-depth as I would have liked, but I have provided further reading and sources below if you are interested as a starting point, as I believe knowing these things could allow you to truly utilize the full potential of Leaflet.js. 

## Useful Tools and Sources
* [Leaflet.js](https://leafletjs.com/) - The library in question, a open source JavaScript map library.
* [Leaflet-providers preview](https://leaflet-extras.github.io/leaflet-providers/preview/) - A quick preview of different map title layers that are available for Leaflet.js. 
* [cdnjs](https://cdnjs.com/) - A great cdn for all your JS and CSS library needs, I recommend using this with [LibMan](https://docs.microsoft.com/en-us/aspnet/core/client-side/libman/libman-vs).
* [Natural Earth](https://www.naturalearthdata.com/downloads/) - Open source and maintained map datasets, such as country and region data.
* [geojson-maps](https://geojson-maps.ash.ms/) - An open source web tool that allows you to easily download Natural Earth country data directly as a GeoJSON file. The github repo can be found [here](https://github.com/AshKyd/geojson-regions).
* [geojson.io](http://geojson.io/) - An web tool for creating and editing custom GeoJSON.
* [mapshaper](https://mapshaper.org/) - An open source web tool used for simplifying and converting Shapefile, GeoJSON, TopoJSON, and other geo data. The github repo can be found [here](https://github.com/mbloch/mapshaper).
* [NetTopologySuite](https://github.com/NetTopologySuite/NetTopologySuite) - A C# library that will allow you to programmatically do what mapshaper does, if you can understand the [documentation](http://nettopologysuite.github.io/NetTopologySuite/api/NetTopologySuite.html) that is. I found an [old public repo](https://github.com/capesean/TopologyPreservingSimplifier) that might serve as a useful starting point compared to the official documentation. 
* [GeoJSON Utilities](https://jasonheppler.org/courses/csu-workshop/geojson-utilities.html) - A collated list of GeoJSON related utilities focused more toward Node.js but could still be useful. 
* [awesome geojson](https://project-awesome.org/tmcw/awesome-geojson) - Pretty much the same as above but looks like its more up-to-date and with more stuff.
* [Nominatim](https://wiki.openstreetmap.org/wiki/Nominatim) - Self hosted geocoding and reverse geocoding for free!
* [LocationIQ](https://locationiq.com/) - A geocoding and reverse geocoding provider that offers the best free plan. 

## Extra Reading
* [Official GeoJSON Specification](https://tools.ietf.org/html/rfc7946)
* [Article - More than you ever wanted to know about GeoJSON](https://macwright.org/2015/03/23/geojson-second-bite.html)
* [Article - Simplifying Spatial Data while Preserving Topologies in C#](https://www.webfresh.co.za/2018/08/10/simplifying-spatial-data-while-preserving-topologies-in-c/)