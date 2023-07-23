import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import shp from "shpjs";
import axios from "axios";

let find_prop_options_i = function(columns: any[], prop_id: string): any {
	console.log("columns", columns)
	console.log("prop_id", prop_id)
	const keys: any[] = Object.keys(columns)
	for (let i = 0; i < keys.length; i++) {
		if (columns[keys[i]]["id"] === prop_id) {
			console.log("found")
			return keys[i]
		}
	}
	console.log("wtf")
	return undefined
}

let parse_prop_option_id = function(complex_prop_option_id: string): string[] {
	console.log("complex_prop_option_id", complex_prop_option_id)
	let cut_prop_option_id: string[] = []
	let prop_option_id: string = ""
	let i = 0
	while (i < complex_prop_option_id.length) {
		if (complex_prop_option_id[i] === ",") {
			if (prop_option_id.length > 0) {
				cut_prop_option_id.push(prop_option_id)
				console.log("1", cut_prop_option_id)
			}
			prop_option_id = ""
			console.log("2", cut_prop_option_id)
			i++
		}
		prop_option_id += complex_prop_option_id[i]
		i++
	}
	if (prop_option_id.length > 0) {
		cut_prop_option_id.push(prop_option_id)
	}
	return cut_prop_option_id
}

let checkboxes_toogle_layers = function(props_titles_keys: string[], layers_to_show: L.LayerGroup<any>, layer_collections: any) {
	// console.log("Hello")
	// console.log(input.id)
	// const prop_id = (input.parentElement as HTMLFormElement).id
	// let layers_to_show: L.Layer[] = []
	layers_to_show.clearLayers()
	let layers_to_hide = L.layerGroup()
	props_titles_keys.forEach((prop_id: string) => {
		console.log("prop_id", prop_id)
		if (prop_id.substring(0, 10) === "radioListe" || prop_id.substring(0, 13) === "checkboxListe") {
			let all_layers = L.layerGroup()
			let ok_layers = L.layerGroup()
			Object.keys(layer_collections[prop_id]).forEach((prop_option_id: string) => {
				console.log("prop_option_id", prop_option_id)

				const input = document.getElementById("option_input-" + prop_id + "-" + prop_option_id) as HTMLInputElement
				console.log("input", input)

				const options_layers = layer_collections[prop_id][prop_option_id]
				options_layers.eachLayer((layer: L.Layer) => {
					console.log("layer", layer)
					all_layers.addLayer(layer)
					if (input.checked === true) {
						console.log("found!!")
						ok_layers.addLayer(layer)
						// if (!layers_to_show.hasLayer(layer)) {
						// 	console.log("schon")
						// 	layers_to_show.addLayer(layer)
						// }
					}
				})
			})
			console.log("all_layers", all_layers)
			console.log("ok_layers", ok_layers)
			all_layers.eachLayer((layer: L.Layer) => {
				layers_to_show.addLayer(layer)
				if (ok_layers.hasLayer(layer) === false) {
					layers_to_hide.addLayer(layer)
				}
			})
			console.log("layers_to_hide", layers_to_hide)
		}
	})
	layers_to_hide.eachLayer((layer: L.Layer) => {
		layers_to_show.removeLayer(layer)
	})
	// const layers = layers_to_show.getLayers()
	// layers.forEach((layer: L.Layer) => {
	// 	alert("Coin")
	// })
}

