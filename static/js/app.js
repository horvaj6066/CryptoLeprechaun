// start and end date stuff is for main charts/slider
var parseStartDate = d3.timeParse("%Y%m%d");
var formatStartDate = d3.timeFormat("%Y%m%d");//format same as date range slider
var start_date = parseStartDate("20190501"); // sets the start date of the first chart- needs to be a number   
start_date = formatStartDate(start_date); // not sure why but need both time parse and and time format to get into the right format for comparison later
var current_date = new Date(); 
var year=current_date.getFullYear(); 
var hour=current_date.getHours();
var minute=current_date.getMinutes();
var seconds=current_date.getSeconds();

function fixDigit(val){ //this little function adds a 0 in front of single digit days/months
  return val.toString().length === 1 ? "0" + val : val;
}
if (hour<17) { // ***shd be 17 if it's before daily close make the "trade date" yesterdays date
  current_date.setDate(current_date.getDate() - 1 );
  } 
console.log(hour, minute);

var js_month=fixDigit(current_date.getMonth()); //js mode month from 0-11 
var month=fixDigit(current_date.getMonth()+1); //add one for regular
var day=current_date.getDate();
trade_date=String(year)+month+String(day); //trade date as a string ie before 5PM is yesterday
console.log("trade_date beginning:", trade_date, "current_date beginning:", current_date);

var end_date = trade_date; //this is used for the slider stuff ie the date window - added the Number 9/10/19    
$("#slider").dateRangeSlider({ //date range slider setup max and min dates the $ in front just means it's jquery 
 bounds:{
   min: new Date(2016, 08, 24), // ***need to make sure we have the data within this max min range****   
   max: new Date(year, js_month, day) // these dates are objects not strings and month starts zero so subtract one from the month number
   }
 });

 $("#slider").dateRangeSlider("values", new Date(2019, 05, 01), new Date(year, js_month, day)); // this sets the default values of the slider tab (and chart) 
console.log("THIS IS LINE 32 RIGHT before makeResponsive loop"); //2016, 08, 24 was previous new Date

