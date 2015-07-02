var fs = require('fs');

function neuralNetwork(_config){
	var config = _config ? _config : {};
	var theta1; // 25 x 1601
	var theta2; // 10 x 26
	var input_layer_size  = config.input_layer_size ? config.input_layer_size : 1600;  // 40x40 Input Images of Digits
	var hidden_layer_size = config.hidden_layer_size ? config.hidden_layer_size : 25;   // 25 hidden units
	var num_labels = config.num_labels ? config.num_labels : 3;          // 10 labels, from 1 to 10
	var e = config.e ? config.e : 0.12;
	var learningRate = config.learningRate ? config.learningRate : 0.3;
	var saveThetas = config.saveThetas != undefined ? config.saveThetas : true;
	
	function initialise(){
		theta1 = new Array(hidden_layer_size);
		theta2 = new Array(num_labels);
		for(var i=0;i<theta1.length;i++){
			theta1[i]=[];
			for(var j=0;j<=input_layer_size;j++){
				theta1[i].push(Math.random() * 2 * e - e);
			}
		}
		for(var i=0;i<theta2.length;i++){
			theta2[i]=[];
			for(var j=0;j<=hidden_layer_size;j++){
				theta2[i].push(Math.random() * 2 * e - e);
			}
		}
		if(persistThetas){
			loadThetas();
		}
	}
	
	function predict(_data,actual){
		var a1 = _data; 
		a1.unshift(1); //1601 x 1
		var z2=[]; // 25 x 1
		for(var i=0;i<theta1.length;i++){
			var value=0;
			for(var j=0;j<a1.length;j++){
				value = value + a1[j] * theta1[i][j];
			}
			z2.push(sigmoid(value)); 
		}
		var a2=z2.slice(0); // 10 x 1
		a2.unshift(1);
		var z3=[];
		// z3 26 x 1
		for(var i=0;i<theta2.length;i++){
			var value=0;
			for(var j=0;j<a2.length;j++){
				value = value + a2[j] * theta2[i][j];
			}
			z3.push(sigmoid(value));
		}
		var result=0;
		var guess;
		for(var i in z3){
			if(z3[i]>result){
				result=z3[i];
				guess=i;
			}
		}
		if(actual != undefined){
			y = actual;
			learn(_data,z3,y,z2,z3,a1,a2);
		}
		if(persistThetas){	
			saveThetas();
		}
		return z3;
	}
	function learn(input,output,actual,z2/*25x1*/,z3/*10x1*/,a1/*1601x1*/,a2/*11x1*/){
		var delta3=new Array(num_labels); // 10 x 1
		for(var i=0;i<delta3.length;i++){
			delta3[i]=output[i]-actual[i];
		}
		var delta2_1=[];
		for(var j=1;j<hidden_layer_size+1;j++){
			var value = 0;
			for(var k=0;k<delta3.length;k++){
				value = value + theta2[k][j] * delta3[k];
			}
			delta2_1.push(value);
		}
		var grad = sigmoidGradient(z2);
		var delta2=[];
		for(var i=0;i<grad.length;i++){
			delta2.push(grad[i]*delta2_1[i]);
		}
		var Delta2=[];
		for(var i=0;i<delta3.length;i++){
			var row = [];
			for(var j=0;j<a2.length;j++){
				row.push(delta3[i]*a2[j]);
			}
			Delta2.push(row);
		}
		var Delta1=[];
		for(var i=0;i<delta2.length;i++){
			var row = [];
			for(var j=0;j<a1.length;j++){
				row.push(delta2[i]*a1[j]);
			}
			Delta1.push(row);
		}
		
		for(var i=0;i<theta1.length;i++){
			for(var j=0;j<theta1[i].length;j++){
				theta1[i][j]-=(Delta1[i][j]*learningRate);
			}
		}
		for(var i=0;i<theta2.length;i++){
			for(var j=0;j<theta2[i].length;j++){
				theta2[i][j]-=(Delta2[i][j]*learningRate);
			}
		}
		persistThetas();
	}
	function sigmoidGradient(_z){
		var z = _z.slice(0);;
		for(var i=0;i<z.length;i++){
			z[i] = z[i]*(1-z[i]);
		}
		return z;
	}
	function sigmoid(num){
		return  1 / (1 + Math.exp(-num));
	}
	function loadThetas(){
		fs.readFile('thetas.json', 'utf8', function (err, data) {
		  if (!err){
			obj = JSON.parse(data);
			if(obj.theta1) theta1 = object.theta1;
			if(obj.theta2) theta1 = object.theta2;
		  }
		});
	}
	function persistThetas(){
		if(!saveThetas) return;
		var obj={};
		obj.theta1 = theta1;
		obj.theta2 = theta2;
		fs.writeFile('thetas.json', JSON.stringify(obj), function (err,data) {
		  if (err) {
			return console.log(err);
		  }
		});

	}
	initialise();
	
	return{
		predict:predict
	}
}
module.exports = neuralNetwork;