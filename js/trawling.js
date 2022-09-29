// Needs d3 library

// Import modules
import {PieHTMLSection} from './PieHTMLSection.js';


// Init function
export const startTrawling =  () => {

  // Create PieChart Section
  // Get title and pie divs
  let htmlTitleEl = document.getElementById("biomassPortHTMLTitleSection");
  let htmlPieSectionEl = document.getElementById("biomassPortHTMLPieSection");
  let title = "Captura en biomassa per port";
  const biomassPortSection = new PieHTMLSection(htmlTitleEl, htmlPieSectionEl, title);
  // Fetch data and create piechart
  if (window.serverConnection)
    biomassPortSection.createPieChart('http://localhost:8080/portBiomass', 'data/pesca_arrossegament_port_biomassa.json', prepDataPortBiomass, 'Pesca per ports', 'Biomassa', 'kg / km2'); // (address, staticFile, callbackPrepareData, title, measure, unit)
  else
    biomassPortSection.createPieChart('data/pesca_arrossegament_port_biomassa.json', undefined, prepDataPortBiomass, 'Pesca per ports', 'Biomassa', 'kg / km2'); // (address, staticFile, callbackPrepareData, title, measure, unit)

  // TODO: create prep data for year-season
  // Create PieChart Section
  // Get title and pie divs
  htmlTitleEl = document.getElementById("biomassYearHTMLTitleSection");
  htmlPieSectionEl = document.getElementById("biomassYearHTMLPieSection");
  title = "Captura en biomassa per estació";
  const biomassYearSection = new PieHTMLSection(htmlTitleEl, htmlPieSectionEl, title);
  // Fetch data and create piechart
  if (window.serverConnection)
    biomassYearSection.createPieChart('http://localhost:8080/seasonBiomass', 'data/pesca_arrossegament_any_biomassa.json', prepDataYearBiomass, 'Pesca per estació', 'Biomassa', 'kg / km2'); // (address, staticFile, callbackPrepareData, title, measure, unit)
  else
    biomassYearSection.createPieChart('data/pesca_arrossegament_any_biomassa.json', undefined, prepDataYearBiomass, 'Pesca per estació', 'Biomassa', 'kg / km2'); // (address, staticFile, callbackPrepareData, title, measure, unit)

}




// Prepare the data from the server-database
function prepDataPortBiomass(inData){

	const outData = {};
	outData.children = [];

	// Iterate over all rows
	for (let i = 0; i<inData.length; i++){
		let item = inData[i];
		let portArea = item.PortArea;
		let portName = item.PortName;
		let scientificName = item.ScientificName;
		let catalanName = item.CatalanName || item.ScientificName;
		let classification = item.Classification;
		let biomass = item.Biomass_Kg_Km2;

		if (biomass < 1) // Do not display items with little biomass
			continue;

		// Create ZonaPort level if it does not exist
		if (outData.children.find(child => child.name === portArea) === undefined)
			outData.children.push({"name": portArea, "children": [], "species": portArea});

		let portAreaIndex = outData.children.findIndex(child => child.name === portArea)
		// Create Port level if it does not exist
		let areaChilds = outData.children[portAreaIndex].children;
		if (areaChilds.find(child => child.name === portName) === undefined)
			outData.children[portAreaIndex].children.push({"name": portName, "children": [], "species": portName});

		let portIndex = outData.children[portAreaIndex].children.findIndex(child => child.name === portName)
		// Create category level (Landed, Discarded, Restes)
		let portChilds = outData.children[portAreaIndex].children[portIndex].children;
		if (portChilds.find(child => child.name === classification) === undefined)
			outData.children[portAreaIndex].children[portIndex].children.push({"name": classification, "children": [], "species": classification});

		let classIndex =  outData.children[portAreaIndex].children[portIndex].children.findIndex(child => child.name === classification)
		// If biomass is very small, put to others
		if ((biomass < 9 && classification == "Landed") || (biomass < 5 && classification == "Discarded")){
			let otherIndex =  outData.children[portAreaIndex].children[portIndex].children[classIndex].children.findIndex(child => child.name === "Other");
			// Define Other group
			if (otherIndex == -1) {
				outData.children[portAreaIndex].children[portIndex].children[classIndex].children.push({"name": "Other", "children": [], "species": "Other"});
				otherIndex = outData.children[portAreaIndex].children[portIndex].children[classIndex].children.length - 1;
			}
			// Assign to Other
			outData.children[portAreaIndex].children[portIndex].children[classIndex].children[otherIndex].children.push({"name": catalanName, "value": biomass, "species": scientificName});
		}
		// Biomass is bigger
		else {
			// Assign biomass value
			outData.children[portAreaIndex].children[portIndex].children[classIndex].children.push({"name": catalanName, "value": biomass, "species": scientificName});
		}
	}

	return outData;
}


