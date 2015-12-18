/* DOM helpers
**************************************/

// Get elements by CSS selector:
function qs(selector, scope) {
	return (scope || document).querySelector(selector);
}
function qsa(selector, scope) {
	return (scope || document).querySelectorAll(selector);
}

// Add event listeners:
function on(target, type, callback, useCapture) {
	target.addEventListener(type, callback, !!useCapture);
}

// removes all of an element's childNodes
function removeChilds(el) {
	var last;
	while ((last = el.lastChild)) el.removeChild(last);
}


/* other helpers
**************************************/

function instead(eventHandler) {
	return function(event) {
		event.preventDefault();
		if (eventHandler) eventHandler.apply(this, arguments);
	};
}


// Make strings safe for innerHTML and attribute insertion (templates):
var escapeHTML = (function() {
	var entityMap = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	},
	re = /[&<>"']/g;
	
	return function(str) {
		return String(str).replace(re, function (char) {
			return entityMap[char];
		});
	};
})();


// Templating:
var tmp = {};
(function(regExp) {
	function evalDots(obj, key) {
		var keys = key.split('.');
		var nextObj;
		return keys.length ?
			(nextObj = obj[keys[0]], (keys.length > 1 ? 
				(keys.shift(), evalDots(nextObj, keys.join('.'))) :
				nextObj)) :
			obj;
	}
	
	[].forEach.call(document.querySelectorAll('script[type="text/tmp"]'), function(el) {
		var src = el.innerHTML;
		tmp[el.id] = function(data) {
			var newSrc = src.replace(regExp, function(match, key) {
				var numCurlyBraces = match.length - key.length;
				return numCurlyBraces % 2 ? match :
					(numCurlyBraces === 6 ? evalDots(data, key) : escapeHTML(evalDots(data, key)));
			});
			return newSrc;
		};
	});
})(/{{{?([\w.]+)}}}?/g);


function langCount(num, singular, plural) {
	var noun = num === 1 ? (num = 'a', singular) : plural;
	return num + ' ' + noun;
}

// 'You are ' + timesComparative(3, 'wealthy', 'wealthier') 'I'
// => 'You are 3 times wealthier than I'
function langTimesComparative(factor, adj, comparativeAdj) {
	return factor === 1 ? 'as ' + adj + ' as' :
	factor === 2 ? 'twice as ' + adj + ' as' :
	factor + ' times ' + comparativeAdj + ' than';
}

function sum(array) {
	var num = 0;
	for (var i = 0, l = array.length; i < l; i++) num += array[i];
	return num;
}

function formatNum(num) {
	return num.toLocaleString();
}


/* app logic
**************************************/

// max $$ made / day: percentage of population in this 
var NUM_DAYS_IN_YEAR = 365.242199;
var getPercentile = (function() {
	var INCOME_PERCENTILES = [91.8,70.1,56.4,48.4,43,39.1,36,33.6,31.5,29.9,28.6,27.5,26.5,25.6,24.6,23.7,22.7,21.8,20.9,20.1,19.4,18.9,18.3,17.8,17.2,16.7,16.3,15.8,15.3,14.9,14.5,14.2,13.8,13.4,13.1,12.7,12.4,12,11.7,11.5,11.2,10.9,10.6,10.3,10,9.8,9.5,9.2,9,8.8,8.5,8.3,8.1,7.9,7.6,7.3,7.1,6.9,6.7,6.6,6.4,6.3,6.1,6,5.8,5.7,5.5,5.4,5.2,5.1,5,4.9,4.7,4.6,4.5,4.4,4.3,4.2,4,4,3.9,3.8,3.7,3.6,3.6,3.5,3.4,3.3,3.2,3.2,3.1,3,3,2.9,2.8,2.8,2.7,2.7,2.6,2.6,2.5,2.5,2.4,2.4,2.3,2.3,2.2,2.2,2.1,2,2,2,1.9,1.9,1.9,1.9,1.8,1.8,1.8,1.7,1.7,1.7,1.7,1.6,1.6,1.6,1.5,1.5,1.5,1.5,1.4,1.4,1.4,1.3,1.3,1.3,1.3,1.2,1.2,1.2,1.2,1.1,1.1,1.1,1,1,1,1,1,1,1,0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.7,0.7,0.7,0.7,0.7,0.7,0.7,0.7,0.7,0.7,0.6,0.6,0.6,0.6,0.6,0.6,0.6,0.6,0.6,0.6,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.1];
	return function(annualIncome) {
		var dailyIncome = Math.round(annualIncome / NUM_DAYS_IN_YEAR);
		return INCOME_PERCENTILES[dailyIncome] || INCOME_PERCENTILES[INCOME_PERCENTILES.length - 1];
	};
})();

// prevent other scripts from interfering with input
on(qs('.income-gap-calc input'), 'keydown', function(event) {
	event.stopPropagation();
});

var resultsContainer = qs('.income-gap-calc .results');
on(qs('.income-gap-calc form'), 'submit', instead(function() {
	removeChilds(resultsContainer);
	var income = parseInt(this.income.value, 10);
	var numChildren = income ?
		Math.floor(income * MAX_SUGGESTED_DONATION_PERCENTAGE / CHILD_SPONSORSHIP_ANNUAL_COST) :
	0;
	numChildren = numChildren || 1;
	var incomePercentile = getPercentile(income);
	resultsContainer.innerHTML = tmp.results({
		donationPercentage: Math.ceil(numChildren * CHILD_SPONSORSHIP_ANNUAL_COST / income * 100),
		numChildren: langCount(numChildren, 'child', 'children'),
		wealthiestPercentile: incomePercentile + '%',
		numPoorerPeople: formatNum(Math.round((100 - incomePercentile) / 100 * WORLD_POPULATION)),
		timesWealthierThanPoorestBillion: langTimesComparative(Math.floor(income / INCOME_OF_POOREST), 'wealthy', 'wealthier'),
		incomeOfPoorest: INCOME_OF_POOREST
	});
	refTagger.tag();
}));