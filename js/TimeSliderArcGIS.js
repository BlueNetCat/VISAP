// https://developers.arcgis.com/javascript/latest/sample-code/timeslider-filter/
// https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-TimeSlider.html
//var timeSlider = new TimeSliderArcGIS("timeSliderContainer", undefined,undefined,undefined);
//timeSlider.createTimeSlider();

class TimeSliderArcGIS {
	constructor(idContainer, start, end, callBackTimeChange){

    this.idContainer = idContainer;
    this.start = start || new Date(2019, 4, 1);
    this.end = end || new Date(2020, 6, 30);
    this.callBackTimeChange = (startTime, endTime) => console.log(startTime + ", " + endTime);

	}

  createTimeSlider = () => {
    require([
      "esri/widgets/TimeSlider"
    ], (TimeSlider) => {

      // create a new time slider widget
      // set other properties when the layer view is loaded
      // by default timeSlider.mode is "time-window" - shows
      // data falls within time range
      const timeSlider = new TimeSlider({
        container: this.idContainer,
        mode: "time-window",
        playRate: 1,//1000,
        stops: {
          interval: {
            value: 5,
            unit: "days"
          }
        },
        fullTimeExtent: {
          start: this.start,
          end: this.end
        },
        values: [
          this.start,
          this.end
        ],
        layout: "compact",
        labelsVisible: true
      });



        // Values property is set so that timeslider
        // widget show the first day. We are setting
        // the thumbs positions.
        //timeSlider.values = [start, end];

        // watch for time slider timeExtent change
        timeSlider.watch("timeExtent", () => {
          // only show what happened up until the end of
          // timeSlider's current time extent.
          //time <= timeSlider.timeExtent.end.getTime();

          this.callBackTimeChange(timeSlider.timeExtent.start.toLocaleDateString(), timeSlider.timeExtent.end.toLocaleDateString());
          // now gray out what happened before the time slider's current
          // timeExtent... leaving footprint of what already happened
          //timeSlider.timeExtent;

          // Format to string
          //timeSlider.timeExtent.start.toLocaleDateString();
          //timeSlider.timeExtent.end.toLocaleDateString();
        });
    });
  }

}
