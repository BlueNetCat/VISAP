// Requires palette.json, Highcharts library

let dataFromServer = undefined;

class SizeChart {
	constructor(){
    // Pop-up
    // Create HTML pop-up (ideally with a close button etc...)
    this.popupEl = document.createElement('div');
    this.popupEl.classList.add('ol-popup');
    this.popupEl.innerHTML = '<h5>Freqüència de talles</h5>'+
                              '<a id="popup-closer" class="ol-popup-closer"></a>'+
                              '<div id="popup-content" style="display: inline-flex"></div>';
    this.popupEl.style.left = "33%";
		this.popupEl.style.top = "33%";
		this.popupEl.style.position = "absolute";

    // Close button
    this.popupEl.children[1].onclick = (e) => e.target.parentElement.remove();//hidden = true;
		this.popupEl.onclick = (e) => this.popupEl.remove();//hidden = true;
    /*<div id="popup" class="ol-popup">
      <a href="#" id="popup-closer" class="ol-popup-closer"></a>
      <div id="popup-content" style="display: inline-flex"></div>
    </div>*/



    // Load information
    if (window.serverConnection)
      this.getSizes('http://localhost:8080/sizes', 'data/sizes.json', this.storeData);
    else
      this.getSizes('data/sizes.json', undefined, this.storeData);
	}

  // Store server data
  storeData(inData){
    dataFromServer = inData;
  }

  // Processes the data and creates the chart
  createGraphInterface(speciesName, portOrSeason, zoneOrYear, event){ // e.g. "Merluccius merluccius", "Blanes", "Nord"


    let filteredData = dataFromServer;
    // Filter if port or year-season are specified
    // For ports (yearOrZone is numeric for seasonal pie chart)
    if (zoneOrYear === undefined){
      this.popupEl.children[0].innerText = "Freqüència de talles (Total del projecte)";
    } else if (isNaN(parseInt(zoneOrYear))){
      filteredData = dataFromServer.filter((item) => item.ZonaPort == zoneOrYear);
      // Change popup title
      this.popupEl.children[0].innerText = "Freqüència de talles (Zona " + zoneOrYear +")";
    } // For year-season
    else {
      filteredData = dataFromServer.filter((item) => item.Any == parseInt(zoneOrYear));
      filteredData = filteredData.filter((item) => item.Estacio == portOrSeason);
      // Change popup title
      this.popupEl.children[0].innerText = "Freqüència de talles (" + portOrSeason +", "+ zoneOrYear +")";
    }

    // If there is no data...
    if (filteredData.length == 0){
      console.log("This species was never measured: "+ speciesName);
      return;
    }

    // Get data for a specific species for first chart
    let dataSpeciesForGraph = this.getDataForSpecieX(filteredData, speciesName);
		// If this species was never measured
		if (dataSpeciesForGraph === undefined)
			return;

		// Show popup
    // Append to DOM
    document.body.appendChild(this.popupEl);
    // Position the overlay
		this.popupEl.style.position = "fixed";
    this.popupEl.style.bottom = "auto";

    // Create Highchart
    let myChart = this.createChart(dataSpeciesForGraph, this.popupEl.children[2]);
  }


  // Remove graph interface
  removeGraph(){
    this.popupEl.remove();
  }


	// Create the pie chart
  // Create Highchart
  createChart(serieSpecies, htmlEl){

    const hChart = Highcharts.chart(htmlEl, {
      chart: {
          type: 'area'
      },
      accessibility: {
          description: 'Image description: blabla'
      },
      title: {
          text:'' //'Freqüència de talles '
      },
      subtitle: {
          text: ''//'per espècie'
      },
      legend: {
          align: 'left',
          verticalAlign: 'top'
          //x: 0,
          //y: 100
      },
      credits: {
          enabled: false
      },
      xAxis: {
          type: 'number'
          //categories: inCategories,
          //tickmarkPlacement: 'on',
          //title: {
          //    enabled: false
          //}
      },
      xAxis: {
          allowDecimals: false,
          labels: {
              formatter: function () {
                  return this.value/10 + ' cm'; // clean, unformatted number for year
              }
          },
          /*accessibility: {
              rangeDescription: 'Range: 1cm to 10cm'//'Range: 1940 to 2017.'
          }*/
      },
      yAxis: {
          title: {
              text: 'Abundància (Número d\'individus per km2)'//'Nuclear weapon states'
          },
          labels: {
              formatter: function () {
                  return this.value;//this.value / 1000 + 'k';
              }
          }
      },
      tooltip: {
          //pointFormat: 'Hi ha {point.y} que fan {point.x} cm de l\'espècie {series.name}'//'{series.name} had stockpiled <b>{point.y:,.0f}</b><br/>warheads in {point.x}'
          formatter: function() {
            return 'Abundància: ' + parseInt(this.y) + ' individus de ' + this.x/10 + " cm per km2."//  + 'individus de ' + this.x + ' cm d\'un total de '  + ' ' + series.name;
          }
      },
      loading: {
        hideDuration: 500,
        showDuration: 500
      },
      series: [
         serieSpecies
        ],
      plotOptions: {
          area: {
              pointStart: 1,//1940,
              marker: {
                  enabled: false,
                  symbol: 'circle',
                  radius: 2,
                  states: {
                      hover: {
                          enabled: true
                      }
                  }
              }
          }
      }
    });

    return hChart;
  }

