import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import shp from "shpjs";
import axios from "axios";

let load_map = async function(): Promise<void> {
	let lmap = L.map('map', {
		center: [7.2, 40.9],
		zoom: 2
	});

	let tile_layer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	});
	tile_layer.addTo(lmap);

	let regions_geojson = await axios.get('/data/regions.geojson')
	var geojsonLayer = new L.GeoJSON(regions_geojson.data);
	geojsonLayer.addTo(lmap);
	
	let satelliteLayer = L.imageOverlay('data/landsat.png', [[44.70723, -0.784355], [44.968463, -0.3957438]]);
	satelliteLayer.addTo(lmap);
	// console.log(satelliteLayer);

	let departements_geojson = await shp(`${window.location.href}${'/data/departement.zip'}`) as GeoJSON.FeatureCollection
	// console.log(departements_geojson)
	var departements_geojson_layer = new L.GeoJSON(departements_geojson);
	departements_geojson_layer.addTo(lmap);
}

load_map();