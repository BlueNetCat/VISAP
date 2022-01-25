/*globals feather*/

import {PieChart} from './PieChart.js';
import {FilterSpecies} from './FilterSpecies.js';

// Manages the title, buttons to export and to filter of the section where the pie chart is
class PieHTMLSection {

	constructor(htmlTitleEl, htmlPieSectionEl, title){

		// HTML containers
		this.htmlTitleEl = htmlTitleEl;
		this.htmlPieSectionEl = htmlPieSectionEl;
		// Set the HTML Title
    this.htmlTitleEl.getElementsByTagName("h2")[0].innerText = title;

    // Find HTML buttons for filter and export
    this.filterSpeciesBtnEl = htmlTitleEl.querySelector("#filterSpeciesBtn");
		this.filterIsOnBtnEl = htmlTitleEl.querySelector("#filterIsOnBtn");
		this.exportCSVBtnEl = htmlTitleEl.querySelector("#exportCSVBtn");
		this.exportJSONBtn = htmlTitleEl.querySelector("#exportJSONBtn");

    // Add event listeners to filter and export buttons
		this.filterIsOnBtnEl.addEventListener("click", (e) => this.deactivateFilter(e));
		this.filterSpeciesBtnEl.addEventListener("click", (e) => this.filterSpeciesGUI(e));
		this.exportCSVBtnEl.addEventListener("click", (e)=> this.exportCSV(e));
		this.exportJSONBtn.addEventListener("click", (e)=> this.exportJSON(e));

		// Find HTML button for overlay and compare
		this.compareBtnEl = htmlPieSectionEl.querySelector('#compareBtn');
		this.closeCompareBtnEl = htmlPieSectionEl.querySelector('#closeCompareBtn');
		this.overlayEl = htmlPieSectionEl.querySelector('#overlayDiv');
		// Add event listeners for compare and overlay HTML
		this.compareBtnEl.addEventListener("click", (e) => this.comparePie(e));
		this.closeCompareBtnEl.addEventListener("click", (e) => this.closeCompare(e));
		this.overlayEl.addEventListener("click", (e) => this.closeFilterGUI(e));

		// Pie chart HTML container
		this.pieChartEl = htmlPieSectionEl.querySelector('#pieChart');

    // Create variables, defined when createPieChart is called
    this.staticFilename;
    this.pieChart;
    this.dataFromServer;

		// Filter Species List
		this.filter = new FilterSpecies();
	}



  // Load and create pie chart
  createPieChart(address, staticFile, callbackPrepareData, title, measure, unit){
    console.log("Getting data: " + address +", "+ staticFile +", ");

		// Save title, measure and unit (TODO: change PieChart.js, so update can be used instead of runApp)
		this.pieTitle = title;
		this.pieMeasure = measure;
		this.pieUnit = unit;

    // Store static file name
    this.staticFilename = staticFile || this.staticFilename;
  	// Try data from server
  	fetch(address)
  		.then(r => r.json())
  		.then(r => {
        this.dataFromServer = r;
        let outData = callbackPrepareData(r); // returns prepared data for d3
        this.pieChart = new PieChart(outData);
        this.pieChart.runApp(this.pieChartEl, outData, d3, title, measure, unit);
			})
			.catch(e => {
  			if (staticFile !== undefined){ // Load static file
  				console.error("Could not fetch from " + address + ". Error: " + e + ". Trying with static file.");
					window.serverConnection = false;
  				this.createPieChart(staticFile, undefined, callbackPrepareData, title, measure, unit);
  			} else {
  				console.error("Could not fetch from " + address + ". Error: " + e + ".");
  			}
  		})
  }



	// Remove active filter
	deactivateFilter(event){
	  // Remove/Hide HTML overlay
	  this.overlayEl.style.visibility = "hidden";
	  event.currentTarget.style.visibility = "hidden";
	  // Deselect species
	  this.filter.deselectAll();
	  // Update graphs to original data
	  this.updateTrawlingChart(this.pieChart.originalData);
	}


	// Update the pie chart with filtered or unfiltered data
	updateTrawlingChart(inDataForD3){
	  // Restart pie charts (TODO: instead of runApp function, update and transition of values)
	  this.pieChartEl.innerHTML = "";
	  this.pieChart.runApp(this.pieChartEl, inDataForD3, d3, this.pieTitle, this.pieMeasure, this.pieUnit);
		// If pie chart comparison exists
	  if (this.pieChartCompareEl !== undefined){
	    this.pieChartCompareEl.innerHTML = "";
	    this.pieChart.runApp(this.pieChartCompareEl, inDataForD3, d3, this.pieTitle, this.pieMeasure, this.pieUnit);
	  }
	}




