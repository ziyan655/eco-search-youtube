//initialize jquery UI elements
$(function() {
	$( "button[type=submit]" )
	.button({
		icons: {
			primary: "ui-icon-search"
		},
		text: false
	});
});
$(function() {
	$( "#orderBySelectMenu" ).selectmenu();		
});
$(function() {
	$( "#slider-range-min" ).slider({
		range: "min",
		value: 7,
		min: 5,
		max: 25,
		slide: function( event, ui ) {
			$("#amount").val(ui.value);
		}
	});
	$("#amount").val($("#slider-range-min").slider("value"));
});
$(function() {
	$( "#caption" ).buttonset();
	$( "#definition" ).buttonset();
	$( "#duration" ).buttonset();
	$( "#postDate" ).buttonset();
});
//disable default submit event, so only part of the page is submitted 
$(function(){
	$('#searchForm').submit(function(e){
		e.preventDefault();
	});
})
//load fancybox plugin
$(document).ready(function(){
	$(".fancybox").fancybox();
});
//auto-complete, requesting word suggestion from server
$(document).ready(function(){
	$("#query").autocomplete({
		source: function(request, response){
			var apiKey = 'AIzaSyCvk3NNMQASZgFkCNxIp9jH-l8O0PXhDUo';
			var quer = request.term;

			$.ajax({
				url: "http://suggestqueries.google.com/complete/search?hl=en&ds=yt&client=youtube&hjson=t&cp=1&q="+quer+"&key="+apiKey+"&format=5&alt=json&callback=?",  
				dataType: 'jsonp',
				success: function(data, textStatus, request) { 
					response( $.map( data[1], function(item) {
						return {
							label: item[0],
							value: item[0]
						}
					}));
				},
				async:false
			});
		},
		select: function( event, ui ) {
			search();
		}
	});
});
//get searching parameters from the user and send them as a request to Youtube Data API using ajax call
function search(){
	getSearchParameters();

	$.ajax({url:"https://www.googleapis.com/youtube/v3/search",
		data:{
			part: 'id',
			maxResults:resultNum,
			order:order,
			publishedAfter:postDate,
			q: q,
			type:'video',
			videoCaption:caption,
			videoDefinition:definition,
			videoDuration:duration,
			key: 'AIzaSyCvk3NNMQASZgFkCNxIp9jH-l8O0PXhDUo'},
			success:function(data){
				if(data.items.length == 0){
					$("#searching").text("No Results");
					$("#searching").css("color", "red");
				}else {
					getResult(data);
				}
			},
			async:true
		});
}

function getSearchParameters(){
	//initialize page content
	$("#searching").text("Searching...");
	$("#searching").css("color", "black");
	$('#searching').fadeIn("fast");
	$('#pageResults').html('');
	$('#buttons').html('');

	//get all search parameters, they're all global vars, so when going to next or previous paga, search parameters are preserved
	q = $('#query').val();
	order = $("#orderBySelectMenu option:selected").val();
	if(order=="not selected"){
		order="relevance";
	}
	resultNum = $("#amount").val();
	caption = $("#caption input:checked").val();
	definition = $("#definition input:checked").val();
	duration = $("#duration input:checked").val();
	dateTmp = $("#postDate input:checked").val();
	if(dateTmp == 60){
		postDate = moment().subtract(3600,'seconds').format();
	}else {
		postDate = moment().subtract(dateTmp,'days').format();
	}
}

//display video results and buttons
function getResult(data){
	var nextPageToken = data.nextPageToken;
	var prevPageToken = data.prevPageToken;
	pageResultsNum = data.items.length;
	//iteratively construct all the videos results
	$.each(data.items, function(i, item){
		var output = getOutput(item);
		$('#pageResults').append(output);
	});
	//display buttons according to the number of available results
	var buttons = getButtons(prevPageToken, nextPageToken);
	$('#buttons').append(buttons);
}

//request detailed video info using Youtube Data API and construct html elements using the data received
function getOutput(item){
	videoId = item.id.videoId;

	$.ajax({url:"https://www.googleapis.com/youtube/v3/videos",
		data:{
			part: 'statistics,contentDetails,snippet',
			id:videoId,
			key: 'AIzaSyCvk3NNMQASZgFkCNxIp9jH-l8O0PXhDUo'},
			success:function(data){
				videoData = data;
			},
			async:false	//must be synchronous, because video ids need to be fetched from server before requesting more info on the videos
		});
	
	parseApiData();
	$('#searching').fadeOut("fast");
	return videoItemFactory();
}