  // Prepares the data for the highchart
  getDataForSpecieX(inData, inSpecies){
    // Select the data from a species
    let dataSelSpecies = inData.filter((item) => item.NomEspecie == inSpecies);
		// If it was never measured
		if (dataSelSpecies.length == 0){
			console.log("This species was never measured: ", inSpecies);
			return undefined;
		}

    // Categories (sizes)
    let categories = this.getUnique(dataSelSpecies, "Talla"); // Important to create X axis
    categories.forEach((cat, index) => categories[index] = parseFloat(cat)); // Transform into numbers
    categories.sort((a, b) => a - b); // Sort
    // Abundance per size
    let abundance = this.getAbundancePerCategories(dataSelSpecies, categories);
    //let numInd = getNumIndPerCategories(dataSelSpecies, categories); // How to include number of individuals?
    // Prepare for highcharts
    let dataHC = [];
    //categories.forEach((catItem, index) => dataHC[index] = [catItem, abundance[index]]); // Make an array as [categoryA,abundanceInA], [categoryB,abundanceInB],...
    categories.forEach((catItem, index) => dataHC[index] = [catItem, abundance[index]]); // Make an array as [categoryA,abundanceInA], [categoryB,abundanceInB],...
    // https://www.highcharts.com/demo/spline-irregular-time

    // Add common name if exists
    let seriesName = dataSelSpecies[0].NomComu === null ? inSpecies : (inSpecies + " ("+ dataSelSpecies[0].NomComu +")");
    let seriesColor = palette[inSpecies] === undefined ? "rgb(" + palette.Altres.color + ")" : "rgb(" + palette[inSpecies].color + ")";
    let graphSpecies = {name: seriesName, data: dataHC, color: seriesColor };
    return graphSpecies;
  }



  // Get abundance given the categories
  getAbundancePerCategories(inData, categories){
    let numInd = [];
    inData.forEach(item => {
      // Find the category index
      let catIndex = categories.findIndex((catItem) => catItem == item.Talla);
      numInd[catIndex] = numInd[catIndex] === undefined ? parseFloat(item.Abundancia_NIndividus_Km2) : numInd[catIndex] + parseFloat(item.Abundancia_NIndividus_Km2);
    })
    return numInd;
  }


  // Get sizes (freqüència talles)
  // var results = fetch("http://localhost:8080/sizes").then(r => r.json()).then(r => results = r).catch(e => console.log(e))
  getSizes(address, staticUrl, callbackPrepareData){
    // Get data
    fetch(address)
      .then(r => r.json())
      .then(r => {
        let outData = callbackPrepareData(r); // returns prepared data for d3
      })
      .catch(e => {
        if (staticUrl !== undefined){ // Load static file
          console.error("Could not fetch from " + address + ". Error: " + e + ". Trying with static file.");
          window.serverConnection = false;
          getSizes(staticUrl, undefined, callbackPrepareData);
        } else {
          console.error("Could not fetch from " + address + ". Error: " + e + ".");
        }
      });
  }


  // Get unique keys
  getUnique(inData, inKey){
    let uniqueKeys = [];
    // Iterate
    for (let i = 0; i < inData.length; i++){
      let value = inData[i][inKey];
      if (value !== undefined && uniqueKeys.findIndex((item) => item == value) == -1)
        uniqueKeys.push(value);
    }
    return uniqueKeys;
  }


}

export {SizeChart}