	// Filter Species button event
	filterSpeciesGUI(event){

	  if (this.pieChart === undefined) // Data is not loaded yet
	    return;
	  // Show GUI
	  if (this.filterIsOnBtnEl.GUIshow == false || this.filterIsOnBtnEl.GUIshow == undefined){ // If filter is not active (should be something related to class)
	    // Fetch HTML
	    console.log("Fetching html for filter");
	    let filename = event.target.getAttribute("w3-include-html") || "filter.html";
	    fetch("html/" + filename)
	      .then(response => response.text())
	      .then(text => {
	        // Add/Show HTML to container
	        this.overlayEl.innerHTML = text;
	        // Position the overlay on top of the section. Set style properties
	        let posHTML = this.overlayEl.parentElement.getClientRects()[0];
	        this.overlayEl.style.top = window.scrollY + posHTML.top + "px";
	        this.overlayEl.style.left = posHTML.left  + "px";
	        this.overlayEl.style.width = posHTML.width  + "px";
	        this.overlayEl.style.height = posHTML.height  + "px";
	        this.overlayEl.style.visibility = null;
	        // Start List buttons
	        this.filter.init(this.overlayEl, this);
	        // Reload missing icons from new HTML
	        feather.replace();
	      });

	    // Change button state
	    this.filterIsOnBtnEl.GUIshow = true;
	  }
	  // Hide GUI
	  else {

	    // Filter and update graphs
	    this.exitFilterGUI();
	  }
	}


	// Filter and update graphs
	exitFilterGUI(){
		console.log("Hiding Filter GUI");
		// Remove/Hide HTML
		this.overlayEl.style.visibility = "hidden";
		// Hide overlay
	  this.filterIsOnBtnEl.GUIshow = false;
	  // Get selected species
	  let selectedSpecies = this.filter.getSelected();
	  // If filter exists
	  if (selectedSpecies.length != 0){
	    // Show filter is on button
	    this.filterIsOnBtnEl.style.visibility = null;
	    // Preprocess data and re-start graph
	    this.createFilteredGraph(selectedSpecies);
	  } else {
	    // Hide filter is on button
	    this.filterIsOnBtnEl.style.visibility = "hidden";
	    // Restart graph with original data
	    this.updateTrawlingChart(this.pieChart.originalData);
	  }
	}

	// Close filter GUI and show filtered data
	closeFilterGUI(event){
	  event.stopPropagation();
	  // Exit filter GUI
	  this.exitFilterGUI();
	}

	// Filter data and update graphs
	createFilteredGraph(selectedSpecies){
	  // Filter the data
	  let filteredDataForD3 = this.filter.filterData(selectedSpecies, this.pieChart.originalData);
	  // Assign to pie chart
	  this.updateTrawlingChart(filteredDataForD3);
	}




  // Export data
  // https://www.codevoila.com/post/30/export-json-data-to-downloadable-file-using-javascript
  exportJSON(event){
    // Data not yet loaded
    if (this.dataFromServer === undefined)
      return;
    // Create
    let dataStr = JSON.stringify(this.dataFromServer);
    let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    let linkElement = event.target;//document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', this.staticFilename + 'json');
    // Now the "a" element has already the data, then remove the function
    linkElement.removeEventListener("onclick", exportJSON);
  }


  // Export data (CSV)
  exportCSV(event){
    // Data not yet loaded
    if (this.dataFromServer === undefined)
      return;
    // Parse JSON to CSV
    let jsonData = this.dataFromServer;
    let keys = Object.keys(jsonData[0]);

    let columnDelimiter = ',';
    let lineDelimiter = '\n';

    let csvColumnHeader = keys.join(columnDelimiter);
    let csvStr = csvColumnHeader + lineDelimiter;

    jsonData.forEach(item => {
        keys.forEach((key, index) => {
            if( (index > 0) && (index < keys.length) ) {
                csvStr += columnDelimiter;
            }
            csvStr += item[key];
        });
        csvStr += lineDelimiter;
    });

    // Now make downlodable element
    let dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvStr);
    let linkElement = event.target;//document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', this.staticFilename + '.csv');
    // Now the "a" element has already the data, then remove the function
    linkElement.removeEventListener("onclick", exportJSON); // ????
  }





	// HTML button events
	comparePie(event){
		// Data not yet loaded
    if (this.dataFromServer === undefined)
      return;
	  // Hide compare button
	  event.target.style.visibility="hidden";
	  // Show close compare button
	  this.closeCompareBtnEl.style.visibility = null;

	  // Create compare pie chart
	  this.pieChartCompareEl = this.pieChartEl.cloneNode(false);
	  this.pieChartCompareEl.id = "comparePie";
	  this.pieChartEl.insertAdjacentElement("afterend", this.pieChartCompareEl);
	  this.pieChart.runApp(this.pieChartCompareEl, this.pieChart.currentData, d3, this.pieTitle, this.pieMeasure, this.pieUnit);
	}

	// HTML button events
	closeCompare(event){
	  // Hide compare button
	  event.target.style.visibility="hidden";

	  // Show close compare button
	  this.compareBtnEl.style.visibility=null;
	  //cmp.className ="";// I don't understand why
	  // Remove pie chart
	  this.pieChartCompareEl.remove();
	}


}


export {PieHTMLSection}