//parse api data to results that can be displayed as html elements
function parseApiData(){
	viewCount = videoData.items[0].statistics.viewCount;
	viewCountHum = (viewCount + "").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
	likeCount = videoData.items[0].statistics.likeCount;
	likeCountHum = (likeCount + "").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
	dislikeCount= videoData.items[0].statistics.dislikeCount;
	dislikeCountHum = (dislikeCount + "").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
	durationISO8601 = videoData.items[0].contentDetails.duration;
	definition = (videoData.items[0].contentDetails.definition).toUpperCase();
	totalSeconds = moment.duration(durationISO8601).asSeconds();
	humanFormatDuration = moment.duration(totalSeconds, "seconds").humanize();
	title = videoData.items[0].snippet.title;
	descriptionFull = (videoData.items[0].snippet.description);
	if(descriptionFull.length > 190){
		description = descriptionFull.substring(0,190) + "...";
	}else {
		description = descriptionFull;
	}
	thumb = videoData.items[0].snippet.thumbnails.high.url;
	channelTitle = videoData.items[0].snippet.channelTitle;
	channelId = videoData.items[0].snippet.channelId;
	videoDate = videoData.items[0].snippet.publishedAt;
	videoDateHuman = moment(videoDate).format("MMMM Do YYYY, h:mm:ss a");
}

//constructs html elements for one video
function videoItemFactory(){
	var output = '<li>' +
	'<div class="list-left">' +
	'<a class="fancybox fancybox.iframe" href="http://www.youtube.com/embed/'+videoId+'"><img src="'+thumb+'"></a>'+
	'</div>' +
	'<div class="list-right">' +
	'<a class="fancybox fancybox.iframe" href="http://www.youtube.com/embed/'+videoId+'"><p class="videoTitle"><b>'+title+'</b></p></a>' +
	'<p class="videoPublishDate">By <a id="chTitle" href="https://www.youtube.com/channel/'+channelId+'">' + '<span class="author"><i>'+channelTitle+'</i></span></a> '+ videoDateHuman +'</p>' +
	'<p class="duration-viewCount">' + humanFormatDuration + ' | ' + viewCountHum + ' views</p>' + 
	'<p class="likes">' + likeCountHum + ' likes | ' + dislikeCountHum + ' dislikes</p>' +
	'<p class="definitionOutput">' + definition + '</p>' +
	'<p class="description">'+description+'</p>' +
	'</div>' +
	'</li>' +
	'<div class="clearfix"></div>' +
	'';
	return output;
}

//similar to search() but invoked when the next page button is clicked
function nextPage(){
	var token = $('#next-button').data('token');	//pass page token using element attribute
	getSearchParameters();

	$.ajax({url:"https://www.googleapis.com/youtube/v3/search",
		data:{
			part: 'id',
			maxResults:resultNum,
			order:order,
			publishedAfter:postDate,
			q: q,
			pageToken: token,
			type:'video',
			videoCaption:caption,
			videoDefinition:definition,
			videoDuration:duration,
			key: 'AIzaSyCvk3NNMQASZgFkCNxIp9jH-l8O0PXhDUo'},
			success:function(data){
				if(data.items.length == 0){
					$("#searching").text("No Results");
					$("#searching").css("color", "red");
				}else {
					getResult(data);
				}
			},
			async:true
		});
}

//similar to search() but invoked when the previous page button is clicked
function prevPage(){
	var token = $('#prev-button').data('token');
	getSearchParameters();

	$.ajax({url:"https://www.googleapis.com/youtube/v3/search",
		data:{
			part: 'id',
			maxResults:resultNum,
			order:order,
			publishedAfter:postDate,
			q: q,
			pageToken: token,
			type:'video',
			videoCaption:caption,
			videoDefinition:definition,
			videoDuration:duration,
			key: 'AIzaSyCvk3NNMQASZgFkCNxIp9jH-l8O0PXhDUo'},
			success:function(data){
				getResult(data);
			},
			async:true
		});
}

//construct button elements
function getButtons(prevPageToken, nextPageToken){
	if(!prevPageToken){
		//reached end of page
		if(pageResultsNum < resultNum) {
			return "";
		} else {
			//first page, no prev page button
			var btnoutput = '<div class="pagingButtonContainer">'+'<button id="next-button" class="pagingButton" data-token="' + nextPageToken+'"' + 
			'onclick="nextPage();">Next</button></div>';
		}
	} else if(pageResultsNum < resultNum) {
		//reached end of page when there were previous pages
		var btnoutput = '<div class="pagingButtonContainer">'+'<button id="prev-button" class="pagingButton" data-token="' + prevPageToken + '"' +
		'onclick="prevPage();">Prev</button></div>';
	} else {
		//normal case
		var btnoutput = '<div class="pagingButtonContainer">'+
		'<button id="prev-button" class="pagingButton" data-token="'+prevPageToken+'"' +
		'onclick="prevPage();">Prev</button>' +
		'<button id="next-button" class="pagingButton" data-token="'+nextPageToken+'"' +
		'onclick="nextPage();">Next</button></div>';
	}
	return btnoutput;
}

