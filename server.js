var express = require('express');
var neuralNetwork = require('./neuralNetwork');
var app = express();
var nn = new neuralNetwork();
var bodyParser = require('body-parser');

app.use(bodyParser.json());
 
app.use(express.static(__dirname));

app.post('/predict',function(req,res){
	var data = req.body;
	var result = nn.predict(data.predict,data.actual);
	setResponse(res,result);
});
function setResponse(res,data){
	res.writeHead(200, {"Content-Type": "application/json"});
    var output = { };
    res.end(JSON.stringify(data) + "\n");
}
app.listen(process.env.PORT || 8082);