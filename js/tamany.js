// From https://www.highcharts.com/demo/area-basic
// https://www.highcharts.com/demo/spline-irregular-time

let myChart = undefined;
let dataFromServer = undefined;
let count = 0;


export const startTamany = () => {

  // Load information
  if (window.serverConnection)
    getSizes('http://localhost:8080/sizes', 'data/sizes.json', createGraphInterface);
  else
    getSizes('data/sizes.json', undefined, createGraphInterface);
}

// Processes the data and creates the chart
const createGraphInterface = (inData) => {

  // Remove loader and show interface
  document.getElementById('loader').remove();
  const interfaceEl = document.getElementById('tamanyInterface');
  interfaceEl.style.visibility = "visible";

  // Store data
  dataFromServer = inData;

  // Selection species list to add plots
  let species = getUnique(inData, "NomEspecie"); // Useful to create species selector
  const listEl = document.getElementById('listSpecies');
  listEl.remove(); // Hide intially the list with species
  createSearchList(inData, species, listEl);


  // Get data for a specific species for first chart
  let dataSpeciesForGraph = getDataForSpecieX(dataFromServer, species[0])
  // Create Highchart
  myChart = createChart(dataSpeciesForGraph);
  //myChart.showLoading();
  //myChart.addSeries(graphSpecies);


  // Button events
  const addSerieBtnEl = interfaceEl.querySelector('#addSpecies');
  const removeSerieBtnEl = interfaceEl.querySelector('#deleteSpecies');


  addSerieBtnEl.addEventListener('click', () => {
    if (listEl.parentElement === null) // If it is not already there
      addSerieBtnEl.parentElement.appendChild(listEl);
  });
  removeSerieBtnEl.addEventListener('click', () => {
    if (myChart.series.length > 0)
      myChart.series[myChart.series.length-1].remove()
    if (listEl.parentElement !== null) // Remove
      listEl.remove();
  });


  // Create timeSlider
  //var timeSlider = new TimeSliderArcGIS("timeSliderContainer", undefined,undefined,undefined);
  //timeSlider.createTimeSlider();

}





// Create Highchart
const createChart = (serieSpecies) => {

  const hChart = Highcharts.chart('tamanyContainer', {
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
            fillOpacity: 0.2,
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



// Create list selector // https://listjs.com/api/
const createSearchList = (inData, speciesArray, listEl) => {

  // Create values for each species
  let values = [];
  speciesArray.forEach(item => {
    // Get color from palette
    let colorItem = palette[item] === undefined ? "rgb(" + palette.Altres.color + ")" : "rgb(" + palette[item].color + ")";
    // Get common name
    let commonName = "";
    // Find common name in data (not optimal)
    for (let i = 0; i<inData.length; i++){
      if (inData[i].NomEspecie == item && inData[i].NomComu !== null){
        commonName = inData[i].NomComu;
        break;
      }
    }
    // Assign for the List
    values.push({name: item, color: colorItem, nomComu: commonName}); //  Add the common name for the search?//});
  });
  // Create HTML template
  let options = {
    item: (values) => "<li'><button class='btn btn-default' style='text-align:left'>"+
    "<span style='color:"+ values.color +"'> ● </span>" +
    values.name +
    "</button></li>"
  }

  // Create HTML
  let listSpecies = new List(listEl, options, values);

  // Assign button events
  listSpecies.list.childNodes.forEach((el)=>el.addEventListener("click", (e)=>{
    // Get species name
    let speciesName = e.currentTarget.innerText.split("● ")[1];
    // Unselect all others


    // Add data series
    let dataSpeciesForGraph = getDataForSpecieX(inData, speciesName)
    myChart.addSeries(dataSpeciesForGraph);
    // Hide element
    listEl.remove();
  }));
}




// Get sizes (freqüència talles)
// var results = fetch("http://localhost:8080/sizes").then(r => r.json()).then(r => results = r).catch(e => console.log(e))
const getSizes = async (address, staticUrl, callbackPrepareData) => {
  // Get data
  await fetch(address)
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



// Prepares the data for the highchart
const getDataForSpecieX = (inData, inSpecies) => {
  // Select the data from a species
  let dataSelSpecies = inData.filter((item) => item.NomEspecie == inSpecies);
  // Categories (sizes)
  let categories = getUnique(dataSelSpecies, "Talla"); // Important to create X axis
  categories.forEach((cat, index) => categories[index] = parseFloat(cat)); // Transform into numbers
  categories.sort((a, b) => a - b); // Sort
  // Abundance per size
  let abundance = getAbundancePerCategories(dataSelSpecies, categories);
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




// Get unique keys
const getUnique = (inData, inKey) => {
  let uniqueKeys = [];
  // Iterate
  for (let i = 0; i < inData.length; i++){
    let value = inData[i][inKey];
    if (value !== undefined && uniqueKeys.findIndex((item) => item == value) == -1)
      uniqueKeys.push(value);
  }
  return uniqueKeys;
}



// Select data per specie
const selectData = (inData, especie) => {
  let outData = [];

  // Iterate data
  for (let i = 0; i < dataFromServer.length; i++){
    if (inData[i].NomEspecie == especie)
      outData.push(inData[i]);
  }

  return outData;
}




// Get num individuals given the categories
const getNumIndPerCategories = (inData, categories) => {
  let numInd = [];
  inData.forEach(item => {
    // Find the category index
    let catIndex = categories.findIndex((catItem) => catItem == item.Talla);
    numInd[catIndex] = numInd[catIndex] === undefined ? parseFloat(item.NIndividus) : numInd[catIndex] + parseFloat(item.NIndividus);
  })
  return numInd;
}


// Get abundance given the categories
const getAbundancePerCategories = (inData, categories) => {
  let numInd = [];
  inData.forEach(item => {
    // Find the category index
    let catIndex = categories.findIndex((catItem) => catItem == item.Talla);
    numInd[catIndex] = numInd[catIndex] === undefined ? parseFloat(item.Abundancia_NIndividus_Km2) : numInd[catIndex] + parseFloat(item.Abundancia_NIndividus_Km2);
  })
  return numInd;
}





export default startTamany