function makeResponsive() { //this is the MAIN loop 
  console.log("just entered make responsive line 35");
  // first SET our VARIABLES AND CONSTANTS
  var svgWidth = window.innerWidth; //this is candlestick window width- I can't find exactly where the window size is determined, something to do with D3 makeresponsive 
  var svgHeight = window.innerHeight; //this is candlestick window height 

  var margin = {
    top: 10, //was 10
    right: 150,
    bottom: 300, //was 170 worked to show the 2nd indicator rectangle for the profit boxes - was 120
    left: 150
  };

  // next lets do candle window, volume window and indicator window sizes 
  var candle_win_height = (window.innerHeight - margin.bottom - margin.top) * 4/5;
  var candle_win_width = window.innerWidth - margin.left - margin.right; //size of the candlestick and volume rect 
  var indicator_win_height = (window.innerHeight - margin.bottom - margin.top) * 1/5;; //size of indicator rect 
  var indicator_win_width = candle_win_width; //size of indicator rect 

  const candle_win_ratio = 4/5; //candles meant to take up 80% of window but it's 75% only, check scale  
  const volume_win_ratio = 1/4;

  //Clear SVG --> required for "make responsive" function
  var svgArea = d3.select("#svg-area").select("svg");

  if (!svgArea.empty()) {
    svgArea.remove();
    }

  // Append the SVG cointainer, set its height and width, and create a variable which references it  
  var svg = d3
    .select("#svg-area") 
    .append("svg")
    .attr("height", svgHeight)
    .attr("width", svgWidth); 
  
  // Create chart groups for the profits chart - this is the two rectangles below volume bars
  var IndicatorChartGroup = svg.append("g");
  var IndicatorChartGroup2 = svg.append("g");
  var IndicatorChartGroup3 = svg.append("g");

  // Create a chart group for the Indicator Chart
  var CandleChartGroup = svg.append("g");
 
  // function used for updating indicator group with new tooltip
  function updateToolTip(selectdata, chosenIaxis, iLinesGroup, ind_values, i) { // this one goes all the way to the bottom
    if (chosenIaxis === "bitfinex_shorts") {
      var labeli = "Shorts: ";
    }
    else {
      var labeli = "Dominance: ";
    }

    // format tooltip data
    var datei = selectdata[i]["date (formatted)"];
    datei = formatDate2(datei);
    var valuei = ind_values[i];
    valuei = valuei.toFixed(2);

    var toolTip = d3.tip()
      .attr("class", "d3-tip")
      .offset([0, 0])
      .html(function() { 
        // console.log(selectdata[i]["date (formatted)"])
        return (`${labeli} <br> ${datei} ${"$" + valuei}`);
      });

    iLinesGroup.call(toolTip);
    iLinesGroup.on("mouseover", function(data) {
      toolTip.show(data, this);
    })
      // onmouseout event
      .on("mouseout", function(data, index) {
        toolTip.hide(data);
      });
    return iLinesGroup;
  }
  // SET FIRST CHOSEN INDICATOR
  var chosenIaxis = "bitfinex_shorts";

// PARSE DATE/TIME FUNCTIONS
// Instuctionrs: https://github.com/d3/d3-time-format/blob/master/README.md
  var formatDate2 = d3.timeFormat("%e %b %y");

  //*********************************************************************************************/
  //UPCOMING section calls downloads the price data from csv by calling btc_data route via flask/ 
  //*******************************************************************************************/
  console.log("just about to call btc data");
  // get the data from CSV via the flask app and put the json into variables  
  d3.json(`/btc_data`).then(function(data)  {
    console.log("***************************this is the function that uploads the data and renders************")
    // our candlestick chart variables 
    var date_alldata= Object.values(data["date"]); // doesn't work if I remove the Object.values
    var open_alldata = data["open"];
    var close_alldata = data["close"];
    var high_alldata = data["high"];
    var low_alldata = data["low"];
    var volume_alldata = data["unit_volume"];
   
    //our PnL box variables 
    var predict_alldata = data["predict"];
    var predict_date_alldata= data["date"];
    var predict_profit_alldata= data["profit"];

    // Create lists
    var date = [];
    var open = [];
    var close = [];
    var high = [];
    var low = [];
    var volume = [];
    var predict = [];
    var predict_date = [];
    var predict_profit = [];
    var predict_total_profit=0;

    // calculate length of data
    var data_length = date_alldata.length;
    //console.log("length of time series of csv file followed by data ln 156:",data_length);
   
    // loop through and only pick-up data within start- and end- date OF THE SLIDER
    // not picking up the data for some reason when i do a refresh 9/10/19 date format mismatch likely
    for (i = 0; i < data_length; i++) {
    console.log("main loop - typeof start_date end_date:",typeof(start_date), start_date, typeof(end_date), end_date); //problem is start end end date are strings not nums 
    //above start date is coming out as string "19691231" at some point when reset and giving whole dataset
      if (date_alldata[i] >= start_date) { //just added formatDate here 
       //console.log("first if penetrated");
        if (date_alldata[i] <= end_date) {
         //console.log("date_alldata[i] is also LESS THAN end_date");
            date.push(date_alldata[i]);
            open.push(open_alldata[i]);
            close.push(close_alldata[i]);
            high.push(high_alldata[i]);
            low.push(low_alldata[i]);
            volume.push(volume_alldata[i]);
            //console.log("AM INSIDE 2nd if loop here is predict_alldata[i]",predict_alldata[i]);
            if (predict_alldata[i]>0)  {  //only the last hundred or so are predictions on training data, peeling these off for profit bars
              predict.push(predict_alldata[i]);
              predict_date.push(predict_date_alldata[i]);
              predict_profit.push(predict_profit_alldata[i]); //the last one of these will always be empty until next day
              predict_total_profit = predict_total_profit+predict_profit_alldata[i];
            }
        }
      }
    }

    var latest_profit= predict_profit[predict_profit.length-2];
    //console.log("ln 181 predict profit length, 2nd last predict profit or -2, and latest profit :", predict_profit.length, predict_profit[predict_profit.length-2], latest_profit);
    //console.log("predict", predict);
    predict_profit[(predict_profit.length-1)]=0; 
    // this is to zero out the last predict_profit as we don't know what the profit is at this point 
    //console.log("predict length:",predict.length, "date length:",date.length); //LLLLLLLLLEEEEEEEEEENGTH
    // convert date as number to date as date
    var parseTime3 = d3.timeParse("%Y%m%d");
     
    var date_asdate = []
    for (x in date) {
      datex = parseTime3(date[x])
      date_asdate.push(+datex)
      //console.log("x and asdate", x, datex);
    }

    // calculate length of new selected data
    selected_data_length = date.length;
    // combine new data into single object
    selectdata = []

    for (i = 0; i < selected_data_length; i++) {
      datai = {"date (formatted)": date_asdate[i],
               "date": date[i],
              "open": open[i],
              "close": close[i],
              "high": high[i],
              "low": low[i],
              "volume": volume[i],
      }
      selectdata.push(datai)
    }
    // calculate values for volume and candlestick size setup 
    var max_volume = Math.max.apply(0, volume);
    const vol_max_height = volume_win_ratio * candle_win_height;
    const vol_base=candle_win_height;  
    var bar_width = candle_win_width/(volume.length); //tried adding +1 to vol.length but didn't seem to do it
    const candlestick_max_height = candle_win_ratio * candle_win_height;// - margin.top; //for the wicks gives us a 382 range  
    var highest_wick = Math.max.apply(0, high); //
    var max_predict = Math.max.apply(0,predict); 

    // figure out if prediction is higher than highest candle wick so we can adjust the y scale accordingly
    if (max_predict > highest_wick) {highest_wick=max_predict}; // some predictions are way above the top

    var lowest_wick = d3.min(low); // 
    const scaler = candlestick_max_height / (highest_wick-lowest_wick); //scaler for candlestick window 
    var profit_max = d3.max(predict_profit); //for scaling profit bar max size 
    var profit_min = d3.min(predict_profit);

    // figure out max profit bar size for scaling 
    if (Math.abs(profit_min) > profit_max ) {
      profit_max=Math.abs(profit_min)
    }
    //console.log("profit max, profit min, pedict_profit:",profit_max, profit_min, predict_profit);
    
    // CREATE X-AXIS
    // set x-scale DATE 
    var xScale = d3.scaleTime()//DATA SCALE *****may want to turn these 90 degrees here**** 
      .domain([d3.min(date_asdate), d3.max(date_asdate)]) //it's here asdate   
      .range([0, candle_win_width-bar_width]);
    
    // create x-axis
    var xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat("%e %b %y"))// d3 v4 
      .ticks(Math.round(date.length/5)); // working, correct cormat and scaled !

    // add x-axis to CandleChartGroup
    CandleChartGroup.append("g") //tried rotation this but rotated the whole scale 
      .attr("transform", `translate(${margin.left}, ${candle_win_height+margin.top})`) //x-axis ie date
      .style("font", "12px sans-serif")
      .style("stroke", "grey")
      .call(xAxis)
      .selectAll("text")	// this part is what rotates the text 90 degrees 
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function(d) {
            return "rotate(-90)" 
            });
    ;
    // CANDLE Y-AXIS set LEFT y-scale for the CANDLES 
    var yScale = d3.scaleLinear()
      .domain([highest_wick, d3.min(low)])
      .range([0, candle_win_height*candle_win_ratio]); //was candle_win_ratio ****************************/

    // create candle y-axis
    var yAxis = d3.axisLeft(yScale) //candlestick y axis 
      .ticks(10); 

    // add candle y-axis to CandleChartGroup
    CandleChartGroup.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`) // main price axis 
      .style("font", "12px sans-serif")
      .style("stroke", "grey")
      .call(yAxis)
    //DONE with candle LEFT scale 

    // TRADING VOLUME Y-AXIS - set y-scale for volume BARS on RIGHT 
    var yScale2 = d3.scaleLinear() 
      .domain([d3.max(volume), 0])
      .range([0, volume_win_ratio*candle_win_height]);
    
    // create trading volume y-axis
    var yAxis2 = d3.axisRight(yScale2) // volume y axis
      .ticks(5);

    // add trading volume y-axis to CandleChartGroup
    CandleChartGroup.append("g")
      .attr("transform", `translate(${margin.left+candle_win_width}, ${(1-volume_win_ratio)*candle_win_height+margin.top})`) //volume axis, right side 
      .style("font", "12px sans-serif")
      .style("stroke", "grey")
      .call(yAxis2);
   
    CandleChartGroup.append("text") // volume label for volume axis
      .attr("x", candle_win_height-(margin.top*4))         // higher minus moves it down so this is actually y because rotated   
      .attr("y", -candle_win_width-margin.left-margin.right/3) // margin.left is 150 
      .style("font", "16px sans-serif")
      .style("fill", "grey")
      .style("font-weight", "bold")
      //.attr("text-anchor", "start")
      .classed("active", true)
      .text("Volume (000s)")
      .attr("transform", "translate(0,0) rotate(90)"); //FINALLY this is how you rotate!!!!

    CandleChartGroup.append("text")
      .attr("x", -candle_win_height/2)         // higher minus moves it down so this is actually y because rotated   
      .attr("y", margin.left*2/3) // margin.left is 150 
      .style("font", "18px sans-serif")
      .style("font-weight", "bold")
      .style("fill", "grey")
      //.attr("text-anchor", "start")
      .classed("active", true)
      .text("Bitcoin Price - USD")
      .attr("transform", "translate(0,0) rotate(-90)"); //FINALLY this is how you rotate!!!!

    // CREATE PROFIT BAR Y-AXIS on **RIGHT** side just started this at 415 PM HERE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
    var yScale3 = d3.scaleLinear() 
      .domain([profit_max, -profit_max])
      .range([0, indicator_win_height*2]);
    
    // create trading volume y-axis
    var yAxis3 = d3.axisRight(yScale3) // volume y axis
      .ticks(8 );

    // add trading volume y-axis to CandleChartGroup
    CandleChartGroup.append("g")
      .attr("transform", `translate(${margin.left+candle_win_width}, ${(1-volume_win_ratio)*candle_win_height+indicator_win_height+margin.top})`) //volume axis, right side 
      .style("font", "12px sans-serif")
      .style("stroke", "grey")
      .call(yAxis3);

    // GRIDLINES
    // gridlines in x axis function
    function make_x_gridlines() {return d3.axisBottom(xScale)};

    // gridlines in y axis function
    function make_y_gridlines() {return d3.axisLeft(yScale)};

    // X-Axis gridlines
    CandleChartGroup.append("g")			
     .attr("class", "grid")
     .attr("transform", `translate(${margin.left}, ${margin.top})`)
     .style("stroke", "grey")
     .style("stroke-width", "1")
     .style("opacity", "0.1")
     .style("shape-rendering", "crispEdges") 
     .call(make_x_gridlines()
        .tickSize(candle_win_height)
        .tickFormat("")
    );
    // Y-Axis gridlines
    CandleChartGroup.append("g")	 //append gridlines to y-axis v4 D3 		
     .attr("class", "grid")
     .attr("transform", `translate(${margin.left+candle_win_width}, ${margin.top})`)
     .style("stroke", "grey")
     .style("stroke-width", "1")
     .style("opacity", "0.1")
     .style("shape-rendering", "crispEdges") 
     .call(make_y_gridlines()
        .tickSize(+candle_win_width)
        .tickFormat("")
    );
    // CHART BORDERS 
    // Append one rectangle for the candlesticks and the volume charts 
    CandleChartGroup.append("rect")
      .attr("width", candle_win_width)
      .attr("height", candle_win_height)
      .attr("x", margin.left) //x location   
      .attr("y", margin.top) //y location
      //.attr("color", "green")
      .style("stroke", "grey") // works 
      .style("stroke-width", 2) // works 
      .style("opacity", .2) // works 
      .style("fill", "none"); //works and use "none" instead of false 
      
    // first of two rectangles for the profit bars 
    IndicatorChartGroup.append("rect") // 1st rectangle below volume bars for the profits below volume bars ************************************
      .attr("width", indicator_win_width)
      .attr("height" ,indicator_win_height)
      .attr("x", margin.left) //x location   
      .attr("y", margin.top+candle_win_height) //y location
      .style("stroke", "grey") // works 
      .style("stroke-width", 2) // works 
      .style("opacity", .2) // works 
      .style("fill", "none"); //works and use "none" instead of false 

    IndicatorChartGroup.append("text") //this is the text for the profit bar scale 
      .attr("x", candle_win_height+indicator_win_height) // higher minus moves it down so this is actually y because rotated   
      .attr("y", -indicator_win_width-margin.left-margin.right/3) // bigg minus moves it right  
      .style("font", "16px sans-serif")
      .style("fill", "grey")
      .style("font-weight", "bold")
      .classed("active", true)
      .text("Profit/Loss ($)")
      .attr("transform", "translate(0,0) rotate(90)"); //FINALLY this is how you rotate!!!!
    
      IndicatorChartGroup2.append("rect") // 2nd rectangle for the losses below volume bars 
      .attr("width", indicator_win_width)
      .attr("height" ,indicator_win_height)
      .attr("x", margin.left) //x location   
      .attr("y", margin.top+candle_win_height+indicator_win_height) //y location
      .style("stroke", "grey") // works 
      .style("stroke-width", 2) // works 
      .style("opacity", 0) // was 0.2 works 
      .style("fill", "none"); //works and use "none" instead of false 

      IndicatorChartGroup3.append("rect") // 3rd rectangle for the text below indicator/profit bar areas  
      .attr("width", indicator_win_width)
      .attr("height" ,indicator_win_height)
      .attr("x", margin.left) //x location   
      .attr("y", margin.top+candle_win_height+indicator_win_height*2) //y location
      .style("stroke", "grey") // works 
      .style("stroke-width", 2) // works 
      .style("opacity", 0) // made the rectangle disappear 
      .style("fill", "none"); //works and use "none" instead of false 

      var day_month = d3.timeFormat("%d %b"); // time format for dates printed on screen at bottom 

      if(close[close.length-1]-close[close.length-predict.length] < predict_total_profit){
        var total_profit_color = "green";
      } else {
        var total_profit_color = "red";
      }   
      
      //calculate the accuracy or hit rate of predictions
      var hit_rate = 0;
      var j;
      for (j=0; j<predict_profit.length; j++) {
        if(predict_profit[j] >= 0 ) {
          var hit_rate=hit_rate+1;
        }
      }

      IndicatorChartGroup3.append("text")// text for whole series profit  
      .attr("id", "total_PnL")
      .attr("x", candle_win_width/2+margin.left)         // higher minus moves it down so this is actually y because rotated   
      .attr("y", candle_win_height+indicator_win_height*2) // margin.left is 150 
      .attr("text-anchor", "right") // set anchor y justification 
      .style("font", "26px sans-serif")
      .style("fill", total_profit_color)
      .style("opacity", 1) 
      .classed("active", true)
      .text("PnL using model L/S strategy on "+ predict.length+ " predictions was "+d3.format("$,.0f")(predict_total_profit)+" vs "+d3.format("$,.0f")(close[close.length-1]-close[close.length-predict.length])+" using buy/hold strategy with hit rate "+d3.format(",.1%")(hit_rate/predict_profit.length)); //d3.format("$,.0f")	Math.round(predict_total_profit)

      if(predict_profit[predict_profit.length-2]<0){
        var last_profit_color = "red";
      } else {
        var last_profit_color = "green";
      }   

      IndicatorChartGroup3.append("text")// text for 2nd last prediction and profit
      .attr("id", "last_predict")
      .attr("x", candle_win_width/2+margin.left)         // higher minus moves it down so this is actually y because rotated   
      .attr("y", margin.top+candle_win_height+indicator_win_height*2.25) // margin.left is 150 
      .attr("text-anchor", "right") // set anchor y justification 
      .style("font", "26px sans-serif")
      .style("fill", last_profit_color)
      .style("opacity", 1) 
      .classed("active", true)
      //.text(date[date.length-2]+ " prediction was "+d3.format("$,.0f")(predict[predict.length-2])+" PnL: "+d3.format("$,.0f")(predict_profit[predict_profit.length-2]));
      .text(day_month(d3.timeParse("%Y%m%d")(date[date.length-2]))+ " prediction was "+d3.format("$,.0f")(predict[predict.length-2])+" with PnL of "+d3.format("$,.0f")(predict_profit[predict_profit.length-2]));
      
      IndicatorChartGroup3.append("text")// text for last prediction  
      .attr("id", "current_predict")
      .attr("x", candle_win_width/2+margin.left)         // higher minus moves it down so this is actually y because rotated   
      .attr("y", margin.top+candle_win_height+indicator_win_height*2.57) // margin.left is 150 
      .attr("text-anchor", "right") // set anchor y justification 
      .style("font", "26px sans-serif")
      .style("fill", "black")
      //.attr("text-anchor", "start")
      .style("opacity", 1) 
      .classed("active", true)
      .text(day_month(d3.timeParse("%Y%m%d")(date[date.length-1]))+ " prediction was "+d3.format("$,.0f")(predict[predict.length-1]));
      

    // CANDLE BARS and CANDLE WICKS ******* MAIN LOOP FOR CANDLES AND VOLUME BARS ***************
    for (i = 1; i < volume.length; i++) {  // main loop to create the main charts  
          
      // mini-loopp that calculates if red or green candle heights 
      if (close[i]<close[i-1]) {bar_color="red"} // to make rising candles/bars green and falling red 
        else {bar_color="green"; // this one is green candle 
      } 
      if (open[i] < close[i]) {
        candle_y_start = open[i];  
        var candle_height = close[i]-open[i];  //calculate candle height 
      }
        else {
          candle_y_start = close[i];
          var candle_height = open[i]-close[i]; //calculate candle height 
      }
      //console.log("i and last close, and date:", i, close[i], date[i]);
      // CREATE WICKS
      CandleChartGroup.append("line") // now lets do the wicks of the candlesticks ** THE WICKS **
        .attr("x1", bar_width*i+margin.left)
        .attr("x2", bar_width*i+margin.left) //it's a vertical wick so same as above 
        .attr("y1", candlestick_max_height-(high[i]-lowest_wick)*scaler+margin.top) //top of wick - scaler variable problay scaling problem  
        .attr("y2", candlestick_max_height-(low[i]-lowest_wick)*scaler+margin.top) //bottom of wick
        .style("stroke", bar_color)
        .style("opacity", 0.8) // works 
        .style("stroke-width", 2)
        .style("fill", "none");

      // CREATE CANDLE BODY*****************************************************************************
      CandleChartGroup.append("rect")  // candlesticks  *** CANDLE BODY *** 
        .attr("width", bar_width*.94) 
        .attr("height", candle_height*scaler) //  
        .attr("x", bar_width*(i-1)+(.5*bar_width)+margin.left) //x location so width of bar * iterator  
        .attr("y", candlestick_max_height-(candle_y_start-lowest_wick)*scaler+margin.top-candle_height*scaler) //y location
        .attr("rx", "3") // for the rounded corners   
        .attr("ry", "3") // for the rounded corners    
        .style("stroke", "black") // works 
        .style("stroke-width", 2) // works 
        .style("opacity", 1) // works 
        .style("fill", bar_color); //works and use "none" instead of false 
            
      // CREATE VOLUME BARS ***************************************************************************
      //first calculate volume bar height
      var bar_height = volume[i]/max_volume*vol_max_height;  // calculate the height of volume bar 
      CandleChartGroup.append("rect")  //then let us do our ** VOLUME BARS **
        .attr("width", bar_width*.99) 
        .attr("height", bar_height) // calculated above 
        .attr("x", bar_width*(i-1)+(.5*bar_width)+margin.left) //x location so width of bar * iterator  
        .attr("y", vol_base-bar_height+margin.top) //y location
        .style("stroke", "black") // works 
        .style("stroke-width", 2) // works 
        .style("opacity", .7) // works 
        .style("fill", bar_color); //works and use "none" instead of false
    }
    // HERE WE DO THE PREDICT PROFITS BARS with a second loop as it's only the last 100 or so data points  
    var profit_bar_start = volume.length - predict.length; // for the time, only towards the end
    //indicator_win_height = (window.innerHeight - margin.bottom - margin.top) * 1/5; //size of indicator rect 
    //var indicator_win_width = candle_win_width; //size of indicator rect 
    for (i = 1; i < predict.length; i++) {  // main loop to create each chart item 
      var profit_bar_height = predict_profit[i]/profit_max*indicator_win_height;
      //console.log("predict_profit[i], i",predict_profit[i], i);
      if(predict_profit[i]<0) {  // if predicted profit was a loss 
        profit_bar_height = Math.abs(profit_bar_height)
        IndicatorChartGroup2.append("rect")  //then let us do our ****** LOSS BARS *******
        .attr("width", bar_width*.99)  // no diff't than above 
        .attr("height", profit_bar_height) // calculated above 
        .attr("x", bar_width*((i+profit_bar_start)-1)+(.5*bar_width)+margin.left) //x location so width of bar * iterator  
        .attr("y", candle_win_height+margin.top+indicator_win_height) //y location
        .style("stroke", "black") // works 
        .style("stroke-width", 2) // works 
        .style("opacity", 0.7) // works 
        .style("fill", "red");     
      }  
    else {
        IndicatorChartGroup.append("rect")  //then let us do our ****** PROFIT BARS *******
        .attr("width", bar_width*.99)  // no diff't than above 
        .attr("height", profit_bar_height) // calculated above 
        .attr("x", bar_width*((i+profit_bar_start)-1)+(.5*bar_width)+margin.left) //x location so width of bar * iterator  
        .attr("y", candle_win_height+margin.top+indicator_win_height-profit_bar_height) //y location
        .style("stroke", "black") // works 
        .style("stroke-width", 2) // works 
        .style("opacity", 0.7) // works 
        .style("fill", "green"); 
    }   
      //ADAPT wicks for predicted prices added to candlesticks 
      CandleChartGroup.append("line") // prediction lines in the candlestick chart 
      .attr("x1", bar_width*(i+profit_bar_start)+margin.left-(.5*bar_width))
      .attr("x2", bar_width*(i+profit_bar_start)+margin.left+(.5*bar_width)) //it's a vertical wick so same as above 
      .attr("y1", candlestick_max_height-(predict[i]-lowest_wick)*scaler+margin.top) //top of wick - scaler variable problay scaling problem  
      .attr("y2", candlestick_max_height-(predict[i]-lowest_wick)*scaler+margin.top) //bottom of wick
      .style("stroke", "purple")
      .style("stroke-width", 4)
      .style("opacity", 1)  
      .style("fill", "yellow"); 
    }  
      
    // timer in top left  
      var current_date = new Date();
      var hour=current_date.getHours();
      var minute=current_date.getMinutes();
      var month=fixDigit(current_date.getMonth()+1); //add one for regular
      var year=current_date.getFullYear();
      var day=current_date.getDate();
      var compare_date=String(year)+month+String(day); //trade date as a string ie before 5PM is yesterday

      function timer(CandleChartGroup) { //function that updates the timer in top left TIMER **************************
        var current_date = new Date(); 
        var hour=current_date.getHours();
        var minute=current_date.getMinutes();
        var seconds=current_date.getSeconds();
        if (hour<17) {
          var hour_countdown= (17-(hour+1));
        }
        else if (hour>=17) {
          var hour_countdown= (24-hour+17-1);  
        }  
        var min_countdown= (60-minute);
        var secs_countdown= (60-seconds);
        var str="";
        str= str.concat(fixDigit(hour_countdown), ":",fixDigit(min_countdown),":", fixDigit(secs_countdown));
        
        d3.select("#meantext").remove(); //erase previous timer
        
        CandleChartGroup.append("text")// append the new timer to top left 
        .attr("id", "meantext")
        .attr("x", candle_win_width/2+margin.left)         // higher minus moves it down so this is actually y because rotated   
        .attr("y", margin.top+candle_win_height+indicator_win_height*2.95) // 
        .style("font", "30px sans-serif")
        .style("fill", "black")
        //.attr("text-anchor", "start")
        .style("opacity", 1) 
        .classed("active", true)
        .text("NEXT PREDICTION: "+str)

        console.log("hour=",hour,"trade_date beginning:", trade_date, "compare date:", compare_date);       
        //compare_date="20190822" //variable is a string so just set day early if after 5 to test timer 

        if (hour==17 && trade_date != compare_date ) {//if it's not time shd be hour==17 and if  
          //d3.select("#meantext").remove(); //erase timer 
            trade_date=compare_date;
            console.log("past if, ln 614 about to call scrape")
            d3.json(`/scrape`).then(function(hello)  {
            console.log("called SCRAPE: working great next we need to run the machine learning model", hello);
            }); 
            console.log("trade_date beginning:", trade_date, "compare date:", compare_date);
            //d3.select("#meantext").remove(); //erase BOOM 
            makeResponsive();
        };
      }
      setInterval(timer, 1000, CandleChartGroup); // call timer every second            

console.log("sitting near the end ");
    //}}) //these brackets all look right to me ie match with my code but there is some error
  })
  console.log("sitting at end ");
}; 

//console.log("right before slider event loop");
$("#slider").bind("valuesChanged", function(e, data){ //this is the date slider main loop - tried "valuesChanged" but waaay slow 
  // all the logic here after the arrays generated, closing bracket at bottom
  //console.log("inside slider value change: data.values:"+ data.values + "data.values.min:" +data.values.min + " and max: " + data.values.max); //data is an object 
  //  var d = new Date(dateString);  //I think the data.values.min is in datestring format, need to 
  start_date=new Date(data.values.min);
  end_date=new Date(data.values.max);
  console.log("middle slider routine- START DATE", start_date,"start date typeof", typeof(start_date), "END date", end_date,"end type:", typeof(end_date)); 
  var new_date_parse= d3.timeFormat("%Y%m%d");
  start_date=new_date_parse(start_date); 
  end_date=new_date_parse(end_date);
  console.log("END slider routine- calling make responsive ln 643 ***new START DATE", start_date,"start date typeof", typeof(start_date), "END date", end_date,"end type:", typeof(end_date)); 
  makeResponsive();
}); // this close is from slider code 
console.log("between slider and make responsive call"); 
makeResponsive();
// When the browser window is resized, makeResponsive() is called.
d3.select(window).on("resize", makeResponsive);
console.log("gets to the VERY last line of code ");
