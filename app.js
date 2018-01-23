const express = require('express')
const app = express()
const cron = require('node-cron')
const uuid = require('node-uuid');
const Jimp = require('jimp')
const port = 3000
const fs = require('fs')
const screenshot = require('screenshot-stream');
const nano = require('nano')("http://localhost:5984")
const db = nano.db.use('thesis_db')
const axios = require('axios')

var streamToBuffer = require('stream-to-buffer')



let apiKey = '743f0e1c11c2c12de795aef08b2f66c9'
let city = 'Bucharest'
let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`


app.get('/', (request, response) => {
  response.send('Hello from Express!')
})

app.get('/pic/:id', function(req, res, next) {

	db.attachment.get(req.params.id, 'sasa', function(err, body) {
		res.writeHead(200, {
        "Content-Disposition": "attachment;filename=image.png",
        'Content-Type': 'image/png',
      	});
    	res.end(body,'binary');
	});
});


app.listen(port, (err) => {
  if (err) {
    return console.log('Error: ', err)
  }

  console.log(`server is listening on ${port}`)
})

/*Jobs*/
cron.schedule('0 0 */1 * * *', takeScreenshot);
cron.schedule('0 0 */1 * * *', saveWeather);
cron.schedule('0 0 */1 * * *', getAQI);


//TODO -> save response in DB
function saveWeather() {
  console.log("Weather job is running");
  axios.get(url)
  .then(function(response) {
    console.log(response.data);
  });
}


//TODO -> save response in DB
function getAQI() {
  console.log("AQI job is running every hour");

  axios.get('https://api.waqi.info/mapq/bounds/?bounds=44.32704096469108,25.877952575683594,44.47911556412261,26.365127563476562&inc=placeholders&k=_2Y2EzVh5mHREfMwUJSyJWXmldXkE9LTsUFHgZLw==&_=1515062406474')
   .then(function(response) {
     console.log(response.data);
  });


}



function takeScreenshot() {

	console.log('Cron job is running');

	const options = {delay:30}

	const imageName = 'traffic_bucharest_' + new Date().getTime() + '.png';

	const stream = screenshot('https://www.google.ro/maps/@44.4316484,26.0838023,13z/data=!5m1!1e1?dcr=0', '1600x900', options);
	streamToBuffer(stream, function (err, buffer) {
		db.multipart.insert({ type: 'traffic_map', city: 'Bucharest', processed : false }, [{name: "map", data: buffer, content_type: 'image/png'}],uuid.v1(),function(err, body) {
       		if (!err)
          		console.log(body);
          	else console.log("err" + err)

          	/*Move this*/	
      		Jimp.read(imageName, function (err, image) {
				if (!err) {
					var alert = 0;
		    		var normal = 0;
		    		for (i = 0 ; i < image.bitmap.data.length; i = i + 4) {
		    			var r = image.bitmap.data[i];
		    			var g = image.bitmap.data[i + 1];
		    			var b = image.bitmap.data[i + 2];
		    			if ( r == 242 && g == 60 && b == 50) alert = alert + 1;
		    			else if ( r == 99 && g == 214 && b == 104) normal = normal + 1
		    		}
			    	console.log("alert " + alert);
		    		console.log("normal " + normal);
				} else {
					console.log("Error" + err)
				}
			});
    	});
	})



	/*attention.on('finish', function () {
		console.log("ahuuuueee")

		Jimp.read(imageName, function (err, image) {
			if (!err) {
				var alert = 0;
	    		var normal = 0;
	    		for (i = 0 ; i < image.bitmap.data.length; i = i + 4) {
	    			var r = image.bitmap.data[i];
	    			var g = image.bitmap.data[i + 1];
	    			var b = image.bitmap.data[i + 2];
	    			if ( r == 242 && g == 60 && b == 50) alert = alert + 1;
	    			else if ( r == 99 && g == 214 && b == 104) normal = normal + 1
	    		}
		    	console.log("alert " + alert);
	    		console.log("normal " + normal);
			} else {
				console.log("Error" + error)
			}



		});*/

}