// Prepare the data from the server-database
function prepDataYearBiomass(inData){

  const outData = {};
	outData.children = [];

  // Iterate over all rows
	for (let i = 0; i<inData.length; i++){
    	let item = inData[i];
    	let year = item.Year;
		let season = item.Season;
		let scientificName = item.ScientificName;
		let catalanName = item.CatalanName || item.ScientificName;
		let classification = item.Classification;
		let biomass = item.Biomass_Kg_Km2;

		if (biomass < 1) // Do not display items with little biomass
			continue;

    // Create Year level if it does not exist
		if (outData.children.find(child => child.name === year) === undefined)
			outData.children.push({"name": year, "children": [], "species": year});

		let yearIndex = outData.children.findIndex(child => child.name === year)
		// Create Estacio level if it does not exist
    let yearChilds = outData.children[yearIndex].children;
		if (yearChilds.find(child => child.name === season) === undefined)
			outData.children[yearIndex].children.push({"name": season, "children": [], "species": season});

		let seasonIndex = outData.children[yearIndex].children.findIndex(child => child.name === season)// TODO HERE NOW
		// Create category level (Landed, Discarded, Restes)
		let seasonChilds = outData.children[yearIndex].children[seasonIndex].children;
		if (seasonChilds.find(child => child.name === classification) === undefined)
			outData.children[yearIndex].children[seasonIndex].children.push({"name": classification, "children": [], "species": classification});

		let classIndex =  outData.children[yearIndex].children[seasonIndex].children.findIndex(child => child.name === classification)
		// If biomass is very small, put to others
		if ((biomass < 7 && classification == "Landed") || (biomass < 4 && classification == "Discarded")){
			let otherIndex =  outData.children[yearIndex].children[seasonIndex].children[classIndex].children.findIndex(child => child.name === "Other");
			// Define Other group
			if (otherIndex == -1) {
				outData.children[yearIndex].children[seasonIndex].children[classIndex].children.push({"name": "Other", "children": [], "species": "Other"});
				otherIndex = outData.children[yearIndex].children[seasonIndex].children[classIndex].children.length - 1;
			}
			// Assign to Other
			outData.children[yearIndex].children[seasonIndex].children[classIndex].children[otherIndex].children.push({"name": catalanName, "value": biomass, "species": scientificName});
		}
		// Biomass is bigger
		else {
			// Assign biomass value
			outData.children[yearIndex].children[seasonIndex].children[classIndex].children.push({"name": catalanName, "value": biomass, "species": scientificName});
		}
  }


  // Because there is port area, several repeated species appear
  // Iterate to remove duplicated entries. The values are averaged
  /*outData.children.forEach(
    (anyItem) => anyItem.children.forEach(
      (estacioItem) => estacioItem.children.forEach(
        (classItem) => {
          averageChildren(classItem);
        }
      )
    )
  );*/

  return outData;
}

/*
function averageChildren(classItem){
  let tempChildren = []; // New array with children
  let tempValues = []; // Values to average
  for (let i = 0; i<classItem.children.length; i++){
    // If Altres?
    if (classItem.children[i] === undefined)
      continue;
    if( classItem.children[i].name == "Altres"){
      //averageChildren(classItem.children[i]);
      continue;
    }
    tempValues = [];
    let tempName = classItem.children[i].name;
    tempChildren.push(classItem.children[i]); // Move item to temp
    delete classItem.children[i]; // Remove from array

    //Check if there is another item with the same name
    let indexRepetition = classItem.children.findIndex((item) => item !== undefined ? item.name == tempName : false);
    // Iterate until all repeated elements are removed
    tempValues.push(parseFloat(tempChildren[tempChildren.length -1].value));
    while (indexRepetition != -1){
      tempValues.push(parseFloat(classItem.children[indexRepetition].value)); // Store value to average
      delete classItem.children[indexRepetition];// Remove from array
      indexRepetition = classItem.children.findIndex((item) => item !== undefined ? item.name == tempName : false);
    }
    let avgBiomass = tempValues.reduce((a,b) => a + b) / tempValues.length;
    tempChildren[tempChildren.length -1].value = avgBiomass;
  }
  classItem.children = tempChildren;
}
*/

export default startTrawling;
