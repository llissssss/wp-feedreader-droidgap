var jsonContent;
var db;
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady()
{
	db = window.openDatabase("DatabaseName", "1.0", "AC feed reader", 200000);
	db.transaction(getJsonDB, errorDB); // load local data

	getJsonFromWeb();
}

function loadLocalData()
{
	// take json data stored
	
	if(jsonContent != "") // have previous data. we load it
	{
		jsonContent = JSON.parse(jsonContent);
		//alert("ja hi ha dades en local");
		generatePageFromJson();
	}
	
}

function processJsonDB(tx, results)
{
    var len = results.rows.length;
    if(len > 0)
    {
    	//alert(len);
    	jsonContent = results.rows.item(0).json;
    	//alert(jsonContent);
    	loadLocalData();
    }
    else // no previous data. loading page
	{
		//alert("no tenim res encara");
		navigator.notification.alert(
            'This is the first time you use this app. Requested feeds are being loaded.',  // message
            alertDismissed,         // callback
            'Loading...',            // title
            'Ok'                  // buttonName
        );
	}
	
}

function errorDB(err)
{
    alert("Error processing SQL: "+err.code+ " - "+err.message);
}

function getJsonDB(tx)
{
	tx.executeSql('CREATE TABLE IF NOT EXISTS JSON (id unique, json)');
	tx.executeSql('SELECT * FROM JSON', [], processJsonDB, errorDB);
}

function saveJsonDB(tx)
{
	tx.executeSql('DROP TABLE IF EXISTS JSON');
	tx.executeSql('CREATE TABLE IF NOT EXISTS JSON (id unique, json)');
    tx.executeSql('INSERT INTO JSON (id, json) VALUES (1, ?)', [JSON.stringify(jsonContent)]);
}

function getJsonFromWeb()
{
	$.mobile.loading( 'show');
	var networkState = navigator.connection.type;
	if(networkState != Connection.NONE) // theres any type of connection
	{
		//alert("hi ha connexio");
		$.ajax
		({
	        type: "GET",
			dataType: 'jsonp',
			data: {json:1,count:100},
			url: "http://www.albertcasadessus.com/",
			cache: false,
			timeout : 7000,
			beforeSend: function()
			{
				
			},
			success: function(json)
			{
				updateData(json);
			},
			error: function(xhr, testStatus, error)
			{
				showErrors();
			}		
		});
	}
	else
	{
		showErrors();
	}
}

function updateData(json)
{
	$.mobile.loading('hide');
	var qtt = 0;
	if(window.localStorage.getItem("qtt")) qtt = parseInt(window.localStorage.getItem("qtt"));
	var count = parseInt(json.count);
	
	//alert(qtt + " = " + count);
	if(qtt != count) // there are new posts. Update local data and reload page
	{
		jsonContent = json;
		db.transaction(saveJsonDB, errorDB);
		window.localStorage.setItem("qtt",count);
		generatePageFromJson();
	}
	else
	{
		// nothing to do, cause data is up-to-date	
		navigator.notification.alert(
            'Posts are up-to-date.',  // message
            alertDismissed,         // callback
            'Up-to-date',            // title
            'Ok'                  // buttonName
        );
	}
}

function generatePageFromJson()
{
	var json = jsonContent;
	var posts = json.posts;
	$('#llistatPosts').empty();
	$.each(posts, function(i, obj)
	{
		var categories = "";
		$.each(obj.categories, function(i, cat)
		{
			if(categories != "") categories = categories + ", " + cat.title;
			else categories = cat.title;
		});
		var datep = obj.date;
		/*var d = new Date(datep);
		if (d) { // check for invalid date
		  datep = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
		} */
		$('#llistatPosts').append('<li><a href="#' + obj.slug + '"><h3>' + obj.title + '</h3><p>Date: ' + datep + '. Categories: ' + categories + '</p></a></li>');
	
		$('body').append('<div data-role="page" id="' + obj.slug + '"><div data-role="header"><h1>' + obj.title + '</h1></div><div data-role="content"><b>Title:</b> ' + obj.title + '<br><b>Date:</b> ' + datep + '<br><b>Categories:</b> ' + categories + '<br><br>' + obj.content + '</div><div data-role="footer"><h4>' + categories + '</h4></div></div>');

	});
	$("#llistatPosts").listview("refresh");
	$.mobile.loading( 'hide');
	$.mobile.changePage("#indexpage");
}

function showErrors()
{
	var qtt = 0;
	if(window.localStorage.getItem("qtt")) qtt = parseInt(window.localStorage.getItem("qtt"));
	if(qtt == 0)
	{
		navigator.notification.alert(
            'Requested feeds could not be loaded.',  // message
            alertDismissed,         // callback
            'Connection error',            // title
            'Ok'                  // buttonName
        );

	}
	$.mobile.loading('hide');
}

function alertDismissed()
{
	//foo
}