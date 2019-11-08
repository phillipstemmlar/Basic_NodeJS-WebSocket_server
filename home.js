var socket = null;
var UPDATE = null;

var ID = -1;
var apikey = '';

const updateWait = 2000;	//ms

var onBodyLoad = function()
{
	var div = document.createElement('div');
	div.id = 'loginPanel';
	div.innerHTML = generateLoginHTML();	
	document.body.appendChild(div);
}

var videoProgress = function()
{
	var video = document.getElementsByTagName('video')[0];
	var p = document.getElementsByTagName('p')[0];
	
	p.innerHTML = "time: " + video.currentTime;
}

var skipTo = function(seconds)
{
	document.getElementsByTagName('video')[0].currentTime = seconds;
	document.getElementsByTagName('video')[0].play();
}

var updateTime = function()
{
	console.log('UPDATE Time!');
	var vidtime = document.getElementsByTagName('video')[0].currentTime;
	var obj = {'command' : 'UPDATE',
			   'ID':ID,
			   'time' : vidtime};
	socket.send(JSON.stringify(obj));
}

var LIST = function()
{
	send('LIST');
}

var login = function()
{
	var email = document.getElementById("txtEmail").value;
	var pass = document.getElementById("txtPass").value;
	
	if(!validateEmail(email))
	{
		console.log("Email is not valid.");
		return;
	}
	
	if(!validatePassword(pass))
	{
		console.log("Password is not valid.");
		return;
	}
	
	var req = new XMLHttpRequest();
	
	req.onreadystatechange = function()
	{
		if(req.readyState == 4 && req.status == 200)
	   	{
			var res = JSON.parse(req.responseText);
			
			console.log(res);
			
			if(res.status == 'success')
			{
				notify('Logged in as: ' + res.data.email);
				
				console.log("LOGGING IN");
				
				apikey = res.data.key;
				
				establishSocket(3000);
					
				var log = document.getElementById('loginPanel');
				var div = document.createElement('div');
				div.id = 'videoPanel';
				div.innerHTML = generateVideoHTML();	
				document.body.replaceChild(div,log);		
			}
		}
	}
	
	req.open('POST','http://127.0.0.1:3000',true);
	req.send('email='+email+'&password='+pass);
}

var logout = function()
{
	closeSocket();
}

var generateVideoHTML = function()
{
	return '<div id="loginPanel"><input id="btnSubmit" type="button" '
	+'			   value="Log Out" onclick="logout()"/>'
	+'		</div><br/>'
	+'		<video onprogress="" controls>'
	+'			<source src="sample.mp4" type="video/mp4">'
	+'			<source src="sample.ogg" type="video/ogg">'
	+'			Your browser does not support the video tag.'
	+'		</video>';
}

var generateLoginHTML = function()
{
	return '<div id="loginPanel">'
	+'	<input id="txtEmail" type="email" placeholder="Email . . ."/><br/>'
	+'	<input id="txtPass" type="password" placeholder="Password . . ."/><br/>'
	+'	<input id="btnSubmit" type="button" '
	+'		   value="Log In" onclick="login()"/>'
	+'</div>';
}

var destroyVideo = function()
{
	var log = document.getElementById('videoPanel');
	var div = document.createElement('div');
	div.id = 'loginPanel';
	div.innerHTML = generateLoginHTML();	
	document.body.replaceChild(div,log);
}

var establishSocket = function(port)
{
	var url = "ws://127.0.0.1:"+port;
	
	console.log("connecting to: " + url);
	
	socket = new WebSocket(url);
	
	socket.onmessage = function(event)
	{
		//var json = JSON.parse(event.data);
		//var res = json.message;
		var res = event.data;
		console.log('SOCKET MSG: ');
		console.log(res);
		
		var obj = JSON.parse(res);
		
		if(typeof obj.ID !== 'undefined'){
			ID = obj.ID;
			console.log('Setting ID.');
			socket.send(JSON.stringify({
				'command' : 'SETUP',
				'ID' : ID,
				'APIKEY' : apikey 
			}));
		}
		
		if(typeof obj.time !== 'undefined'){
			skipTo(obj.time);
		}
		
		if(obj.QUIT == true){
			console.log(obj.Message);
			//logout();
		}
	}
	
	socket.onopen = function(event){
		notifyADD('Connected to the Server!');
		console.log("SOCKET CONNECTED!");
		UPDATE = setInterval(updateTime,updateWait);
	}
	socket.onclose = function(event){
		notify('Disconnected from the Server!');
		console.log("SOCKET DISCONNECTED!");
		destroyVideo();
		clearInterval(UPDATE);
	}
}

var send = function(cmd)
{
	var obj = {'command' : cmd};
	socket.send(JSON.stringify(obj));
}

var closeSocket = function()
{
	if(typeof document.cookie)
	{
		socket.close();
	}else{
		var obj = {'command' : 'KILL',
				'ID' : ID
			  };
		socket.send(JSON.stringify(obj));
	}
}

function validateEmail(email) {
    var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(String(email).toLowerCase());
}
function validatePassword(password) {
	var regex = /^((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*]))(?=.{8,})/;
	return regex.test(String(password));
}
function validateName(name) {
	var regex = /^((?=.*[a-z])|(?=.*[A-Z]))(?=.{2,})/;
	return regex.test(String(name));
}

function setCookie(name,value,days=7) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
function eraseCookie(name) {   
    document.cookie = name+'=; Max-Age=-99999999;';  
}

var notify = function(str){
	document.getElementById('Notify').innerHTML = str;
}
var notifyADD = function(str){
	var prev = document.getElementById('Notify').innerHTML;
	str = '<br/>' + str;
	document.getElementById('Notify').innerHTML = prev + str;
}











