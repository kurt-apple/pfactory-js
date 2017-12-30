//2017 Kurt Apple WTFPL
//github: kurt-apple
//disclaimer: I take no responsibility for your actions.

//intro: I was wondering what the effect to profit factor would be if,
//rather than hypothetically trading once per day, trading continued
//until a loss was incurred.

//Assumption 1: probability of win is a global all-time average
//TODO: implement a rolling average of variable width

//Here is an example of my paper calculations, and how the functions
//calculate things below: (I purposely chose a meh one)

//profit factor = (probability * reward) - (probability * risk)
//(for now I will disregard the textbook definition of profit factor)
//(this calculation is based on "risk register" type calculations)
//(doing this quick, apologies in advance for arithmetic errors)

//starting balance    1000
//probability of win  1/3
//reward-to-risk      1.50 / 0.7 = 2 1/7 = 15/7

// trades: 1
// W: 1/3 * 15/7 = 15/21
// L: 2/3 * 7/7  = 14/21
//profit factor = 15/21 - 14/21 = 1/21 = 0.048 (rounded)

//as long as the profit factor is positive, to my knowledge, the system
//should over a long enough time frame generate profit.

//Assumption 2: no commissions/fees.
//TODO: have some mechanism to account for commissions/fees!

// trades: 2
// WW: 1/3 * 1/3 * 15/7 * 2 = 30/63
// WL: 1/3 * 15/7 - (1/3 * 2/3) = 15/21 - 2/9 = 45/63 - 14/63 = 31/63 
// eventual code: (sub_prob*(riskreward*(trades-1)) - sub_prob*(1-probability);)
// L:  -2/3 = -14/21 = -42/63
//profit factor = 19/63 = 0.302 (rounded)

// trades: 3
// WWW: 1/3 * 1/3 * 1/3 * 15/7 * 3 = 1/27 * 45/7 = 45/189
// WWL: 1/3 * 1/3 * (90/21 - 14/21 [= 76/21]) = 1/9 * 76/21 = 76/189
// WL: 1/3 * 3/3 * (45/21 - 14/21) = 63/189
// L: -2/3 = -126/189
//profit factor = (45+76+63-126) / 189 = 58/189 = 0.307

//as you can see, the profit factor increases.
//this appears to remain true as long as the original system metrics have a positive profit factor.

//TODO: test more, know more.

//the main function below is monteCarloRNG() which is meant to load into a Google Sheet.
//you will get an alert requesting authorization to modify the spreadsheet;
//this is required to run this script, which generates the data table.
//space is reserved to the left of the generated table for helper columns such as lot sizing
//and the required arguments, etc.

//good news: emojis and unicode work
//ref: see google developer docs
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('✌💋  𝓶ᗝｎтᵉ c𝔸ⓡⓛσ  ♩🍓')
      .addSeparator()
      .addItem('☠👮𝖗𝖚𝖓 𝖒𝖔𝖓𝖙𝖊 𝖈𝖆𝖗𝖑𝖔👮☠', 'menuItem1')
      .addToUi();
}

function menuItem1() {
  monteCarloRNG();
}

//in case I have issues with seeding (Drive API code is meant to be deterministic)
//untested code (was trying to seed it enough to show different numbers each run-through)
//in testing, random numbers weren't changing ever, even if I reopened the sheet
//then all the sudden mine starts working. Might have something to do with my using a custom menu.
//
//var d = Utilities.formatDate(new Date(), "GMT", "HH");
//return Math.random()+(d/24) / 2;
function myRand() {
  return Math.random();
}

//until loss, trade
//
//TODO: change lot size based on new account balance
//
function tradeCycle(probability, startfund, lots, win, loss, cyclemax) {
  var result = startfund;
  for (var i = cyclemax; i > 0; i--) {
    if(myRand() + probability > 1) {
      result += lots*win;
    }
    else {
      result -= lots*loss;
      break;
    }
  }
  return result;
}

//place steps into helper cell
function monteCarloRNG() {
	var activeSheet = SpreadsheetApp.getActive();
	var sheet = activeSheet.getSheets()[0];
  //starting coordinates (top-left corner) of generated data table
	var row = 2;
	var col = 14;
	var allRows = [];
	var firstRow = []; firstRow.push(" ");
    //get values from the sheet.
    var maxrows = sheet.getRange(2, 1).getValue();
    var montecs = sheet.getRange(2, 2).getValue();
    var success = sheet.getRange(2, 3).getValue();
    var balance = sheet.getRange(2, 4).getValue();
    var winning = sheet.getRange(2, 5).getValue();
    var lossamt = sheet.getRange(2, 6).getValue();
    var cyclmax = sheet.getRange(4, 7).getValue();
    var lotsmin = sheet.getRange(2, 8).getValue();
    var stepsiz = sheet.getRange(2, 9).getValue();
    var maxdraw = sheet.getRange(2, 10).getValue();
  
    //for ease, place starting balance at top of each monte row
    for(var fi = 1; fi < montecs; fi++) {
		  firstRow.push(balance);
	  }
	  allRows.push(firstRow);
    
    var ijBAL = 0;
  	for(var i = 1; i <= maxrows; i++) {
  		var rowData = [];
  		rowData.push(i);
  		for(var j = 1; j < montecs; j++) {
        ijBAL = allRows[i-1][j];
  			rowData.push(tradeCycle(success, ijBAL, Math.max(lotsmin, (ijBAL*maxdraw)/stepsiz), winning, lossamt, cyclmax));
  		}
  		allRows.push(rowData);
  	}
    sheet.getRange(row, col, allRows.length, allRows[0].length).setValues(allRows);
}

//this used to be recursive, but the iterative solution was easy and quick to implement
//to avoid stackoverflow

//recurse_pf: function returns number of trades per cycle
//that ought to be permitted based on the "diminishing returns"
//threshold set by the threshold variable (eg. 0.01).
function recurse_pf(probability, rewardratio, max, threshold) {
  var i = 1;
  var prev = 0;
  var tmp = 0;
  while(i < max) {
    tmp = pf_top(probability, rewardratio, i);
    if((tmp - prev) < threshold) {
      return i;
    }
    prev = tmp;
    i++;
  }
  return i;
}

function pf_top(probability, riskreward, trades) {
	if(trades == 1) {
    	return probability*riskreward - (1-probability);
  	}
  	var pf_iterval = 0;
	for(var a = 1; a <= trades; a++) {
		pf_iterval += pf_legs(probability, riskreward, a);
	}
	var pf = Math.pow(probability, trades) * (trades * riskreward);
	pf += pf_iterval;
	return pf;
}

function pf_legs(probability, riskreward, trades) {
  var sub_prob = Math.pow(probability, trades-1.0);
  var current = sub_prob*(riskreward*(trades-1)) - sub_prob*(1-probability);
  return current;
}