let set_popup_content = function(feature: any, geojson_layer: L.Layer, props_titles_keys: string[], props_titles: any, form_bazarlist: any, layer_collections: any) {
	let popup_text = ""
	popup_text += `<h1>${feature["properties"]["bf_nomfiche"]}</h1>`
	props_titles_keys.forEach((prop_id: string) => {
		console.log("=== prop_id", prop_id)
		popup_text += `<p style="margin-top:0.5em; margin-bottom:0.5em"><b>${props_titles[prop_id]}</b><br>`

		const prop_option_id = feature["properties"][prop_id]
		if (prop_id === "url") {
			popup_text += `<a href=${prop_option_id}>${prop_option_id}</a>`
		} else {
			if (prop_option_id === "") {
				popup_text += "Champ non renseigné"
				console.log("Champ non renseigné")
			} else {
				if (prop_id.substring(0, 10) === "radioListe" || prop_id.substring(0, 13) === "checkboxListe") {
					const cut_prop_option_id = parse_prop_option_id(prop_option_id) // complex_prop_option_id contains multiple prop_option_id separated by commas ","
					console.log("cut_prop_option_id", cut_prop_option_id)
					cut_prop_option_id.forEach((prop_option_id: string) => {
						const prop_options_i = find_prop_options_i(form_bazarlist, prop_id)
						// console.log("column_key", column_key)
						popup_text += form_bazarlist[prop_options_i]["options"][prop_option_id] + " / "
						// console.log("overlayMaps[key]", overlayMaps[prop])
						// console.log(`overlayMaps[key][feature["properties"][key]]`, overlayMaps[prop][feature["properties"][prop]])
						// overlayMaps[prop_id][prop_option_id].addLayer(geojson_layer);
						console.log("layer_collections", layer_collections)
						console.log("prop_id", prop_id)
						console.log("layer_collections[prop_id]", layer_collections[prop_id])
						console.log("prop_option_id", prop_option_id)
						layer_collections[prop_id][prop_option_id].addLayer(geojson_layer)
					})
					popup_text = popup_text.substring(0, popup_text.length-3) // Remove last " / "
				} else {
						popup_text += prop_option_id
				}
			}
		}
		popup_text += "</p>"
	})
	geojson_layer.bindPopup(popup_text, { maxHeight: 400 });
}

