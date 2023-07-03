import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
// import "./shp.js";
// import "./catiline.js";
// import "./leaflet.shpfile.js";
import shp from "shpjs";
// import { shp } from './shp.js';
// import shapefileToGeojson from "shapefile-to-geojson";
// import * as fs from "fs";
// import 'path';
// import { GeoJsonObject } from "geojson";
import axios from "axios";

let lmap = L.map('map', {
	center: [7.2, 40.9],
	zoom: 2
});

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(lmap);

// const geoJSON = shapefileToGeojson.parseFiles("../data/departement/departement.shp", "../data/departement/departement.dbf");
// console.log(geoJSON)

// var shapeLayer = new Shapefile("data/departement.zip");
// shapeLayer.addTo(lmap);
// shapefileToGeojson.parseFolder("data/departement.zip")
// .then(function (geojson){console.log(geojson)});

// SHP.readFile('path', function(error, data){ console.log(JSON.stringify(data)); })

function readGeojson(filename: string) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", filename, false);
	xmlhttp.overrideMimeType("application/json");
	xmlhttp.send();
	console.log(xmlhttp.responseText)
	return JSON.parse(xmlhttp.responseText);
}


// var xmlhttp = new XMLHttpRequest();
// xmlhttp.open("GET", "data/departement.zip", false);
// xmlhttp.overrideMimeType("application/json");
// xmlhttp.send();
// console.log(xmlhttp.responseText)

// console.log(readGeojson("../test.json"));
var geojsonLayer = new L.GeoJSON(readGeojson("data/regions.geojson"));
geojsonLayer.addTo(lmap);

let satelliteLayer = L.imageOverlay('data/landsat.png', [[44.70723, -0.784355], [44.968463, -0.3957438]]);
satelliteLayer.addTo(lmap);
console.log(satelliteLayer);

// http://jsfiddle.net/ashalota/fgqjkxb8/

// document.getElementById("submit")!.onclick = function(e){
// 	var files = (document.getElementById('file') as HTMLInputElement)!.files;
// 	if (files!.length == 0) {
// 		return; //do nothing if no file given yet
// 	}

// 	var file = files![0];

// 	if (file.name.slice(-3) != 'zip') { //Demo only tested for .zip. All others, return.
// 		document.getElementById('warning')!.innerHTML = 'Select .zip file';
// 		console.log("Dommage")
// 		return;
// 	} else {
// 		document.getElementById('warning')!.innerHTML = ''; //clear warning message.
// 		console.log("Youhou")
// 		handleZipFile(file);
// 	}
// };

//More info: https://developer.mozilla.org/en-US/docs/Web/API/FileReader
// function handleZipFile(file: File) {
// 	var reader = new FileReader();
// 	reader.onload = function() {
// 	//   if (reader.readyState != 2 || reader.error){
// 	// 	  return;
// 	//   } else {
// 		console.log("99", reader.result)
// 		convertToLayer(reader.result as ArrayBuffer);
// 	// }
// 	}
// 	reader.readAsArrayBuffer(file);
// 	console.log("Salut")
// }

// function convertToLayer(buffer: ArrayBuffer){
// 	console.log("Bien ?")
// 	shp(buffer).then(function(geojson: any){	//More info: https://github.com/calvinmetcalf/shapefile-js
// 		// console.log("Bien !", geojson)
// 		var layer = L.shapefile(geojson).addTo(lmap); //More info: https://github.com/calvinmetcalf/leaflet.shapefile
// 		layer.addTo(lmap);
// 		// console.log("Pourquoi ?", geojson)
// 		// // console.log(layer);
// 		// console.log("Bien !")
// 		// var geojsonLayer = new L.GeoJSON(geojson);
// 		// geojsonLayer.addTo(lmap);
// 	});
// }

// axios.get('/data/departement.zip')
//       .then(function (response) {
// 	console.log("salut", response);
// 	let blob = new Blob([response.data], {type: "binary/zip"})
// 	const urlObj = URL.createObjectURL(blob)
// 	//console.log('xDDDD')
// 	//console.log(urlObj)
// 	// shp(URL.createObjectURL(blob)).then(function(geojson){ // Wants an URL -_-
// 	shp(`${window.location.href}${'/data/departement.zip'}`).then(function(geojson){ // Wants an URL -_-
// 	//shp(urlObj).then(function(geojson){ // Wants an URL -_-
// 	    //see bellow for whats here this internally call shp.parseZip()
// 		console.log(geojson)
// 		var geojsonLayer = new GeoJSON(geojson);
// 		geojsonLayer.addTo(lmap);
// 		//var layer = shapefile(geojson).addTo(lmap); //More info: https://github.com/calvinmetcalf/leaflet.shapefile
// 	});
// })

let load_map = async function(): Promise<void> {
	let geojson = await shp(`${window.location.href}${'/data/departement.zip'}`) as GeoJSON.FeatureCollection
	console.log(geojson)
	// var layer = L.shapefile(geojson).addTo(lmap);//More info: https://github.com/calvinmetcalf/leaflet.shapefile
	var geojsonLayer = new L.GeoJSON(geojson);
	geojsonLayer.addTo(lmap);
}

load_map();