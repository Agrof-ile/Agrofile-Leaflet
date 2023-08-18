import * as L from "leaflet"; // Mapping tool
import "leaflet/dist/leaflet.css"; // Leaflet's CSS
import "./leaflet-icon-correction.css"; // Seems like a bug : Leaflet can't load local icons located in leaflet/dist/images, so we download them from the web instead
import shp from "shpjs"; // Read SHP as GeoJSON for Leaflet
import axios from "axios"; // Requests
import geojsonArea from "@mapbox/geojson-area"

// Retrieve the options ids of the list used for our multiple choice field
let find_prop_options_i = function(columns: any[], prop_id: string): any {
	// console.log("columns", columns)
	// console.log("prop_id", prop_id)
	const keys: any[] = Object.keys(columns)
	for (let i = 0; i < keys.length; i++) {
		if (columns[keys[i]]["id"] === prop_id) {
			// console.log("found")
			return keys[i]
		}
	}
	return undefined
}

// Returns true if the property's id begins with strings indicating the property is a list
let is_prop_list = function(prop_id: string): boolean {
	return prop_id.substring(0, 5) === "radio" || prop_id.substring(0, 8) === "checkbox" || prop_id.substring(0, 5) === "liste" ? true : false
}

// Core filtering function (except for the area)
let checkboxes_toogle_layers = function(props_titles_keys: string[], layers_to_show: L.LayerGroup<any>, layer_collections: any): void {
	// When filtering we have to rebuild the displayed layer group from scratch, thus we clear all displayed layers
	// At this point, layer_collections has been filled in set_popup_content()
	layers_to_show.clearLayers()
	let layers_to_hide = L.layerGroup()
	props_titles_keys.forEach((prop_id: string) => {
		// console.log("prop_id", prop_id)
		// We analyse each (multiple choice) property value
		if (is_prop_list(prop_id)) {
			let all_prop_filled_layers = L.layerGroup()
			let ok_layers = L.layerGroup()
			Object.keys(layer_collections[prop_id]).forEach((prop_option_id: string) => {
				// console.log("prop_option_id", prop_option_id)

				const input = document.getElementById("option_input-" + prop_id + "-" + prop_option_id) as HTMLInputElement
				// console.log("input", input)

				const options_layers = layer_collections[prop_id][prop_option_id]
				options_layers.eachLayer((layer: L.Layer) => {
					// console.log("layer", layer)
					all_prop_filled_layers.addLayer(layer)
					// We determine if the layer satisfies at least one of the options; if true, we add it to ok_layers
					if (input.checked === true) {
						// console.log("found!!")
						ok_layers.addLayer(layer)
					}
				})
			})
			// console.log("all_prop_filled_layers", all_prop_filled_layers)
			// console.log("ok_layers", ok_layers)

			all_prop_filled_layers.eachLayer((layer: L.Layer) => {
				layers_to_show.addLayer(layer)
				// If the layer did not satisfy at least one of the property's options, it should not be displayed (except if no answer for this field)
				if (ok_layers.hasLayer(layer) === false) {
					layers_to_hide.addLayer(layer)
				}
			})
			// console.log("layers_to_hide", layers_to_hide)

			// Note that if the layer has no answer for a field/property, this layer is not present in any of the layer_collections[prop_id] collections
			// i.e. not in layer_collections[prop_id][option1], nor in layer_collections[prop_id][option2], etc.
			// so the layer will not not be added to all_prop_filled_layers, thus it can't be added to layers_to_hide.
			// Of course this layer can be added to layers_to_hide because of its value for other properties).
			// Technically, if no field is answered, the layer will not be displayed because it will never be added to layers_to_show
			// thus your form should at least contain one mandatory multiple choice question.
		}
	})
	// Finally we kick off every layer having not satisfied a property's filter
	layers_to_hide.eachLayer((layer: L.Layer) => {
		layers_to_show.removeLayer(layer)
	})
}

