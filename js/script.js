
$(function(){
	$('#searchForm').submit(function(e){
		e.preventDefault();
	});
})


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

function search(){
	$("#searching").text("Searching...");
	$("#searching").css("color", "black");
	$('#searching').fadeIn("fast");

	$('#pageResults').html('');
	$('#buttons').html('');
	
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

function getOutput(item){
	
	var videoId = item.id.videoId;
	var videoData;
	$.ajax({url:"https://www.googleapis.com/youtube/v3/videos",
		data:{
			part: 'statistics,contentDetails,snippet',
			id:videoId,
			key: 'AIzaSyCvk3NNMQASZgFkCNxIp9jH-l8O0PXhDUo'},
			success:function(data){
				videoData = data;
			},
			async:false
		});

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

	$('#searching').fadeOut("fast");
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

function getResult(data){
	var nextPageToken = data.nextPageToken;
	var prevPageToken = data.prevPageToken;
	pageResultsNum = data.items.length;

	$.each(data.items, function(i, item){
		var output = getOutput(item);
		$('#pageResults').append(output);
	});

	var buttons = getButtons(prevPageToken, nextPageToken);
	$('#buttons').append(buttons);
}

function nextPage(){
	var token = $('#next-button').data('token');
	var q = $('#next-button').data('query');
	$("#searching").text("Searching...");
	$("#searching").css("color", "black");
	$('#searching').fadeIn("fast");
	$('#pageResults').html('');
	$('#buttons').html('');

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


function prevPage(){
	var token = $('#prev-button').data('token');
	var q = $('#prev-button').data('query');
	$("#searching").text("Searching...");
	$("#searching").css("color", "black");
	$('#searching').fadeIn("fast");
	$('#pageResults').html('');
	$('#buttons').html('');

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

function getButtons(prevPageToken, nextPageToken){
	if(!prevPageToken){
		if(pageResultsNum < resultNum) {
			return "";
		} else {
			var btnoutput = '<div class="pagingButtonContainer">'+'<button id="next-button" class="pagingButton" data-token="'+nextPageToken+'" data-query="'+q+'"' +
			'onclick="nextPage();">Next</button></div>';
		}
	} else if(pageResultsNum < resultNum) {
		var btnoutput = '<div class="pagingButtonContainer">'+'<button id="prev-button" class="pagingButton" data-token="'+prevPageToken+'" data-query="'+q+'"' +
		'onclick="prevPage();">Prev</button></div>';
	} else {
		var btnoutput = '<div class="pagingButtonContainer">'+
		'<button id="prev-button" class="pagingButton" data-token="'+prevPageToken+'" data-query="'+q+'"' +
		'onclick="prevPage();">Prev</button>' +
		'<button id="next-button" class="pagingButton" data-token="'+nextPageToken+'" data-query="'+q+'"' +
		'onclick="nextPage();">Next</button></div>';
	}
	return btnoutput;
}


