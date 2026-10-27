import http from 'http';
const data = JSON.stringify({url:'https://www.instagram.com/reels/DQbHMuLEtmt/'});
const req = http.request({hostname:'localhost',port:3000,path:'/api/get-video',method:'POST',headers:{'Content-Type':'application/json'}},res=>{
  let d='';res.on('data',c=>d+=c);res.on('end',()=>{console.log(res.statusCode+':'+d);});
});
req.on('error',e=>{console.error('err');});
req.write(data);req.end();