let load_geometries = async function(geojson_form: any, props_titles_keys: string[], props_titles: any, form_bazarlist: any, layer_collections: any, layers_to_show: L.LayerGroup<any>, ) {
	layers_to_show.clearLayers()
	await geojson_form.features.forEach(async (form_feature: { id: string | number; properties: any }) => {
		const zipshp_filename = form_feature["properties"]["fichiershp_file"]
		console.log("window.location.href", window.location.href)
		// let geojson = await shp(`${window.location.href}${zipshp_filename}`) as GeoJSON.FeatureCollection
		const origin_path = window.location.origin
		const path_to_shp = `${origin_path}/files/${zipshp_filename}`
		console.log("path_to_shp_zipendno", path_to_shp)
		const path_to_shp_zipendok = path_to_shp.substring(0, path_to_shp.length-1)
		console.log("path_to_shp_zipendok", path_to_shp_zipendok)
		const geojson = await shp(path_to_shp_zipendok) as GeoJSON.FeatureCollection
		console.log("geojson", geojson)

		geojson.features.forEach((geom_feature: any) => {
			geom_feature["properties"] = form_feature["properties"]
		})
		console.log("geojson", geojson)

		let rangeMin = Number((document.getElementById("min_input") as HTMLInputElement).value);
		let rangeMax = Number((document.getElementById("max_input") as HTMLInputElement).value);
		const geojson_layer = new L.GeoJSON(geojson, {
			onEachFeature:
				function(feature: any, layer: L.Layer) {
					set_popup_content(feature, layer, props_titles_keys, props_titles, form_bazarlist, layer_collections)
				},
			filter:
				function(feature) {
					return (feature.properties["surface_numerique"] <= rangeMax) && (feature.properties["surface_numerique"] >= rangeMin);
				}
		})

		layers_to_show.addLayer(geojson_layer)
		console.log("------------------ layer_collections:", layer_collections)
	});
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

	const props_titles_keys = Object.keys(props_titles)

	let layers_to_show = L.layerGroup()
	let layer_collections: any = {}

	const filters_divs = document.getElementById("filters") as HTMLDivElement;

	// // let groups: any = {}
	props_titles_keys.forEach((prop_id: string) => {
		console.log("prop_id", prop_id)
		if (prop_id.substring(0, 10) === "radioListe" || prop_id.substring(0, 13) === "checkboxListe") {
			// let key_group: any = {}
			// const prop_options_i = find_prop_options_i(form_bazarlist, prop_id)
			// console.log("prop_options_i", prop_options_i)
			//const prop_options = form_bazarlist[prop_options_i]["options"]
			// Object.keys(prop_options).forEach((prop_value: string) => {
			// 	overlayMaps[prop_value] = key_group
			// })
			// groups[key] = L.layerGroup()
			// console.log(overlayMaps)

			const filter_div = document.createElement("div")
			filter_div.id = "filter_div-" + prop_id

			const prop_button = document.createElement("button")
			prop_button.id = "prop_button-" + prop_id
			prop_button.innerText = props_titles[prop_id]
			prop_button.addEventListener('click', function(this: HTMLButtonElement) {
				const form_div = document.getElementById("form_div-" + prop_id) as HTMLDivElement
				if (form_div.style.display === "none") {
					form_div.style.display = "block"
				} else {
					form_div.style.display = "none"
				}
			}, false);
			filter_div.appendChild(prop_button);

			const div_br = document.createElement("br")
			filter_div.appendChild(div_br);

			const form_div = document.createElement("div")
			form_div.id = "form_div-" + prop_id
			form_div.className = "dropdown-content"

			const prop_form = document.createElement("form")
			prop_form.id = prop_id

			const prop_options_i = find_prop_options_i(form_bazarlist, prop_id)
			const prop_options = form_bazarlist[prop_options_i]["options"]
			console.log("prop_options", prop_options)
			let prop_layer_collection: any = {}
			Object.keys(prop_options).forEach((prop_option_id: string) => {
				const option_input = document.createElement("input")
				option_input.type = "checkbox"
				option_input.id = "option_input-" + prop_id + "-" + prop_option_id
				option_input.checked = true
				// input.addEventListener('onchange', function(checkbox: HTMLInputElement, layers_to_show: L.LayerGroup<any>) {
					option_input.addEventListener('change', function(this: HTMLInputElement) {
						checkboxes_toogle_layers(props_titles_keys, layers_to_show, layer_collections)
					}, false);
					// input.onclick = toogle_layers.bind(this, layers_to_show)
					prop_form.appendChild(option_input);

					const option_label = document.createElement("label")
					option_label.htmlFor = "option_input-" + prop_id + "-" + prop_option_id
					option_label.innerText = prop_options[prop_option_id]
				prop_form.appendChild(option_label);

				const form_br = document.createElement("br")
				prop_form.appendChild(form_br);

				form_div.appendChild(prop_form)

				prop_layer_collection[prop_option_id] = L.layerGroup()
			})
			filter_div.appendChild(form_div)

			filters_divs.appendChild(filter_div)

			layer_collections[prop_id] = prop_layer_collection
		}
	})

	const surface_div = document.createElement("div")
	// surface_slider_div.className = "noUiSlider"

	// noUiSlider.create(surface_slider_div, {
	// 	start: [0, 500],
	// 	connect: true,
	// 	range: {
	// 		'min': 0,
	// 		'max': 500
	// 	}
	// });
	// filters_divs.appendChild(surface_slider_div)

	// const slider_value_span = document.createElement("span")
	// filters_divs.appendChild(slider_value_span)

	// surface_slider_div.noUiSlider.on('update', function (values: any, handle: any) {
	// 	slider_value_span.innerHTML = values[handle];
	// });


	const surface_br_1 = document.createElement("br")
	surface_div.appendChild(surface_br_1)

	const surface_span = document.createElement("span")
	surface_span.innerHTML = "Surface du parcellaire (ha)"
	surface_div.appendChild(surface_span)

	const surface_br_2 = document.createElement("br")
	surface_div.appendChild(surface_br_2)

	const min_label = document.createElement("label")
	min_label.htmlFor = "min_input"
	surface_div.appendChild(min_label)
	const min_input = document.createElement("input")
	min_input.type = "number"
	min_input.id = "min_input"
	min_input.value = "0"
	min_input.addEventListener('change', function(this: HTMLInputElement) {
		load_geometries(geojson_form, props_titles_keys, props_titles, form_bazarlist, layer_collections, layers_to_show)
	}, false)
	surface_div.appendChild(min_input)

	const max_label = document.createElement("label")
	max_label.htmlFor = "max_input"
	surface_div.appendChild(max_label)
	const max_input = document.createElement("input")
	max_input.id = "max_input"
	max_input.type = "number"
	max_input.value = "500"
	max_input.addEventListener('change', function(this: HTMLInputElement) {
		load_geometries(geojson_form, props_titles_keys, props_titles, form_bazarlist, layer_collections, layers_to_show)
	}, false)
	surface_div.appendChild(max_input)

	filters_divs.appendChild(surface_div)

	console.log("=============================================== Geometry")

	load_geometries(geojson_form, props_titles_keys, props_titles, form_bazarlist, layer_collections, layers_to_show)

	// console.log(overlayMaps)
	console.log("layer_collections:", layer_collections)

	const baseMaps = {
		"OpenStreetMap": osm
	};
	let overlayMaps = {
		"Parcellaires": layers_to_show
	};

	L.control.layers(baseMaps, overlayMaps).addTo(lmap);
}

load_map();
