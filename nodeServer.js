const http = require('http');
const WebSocket = require('websocket');
const request = require('request');
const querystring = require('querystring');

const hostname = '127.0.0.1';
const port = 3000;

var clientID = 1;

var clients = [];

//peterParker@gmail.com
//PETERparker1234!@#$

//koos@gmail.com
//KOOSkoek1234!@#$

//peterParker@gmail.com
//PETERparker1234!@#$


const httpServer = http.createServer(function(req,res){
	res.statusCode = 200;
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader('Content-Type','application/json');
	
	var result = 'OK';
	
	if(req.method == 'POST')
	{
		let body = '';
		req.on('data', function(chunk){
			body += chunk.toString(); // convert Buffer to string
		});
		req.on('end', function(){
			body = querystring.parse(body);
			var postParms = structurePOST(body);
			postParms = serialize(postParms);
			console.log('POST request!');
			request.post(
				'https://u18171185:Philstembul108102@wheatley.cs.up.ac.za/u18171185/api.php',
				{ json: postParms },
				function (error, response, body) {
					if (!error && response.statusCode == 200) {
						console.log(body);
						result = JSON.stringify(body);
						
						//console.log('Result:');
						//console.log(result);
						console.log('Result:');
						console.log(result);

						res.end(result);
					}
				}
			);
		});
	}else{
		res.end('NODE JS SEVER!');
	}
}).listen(port, function(){
	console.log('Server running at http://'+hostname+':'+port+'/');
});

const wsServer = new WebSocket.server({
	httpServer: httpServer,
    autoAcceptConnections: false		//always false - varify origin
});

wsServer.on('request', function(webSocketRequest) {
	console.log("Request Received!");
	
	webSocketRequest.on('requestAccepted',function(webSocketConnection){
		console.log("Client Connected!");
		webSocketConnection.on (  "message", function (message){
			console.log("message : " + message.utf8Data);
			var msg = JSON.parse(message.utf8Data);	
			if(typeof msg.command !== 'undefined'){
				var command = msg.command;
				
				if(command == "QUIT"){
					//notify all connection that server is going off-line
					//then close all connections
					for(var i = 0; i < clients.length;i++){
						var obj = {'QUIT':true,'Message':'The Serve will go Offline now.'};
						clients[i].Connection.send(JSON.stringify(obj));
						clients[i].Connection.close();
					}
					httpServer.close();
				}
				else if(command == "KILL"){
					//close a connection based on an ID
					if(typeof msg.ID !== 'undefined'){
						for(var i = clients.length-1; i >= 0; i--){
							//console.log(i);
							if(typeof clients[i] !== 'undefined' && clients[i].ID == msg.ID){
								var c = clients[i];
								clients.splice(i,1);
								c.Connection.close();
								console.log('Connection closed with ID: '+msg.ID);
							}
						}
					}
					else{
						console.log('Cannot execute KILL command without a provided ID..');
					}						
				}
				else if(command == "LIST"){
					//list all connections
					console.log('Listing Clients:');
					console.log(listClients());
				}
				else if(command == "SETUP"){
					//Setup connection
					if(typeof msg.ID !== 'undefined'){
						for(var i = 0; i < clients.length; i++){
							if(typeof clients[i] !== 'undefined' && clients[i].ID == msg.ID){
								setupClient(clients[i],msg.APIKEY);
								console.log('Connection Setup with ID: '+msg.ID);
							}
						}
					}
					else{
						console.log('Cannot execute SETUP command without a provided ID..');
					}			
				}
				else if(command == "UPDATE"){
					//Setup connection
					if(typeof msg.ID !== 'undefined'){
						for(var i = 0; i < clients.length; i++){
							//console.log(i);
							if(typeof clients[i] !== 'undefined' && clients[i].ID == msg.ID){
								updateTime(clients[i],msg.time)
								console.log('Connection Updated with ID: '+msg.ID);
							}
						}
					}
					else{
						console.log('Cannot execute UPDATE command without a provided ID..');
					}		
				
				
			}
				else{
					console.log("Message does not have a command!");
				}
			}
		});
		var client = {
			ID : clientID++,
			apikey : '',
			Connection : webSocketConnection,
			time : 0
		};
		clients.push(client);
		webSocketConnection.send(JSON.stringify({ID:client.ID}));
	});
	webSocketRequest.accept(null, webSocketRequest.origin);
});

wsServer.on ("connection", function (webSocketConnection){
	console.log("connection");
});

wsServer.on ("close", function(webSocketConnection, closeReason, description){
	console.log("Connection Closed:    " + description);
});


var structurePOST = function(obj){	
	//peterParker@gmail.com
	//PETERparker1234!@#$
	
	//obj.email = 'peterParker@gmail.com';
	//obj.password = 'PETERparker1234!@#$';
	
	var parms = {
		dummy1: 'AA',
		type : 'login',
		email : obj.email,
		password : obj.password,
		return : ['key','email'],
		dummy2 : 'BB'
	};
	return parms;
}
var serialize = function( obj ){
	var series = querystring.stringify(obj);
	var series = series.replace(/return/gi, 'return%5B%5D');
	return series;
}
var listClients = function(){
	var out = '';
	for(var i = 0; i < clients.length;i++){
		out = out + 'client['+i+']: [ '+ clients[i].ID +' , '+ clients[i].apikey +' ]\n'; 
	}
	
	return out;
}

var setupClient = function(client, apiKey){
	//if(typeof client !== 'undefined' && typeof APIKEY !== 'undefined' )
	//{
		client.apikey = apiKey;	
		var postParms = {
			dummy1 : 'AA',
			type : 'trakt',
			method : 'retrieve',
			key : apiKey,
			videoSource : 'sampleVideoSource',
			return : ['key','videoSource','time'],
			dummy2 : 'BB'
		};
		
		postParms = serialize(postParms);
		console.log('POST SETUP request!');
		request.post(
			'https://u18171185:Philstembul108102@wheatley.cs.up.ac.za/u18171185/api.php',
			{ json: postParms },
			function (error, response, body) {
				if (!error && response.statusCode == 200) {
					//body = JSON.parse(body);
					console.log(body);
					if(body.status == 'success'){
						var obj = {time: body.data.time};
						client.Connection.send(JSON.stringify(obj));
					}
				}
			}
		);
		
	//}
}

var updateTime = function(client,Time){
	
	if(client.time == Time){
		return;
	}
	
	client.time = Time;
	
		var postParms = {
			dummy1 : 'AA',
			type : 'trakt',
			method : 'update',
			key : client.apikey,
			time : Time,
			videoSource : 'sampleVideoSource',
			return : ['key','videoSource','videoName','time'],
			dummy2 : 'BB'
		};
		
		postParms = serialize(postParms);
		
		console.log('POST UPDATE request!');
		
		request.post(
			'https://u18171185:Philstembul108102@wheatley.cs.up.ac.za/u18171185/api.php',
			{ json: postParms },
			function (error, response, body) {
				if (!error && response.statusCode == 200) {
					console.log(body);
					if(body.status == 'success'){
						//var obj = {time: body.data.time};
						//client.Connection.send(JSON.stringify(obj));
					}
				}
			}
		);
}








