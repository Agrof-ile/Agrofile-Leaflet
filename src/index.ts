import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import shp from "shpjs";
import axios from "axios";

let load_map = async function(): Promise<void> {
	let lmap = L.map('map', {
		center: [7.2, 40.9],
		zoom: 2
	});

	let osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	});
	osm.addTo(lmap);

	// let regions_geojson = await axios.get('/data/regions.geojson')
	// var geojsonLayer = new L.GeoJSON(regions_geojson.data);
	// geojsonLayer.addTo(lmap);
	
	// let satelliteLayer = L.imageOverlay('data/landsat.png', [[44.70723, -0.784355], [44.968463, -0.3957438]]);
	// satelliteLayer.addTo(lmap);
	// // console.log(satelliteLayer);

	let metadata_to_shp = Object({
		"CaracteristiquesFoncierNicolasTest2": "departement.zip",
		"CaracteristiquesFoncierEssai2": "ne_10m_airports.zip"
	})

	let metadata = (await axios.get("/?api/carto/form")).data
	console.log(metadata)
	let fields = L.layerGroup()
	metadata.features.forEach(async (feature: { id: string | number; properties: any }) => {
		const zipshp_filename = metadata_to_shp[feature.id]
		console.log("Salut", window.location.href)
		// let geojson = await shp(`${window.location.href}${zipshp_filename}`) as GeoJSON.FeatureCollection
		const origin_path = window.location.origin
		const path_to_shp = `${origin_path}/data/shp/${zipshp_filename}`
		console.log("Deux", path_to_shp)
		let geojson = await shp(path_to_shp) as GeoJSON.FeatureCollection
		console.log(geojson)
		var geojson_layer = new L.GeoJSON(geojson);
		geojson_layer.bindPopup('<p>You are here ' + "username" + '</p>' + feature.properties.bf_nomfiche);
		fields.addLayer(geojson_layer);
	});
	fields.addTo(lmap);

	let baseMaps = {
		"OpenStreetMap": osm
	};
	let overlayMaps = {
		"Parcellaires": fields
	};
	L.control.layers(baseMaps, overlayMaps).addTo(lmap);
}

load_map();