// Cut the string containing commas "," : the input string "mars,avril,mai" outputs ["mars", "avril", "mai"]
let parse_prop_option_id = function(complex_prop_option_id: string): string[] {
	// console.log("complex_prop_option_id", complex_prop_option_id)
	let cut_prop_option_id: string[] = []
	let prop_option_id: string = ""
	let i = 0
	while (i < complex_prop_option_id.length) {
		if (complex_prop_option_id[i] === ",") {
			if (prop_option_id.length > 0) {
				cut_prop_option_id.push(prop_option_id)
			}
			prop_option_id = ""
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

// Sets a feature's popup content and add the layer to layers_collections[prop_id][prop_option_id] when prop_id is a multiple choice property (useful for further filtering)
let set_popup_content_layer_collections = function(feature: any, geojson_layer: L.Layer, props_titles_keys: string[], props_titles: any, props_ids: any, form_bazarlist: any, layer_collections: any) {
	let popup_text = ""
	const card_prop_id = props_ids["card_name"]
	popup_text += `<h1>${feature["properties"][card_prop_id]}</h1>`
	props_titles_keys.forEach((prop_id: string) => {
		// console.log("=== prop_id", prop_id)
		popup_text += `<p style="margin-top:0.5em; margin-bottom:0.5em"><b>${props_titles[prop_id]}</b><br>`

		const prop_option_id = feature["properties"][prop_id]
		console.log("Salut")
		if (prop_id === "url") {
			popup_text += `<a href=${prop_option_id}>${prop_option_id}</a>`
		}
		else if (prop_id === "fichierfiche_projet" || prop_id === "imagebf_image1") {
			popup_text += "Voir sur la fiche (lien ci-dessous)"
		}
		else if (prop_id === "url") {
			popup_text += `<a href=${prop_option_id}>${prop_option_id}</a>`
		} else {
			if (prop_option_id === "") {
				popup_text += "Champ non renseigné"
				// console.log("Champ non renseigné")
			} else {
				if (is_prop_list(prop_id)) {
					// Complex_prop_option_id may contain multiple prop_option_id separated by commas "," e.g. "mars,avril,mai"
					// So we use this function to cut the string in an array in order to deal with each prop_option_id e.g ["mars", "avril", "mai"]
					const cut_prop_option_id = parse_prop_option_id(prop_option_id)
					// console.log("cut_prop_option_id", cut_prop_option_id)
					cut_prop_option_id.forEach((prop_option_id: string) => {
						const prop_options_i = find_prop_options_i(form_bazarlist, prop_id) // Retrieve the options ids of the list used for our multiple choice field
						// console.log("column_key", column_key)
						popup_text += form_bazarlist[prop_options_i]["options"][prop_option_id] + " / "
						// console.log("layer_collections", layer_collections)
						// console.log("prop_id", prop_id)
						// console.log("layer_collections[prop_id]", layer_collections[prop_id])
						// console.log("prop_option_id", prop_option_id)
						// Add the layer to layers_collections[prop_id][prop_option_id] when prop_id is a multiple choice property (useful for further filtering)
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

// Get the area of the features
let get_geojson_area = function(polygon_geojson: any): number {
	let area = 0
	polygon_geojson.features.forEach((geom_feature: any) => {
		area += geojsonArea.geometry(geom_feature["geometry"])
		console.log("geom_area", geojsonArea.geometry(geom_feature["geometry"]))
	})
	return area
}

// Get the mean position of features' geometries' points
let get_mean_coords = function(polygon_geojson_features: any): Array<number> {
	let mean_coords = [0, 0]
	let point_count = 0
	polygon_geojson_features.forEach((feature: any) => {
		feature["geometry"]["coordinates"].forEach((polygon_coordinates: Array<Array<number>>) => {
			polygon_coordinates.forEach((polygon_point_coordinates: Array<number>) => {
				mean_coords[0] += polygon_point_coordinates[0]
				mean_coords[1] += polygon_point_coordinates[1]
				point_count++
			})
		})
	});
	mean_coords[0] /= point_count
	mean_coords[1] /= point_count
	console.log(mean_coords)
	return mean_coords
}

// Load our geometry and data on Leaflet layers
let load_geometries = async function(geojson_form: any, props_titles_keys: string[], props_titles: any, props_ids: any, form_bazarlist: any, layer_collections: any, layers_to_show: L.LayerGroup<any>, ) {
	// When filtering we have to rebuild the displayed layer group from scratch, thus we clear all displayed layers
	layers_to_show.clearLayers()
	await Object.keys(geojson_form).forEach(async (form_card_key: any) => {
		const form_card = geojson_form[form_card_key]
		// First, we load the geometry data (SHP file as ZIP)
		// Its location is in the form answer's properties
		const shp_file_prop_id = props_ids["shp_file"]
		const zipshp_filename = form_card["fichier" + shp_file_prop_id]
		const origin_path = window.location.origin
		const path_to_shp = `${origin_path}/files/${zipshp_filename}`
		console.log("path_to_shp_zipendno", path_to_shp)
		// By default, YesWiki's uploaded files contain an underscore "_" at the end, making the .zip files unreadable by jszip (used by shpjs).
		// Earlier we called a route executing a bash script that removes the underscore at the end of the file name of every file ending by ".zip_ in the files/ folder".
		// But the file name in our form entry's SHP file property value still contains the underscore, so we cut it.
		const path_to_shp_zipendok = path_to_shp.substring(0, path_to_shp.length-1)
		console.log("path_to_shp_zipendok", path_to_shp_zipendok)
		// Read our SHP ZIP file as GeoJSON (Leaflet can only read GeoJSON)
		const polygon_geojson = await shp(path_to_shp_zipendok) as GeoJSON.FeatureCollection
		console.log("raw_polygon_geojson", polygon_geojson)

		// The geometry data that was in the SHP does not contain yet the form data that is only in the form's answers JSON so far.
		// So let's merge the form data in our geometry GeoJSON, so that it will be filterable by Leaflet.
		let area = get_geojson_area(polygon_geojson) / 10000 // Convert square meters to hectares
		area = Math.round((area + Number.EPSILON) * 100) / 100 // Round to 2 decimals
		polygon_geojson.features.forEach((geom_feature: any) => {
			geom_feature["properties"] = form_card
			geom_feature["properties"][props_ids["area"]] = area
		})
		console.log("props_filled_polygon_geojson", polygon_geojson)

		let area_range_min = Number((document.getElementById("min_input") as HTMLInputElement).value);
		let area_range_max = Number((document.getElementById("max_input") as HTMLInputElement).value);
		const area_prop_id = props_ids["area"]
		const type_of_land_list_id = props_ids["type_of_land"]["list_id"]
		const type_of_land_prop_id = props_ids["type_of_land"]["prop_id"]
		const type_of_land_options_ids = props_ids["type_of_land"]["options_ids"]

		// The Leaflet GeoJSON layer is the object we will display on the map
		const geojson_layer = new L.GeoJSON(polygon_geojson, {
			// Each of these options will be called for each feature contained in our geometry
			style: // The layer's appearance
				function (geoJsonFeature: any) {
					return {
						"fillColor": type_of_land_options_ids[geoJsonFeature["properties"]["radio" + type_of_land_list_id + type_of_land_prop_id]],
						"color": "#000",
						"weight": 1,
						"opacity": 1,
						"fillOpacity": 0.8
					}
				},
			onEachFeature: // Leaflet lets us call a function for each feature, let's use it to set the popup content'
				function(feature: any, layer: L.Layer) {
					// Set what will be displayed when the user clicks on the geometry on the map
					// and add the layer to layers_collections[prop_id][prop_option_id] when prop_id is a multiple choice property (useful for further filtering)
					set_popup_content_layer_collections(feature, layer, props_titles_keys, props_titles, props_ids, form_bazarlist, layer_collections)
				},
			filter: // Select which feature will be displayed based on their properties
				function(feature: any) {
					// Here we filter the layers according to their area
					return (feature.properties[area_prop_id] <= area_range_max) && (feature.properties[area_prop_id] >= area_range_min);
				}
		})

		layers_to_show.addLayer(geojson_layer)

		// The following code displays a constant-size marker on the geometry (useful to find a geometry from a small zoom)
		const point_geojson = {
			"type": "Feature",
			"geometry": {
				"type": "Point",
				// Set the marker's position to the mean position of the features' geometries' points
				"coordinates": get_mean_coords(polygon_geojson.features)
			},
			"properties": form_card
		} as any

		const point_geojson_layer = new L.GeoJSON(point_geojson, {
			onEachFeature:
				function(feature: any, layer: L.Layer) {
					// The marker's popup has the same content than the geometry
					// Set what will be displayed when the user clicks on the geometry on the map
					// and add the layer to layers_collections[prop_id][prop_option_id] when prop_id is a multiple choice property (useful for further filtering)
					set_popup_content_layer_collections(feature, layer, props_titles_keys, props_titles, props_ids, form_bazarlist, layer_collections)
				},
			filter:
				function(feature: any) {
					return (feature.properties[area_prop_id] <= area_range_max) && (feature.properties[area_prop_id] >= area_range_min);
				},
			pointToLayer: // Equivalent to the geometry's style option
				function (feature: any, latlng: L.LatLng) {
					const geojsonMarkerOptions = {
						radius: 15,
						fillColor: type_of_land_options_ids[feature["properties"]["radio" + type_of_land_list_id + type_of_land_prop_id]],
						color: "#000",
						weight: 1,
						opacity: 1,
						fillOpacity: 0.8
					};
					return L.circleMarker(latlng, geojsonMarkerOptions); // The marker is a circle
				}
		})

		layers_to_show.addLayer(point_geojson_layer)

		// console.log("------------------ layer_collections:", layer_collections)
	});
}

// Main function
let load_map = async function(): Promise<void> {
	// Leaflet map object
	let lmap = L.map('map', {
		center: [48.73562156552866, 2.52116218332756],
		zoom: 9
	});

	// Add an OpenStreetMap base layer
	const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	});
	osm.addTo(lmap);

	const form_id_json = (await axios.get(`/?api/carto/map_form_id`)).data // Get the id of the form what want to display on the map
	console.log("form_id_json:", form_id_json)
	const map_form_id = form_id_json["map_form_id"]
	console.log("map_form_id:", map_form_id)

	const props_titles = (await axios.get(`/?api/carto/props_titles`)).data // Get the text introducing fields/properties values on popups on the map
	console.log("props_titles:", props_titles)

	const props_ids = (await axios.get(`/?api/carto/props_ids`)).data // Get the ids of the special fields/properties for the map, and geometries' colors
	console.log("props_ids:", props_ids)

	const bazarliste_values_map = (await axios.get(`/?api/entries/bazarlist`)).data // Get the ids of the list options for each multiple choice field
	console.log("bazarliste_values_map:", bazarliste_values_map)
	const form_bazarlist = bazarliste_values_map["forms"][map_form_id]

	const geojson_form = (await axios.get(`/?api/forms/${map_form_id}/entries/json`)).data // Get the form responses as GeoJSON
	console.log("geojson_form:", geojson_form)

	// By default, YesWiki's uploaded files contain an underscore "_" at the end, making the .zip files unreadable by jszip (used by shpjs)
	// This route points to a bash script that removes the underscore at the end of the file name of every file ending by ".zip_ in the files/ folder"
	await axios.get(`/?api/carto/ruzip`)

	const props_titles_keys = Object.keys(props_titles)
	
	// This layer group will be the only one to be displayed, so we add or remove layers from it to display or not certain agricultural parcels (using the filters)
	let layers_to_show = L.layerGroup()
	// Two-levels collection : (multiple choice only) properties (= form fields), then properties' options ids, then a list of associated layers.
	// For now it will be filled empty but in set_popup_content we will add every layer to every collection item.
	// Then, we will remove some layers when the user will be filtering by clicking on checkboxes.
	let layer_collections: any = {}

	// Then we create the HTML and listeners for the property value's filters
	const filters_divs = document.getElementById("filters") as HTMLDivElement;

	props_titles_keys.forEach((prop_id: string) => {
		// console.log("prop_id", prop_id)
		// Fields beginning by these strings are multiple choice fields, so we want them to be filterable
		if (is_prop_list(prop_id)) {
			const filter_div = document.createElement("div")
			filter_div.id = "filter_div-" + prop_id

			const prop_button = document.createElement("button") // Display and hide button
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

			const prop_options_i = find_prop_options_i(form_bazarlist, prop_id) // Retrieve the options ids of the list used for our multiple choice field
			// console.log("prop_options_i", prop_options_i)
			const prop_options = form_bazarlist[prop_options_i]["options"]
			// console.log("prop_options", prop_options)

			let prop_layer_collection: any = {}

			Object.keys(prop_options).forEach((prop_option_id: string) => {
				const option_input = document.createElement("input") // This button refreshes map's layers after filtering
				option_input.type = "checkbox"
				option_input.id = "option_input-" + prop_id + "-" + prop_option_id
				option_input.checked = true
					option_input.addEventListener('change', function(this: HTMLInputElement) {
						checkboxes_toogle_layers(props_titles_keys, layers_to_show, layer_collections) // Core filtering function (except for the area)
					}, false);
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

	// Area filter
	const area_div = document.createElement("div")

	const area_br_1 = document.createElement("br")
	area_div.appendChild(area_br_1)

	const area_span = document.createElement("span")
	area_span.innerHTML = "Surface du parcellaire (ha)"
	area_div.appendChild(area_span)

	const area_br_2 = document.createElement("br")
	area_div.appendChild(area_br_2)

	const min_label = document.createElement("label")
	min_label.htmlFor = "min_input"
	area_div.appendChild(min_label)
	const min_input = document.createElement("input")
	min_input.type = "number"
	min_input.id = "min_input"
	min_input.value = "0"
	min_input.addEventListener('change', function(this: HTMLInputElement) {
		// Reload our geometry and data on Leaflet layers on each time the field is changed
		load_geometries(geojson_form, props_titles_keys, props_titles, props_ids, form_bazarlist, layer_collections, layers_to_show)
	}, false)
	area_div.appendChild(min_input)

	const max_label = document.createElement("label")
	max_label.htmlFor = "max_input"
	area_div.appendChild(max_label)
	const max_input = document.createElement("input")
	max_input.id = "max_input"
	max_input.type = "number"
	max_input.value = "500"
	max_input.addEventListener('change', function(this: HTMLInputElement) {
		// Reload our geometry and data on Leaflet layers on each time the field is changed
		load_geometries(geojson_form, props_titles_keys, props_titles, props_ids, form_bazarlist, layer_collections, layers_to_show)
	}, false)
	area_div.appendChild(max_input)

	filters_divs.appendChild(area_div)

	console.log("=============================================== Geometry")

	// Load our geometry and data on Leaflet layers
	load_geometries(geojson_form, props_titles_keys, props_titles, props_ids, form_bazarlist, layer_collections, layers_to_show)

	// Display our group of layers on the map
	layers_to_show.addTo(lmap)

	console.log("layer_collections:", layer_collections)

	const baseMaps = {
		"OpenStreetMap": osm
	};
	let overlayMaps = {
		"Parcellaires": layers_to_show
	};
	// console.log(overlayMaps)

	// Allow the user to switch base map (useless because we have only set an OpenStreetMap base map) and enable/disable our geometries' displaying
	L.control.layers(baseMaps, overlayMaps).addTo(lmap);
}

load_map();
