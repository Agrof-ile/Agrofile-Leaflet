import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import shp from "shpjs";
import axios from "axios";

let find_column_key = function(columns: any[], id: string): any {
	const keys: any[] = Object.keys(columns)
	for (let i = 0; i < keys.length; i++) {
		if (columns[keys[i]]["id"] === id) {
			return keys[i]
		}
	}
	console.log("wtf")
	return undefined
}

let load_map = async function(): Promise<void> {
	let lmap = L.map('map', {
		center: [48.73562156552866, 2.52116218332756],
		zoom: 9
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

	const props_titles = (await axios.get(`/?api/carto/props_titles`)).data
	console.log("props_titles:", props_titles)

	const bazarliste_values_map = (await axios.get(`/?api/entries/bazarlist`)).data
	console.log("bazarliste_values_map:", bazarliste_values_map)
	const form_bazarlist = bazarliste_values_map["forms"][map_form_id]

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
		const geojson_layer = new L.GeoJSON(geojson)

		let popup_text = ""
		const props_titles_keys = Object.keys(props_titles)
		popup_text += `<h1>${feature["properties"]["bf_nomfiche"]}</h1>`
		props_titles_keys.forEach((key: string) => {
			popup_text += `<p style="margin-top:0.5em; margin-bottom:0.5em"><b>${props_titles[key]}</b><br>`
			if (feature["properties"][key] === "") {
				popup_text += "Champ non renseigné"
			} else {
				if (key === "url") {
					popup_text += `<a href=${feature["properties"][key]}>${feature["properties"][key]}</a>`
				} else if (key.substring(0, 10) === "radioListe" || key.substring(0, 13) === "checkboxListe") {
					const column_key = find_column_key(form_bazarlist, key)
					// console.log("column_key", column_key)
					popup_text += form_bazarlist[column_key]["options"][feature["properties"][key]]
				} else {
					popup_text += feature["properties"][key]
				}
			}
			popup_text += "</p>"
		})
		geojson_layer.bindPopup(popup_text, { maxHeight: 400 });
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