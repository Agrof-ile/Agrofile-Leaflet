import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import shp from "shpjs";
import axios from "axios";

let load_map = async function(): Promise<void> {
	let lmap = L.map('map', {
		center: [7.2, 40.9],
		zoom: 2
	});

	const osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	});
	osm.addTo(lmap);

	// let regions_geojson = await axios.get('/data/regions.geojson')
	// var geojsonLayer = new L.GeoJSON(regions_geojson.data);
	// geojsonLayer.addTo(lmap);
	
	// let satelliteLayer = L.imageOverlay('data/landsat.png', [[44.70723, -0.784355], [44.968463, -0.3957438]]);
	// satelliteLayer.addTo(lmap);
	// // console.log(satelliteLayer);

	const form_id_json = (await axios.get(`/?api/carto/map_form_id`)).data
	console.log("form_id_json:", form_id_json)
	const map_form_id = form_id_json["map_form_id"]
	console.log("map_form_id:", map_form_id)

	const geojson_form = (await axios.get(`/?api/forms/${map_form_id}/entries/geojson`)).data
	console.log("geojson_form:", geojson_form)

	// const metadata_to_shp = Object({
	// 	"CaracteristiquesFoncierNicolasTest2": "departement.zip",
	// 	"CaracteristiquesFoncierEssai2": "ne_10m_airports.zip"
	// })

	// const metadata = (await axios.get("/?api/carto/form")).data
	// console.log(metadata)

	await axios.get(`/?api/carto/ruzip`)

	let fields = L.layerGroup()
	geojson_form.features.forEach(async (feature: { id: string | number; properties: any }) => {
		const zipshp_filename = feature["properties"]["fichiershp_file"]
		console.log("window.location.href", window.location.href)
		// let geojson = await shp(`${window.location.href}${zipshp_filename}`) as GeoJSON.FeatureCollection
		const origin_path = window.location.origin
		const path_to_shp = `${origin_path}/files/${zipshp_filename}`
		console.log("path_to_shp_zipendno", path_to_shp)
		const path_to_shp_zipendok = path_to_shp.substring(0, path_to_shp.length-1)
		console.log("path_to_shp_zipendok", path_to_shp_zipendok)
		const geojson = await shp(path_to_shp_zipendok) as GeoJSON.FeatureCollection
		console.log("geojson", geojson)
		const geojson_layer = new L.GeoJSON(geojson);
		geojson_layer.bindPopup('<p>You are here ' + "username" + '</p>' + feature.properties.bf_nomfiche);
		fields.addLayer(geojson_layer);
	});
	fields.addTo(lmap);

	const baseMaps = {
		"OpenStreetMap": osm
	};
	const overlayMaps = {
		"Parcellaires": fields
	};
	L.control.layers(baseMaps, overlayMaps).addTo(lmap);
}

load_map();