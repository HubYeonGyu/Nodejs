var http = require('http');
var fs = require('fs');
var url = require('url');       //소스 삽입, 기존 url을 _url로 변경
var qs = require('querystring'); // parse 메소드를 이용해 url쿼리 스트링을 해석하고 포멧팅 할 수 있다.

function templateHTML(title, list, body, control){    //변수 title, list, body, control를 받는 templateHTML라는 함수 생성
  return `                                           //8~20 return
  <!doctype html>
  <html>
  <head>
    <title>WEB1 - ${title}</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1><a href="/">WEB</a></h1>
    ${list}
    ${control}
    ${body}
  </body>
  </html>
  `;
}
function templateList(filelist){  //filelist는 데이터 디렉토리 파일의 리스트인데 templateList에 입력값으로 주면 filelist의 값을 받아서 list정보(24~30)를 만든다. 
  var list = '<ul>';
  var i = 0;
  while(i < filelist.length){
    list = list + `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
    i = i + 1;
  }
  list = list+'</ul>';
  return list;                             //만들어진 list를 return한다.
}

var app = http.createServer(function(request,response){   //34~83 위 6번째 줄에 추가된 control 매개변수로 목적에 맞게 링크를 출력
                                                          //templateHTML 함수를 호출하는 곳에 control 매개변수로 전달할 링크를 보여주는 HTML 코드를 전달한다.
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    if(pathname === '/'){
      if(queryData.id === undefined){
        fs.readdir('./data', function(error, filelist){
          var title = 'Welcome';
          var description = 'Hello, Node.js';
          var list = templateList(filelist);
          var template = templateHTML(title, list,
            `<h2>${title}</h2>${description}`,
            `<a href="/create">create</a>`
          );
          response.writeHead(200);
          response.end(template);
        });
      } else {
        fs.readdir('./data', function(error, filelist){
          fs.readFile(`data/${queryData.id}`, 'utf8', function(err, description){
            var title = queryData.id;
            var list = templateList(filelist);
            var template = templateHTML(title, list,
              `<h2>${title}</h2>${description}`,
              `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
            );
            response.writeHead(200);
            response.end(template);
          });
        });
      }
    } else if(pathname === '/create'){
      fs.readdir('./data', function(error, filelist){
        var title = 'WEB - create';
        var list = templateList(filelist);
        var template = templateHTML(title, list, `
          <form action="/create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
        `, '');
        response.writeHead(200);
        response.end(template);
      });
    } else if(pathname === '/create_process'){      //84~92 POST 방식으로 전달받은 정보를 출력하고 파일 형태로 저장하기 위한 writeFile()함수 선언
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var title = post.title;
          var description = post.description;
          fs.writeFile(`data/${title}`, description, 'utf8', function(err){ //93~95 파일 쓰기를 마치면 페이지를 리다이렉션 해준다. (리다이렉션은 페이지를 이동시키는 기능이다.)
            response.writeHead(302, {Location: `/?id=${title}`});
            response.end();
          })
      });
    } else if(pathname === '/update'){                        //98~121 경로가 update일 때 처리하는 else if문을 추가하고 글 내용을 수정하는 form 제공
      fs.readdir('./data', function(error, filelist){
        fs.readFile(`data/${queryData.id}`, 'utf8', function(err, description){
          var title = queryData.id;
          var list = templateList(filelist);
          var template = templateHTML(title, list,             //103~107 바뀌기 전 title값을 hidden 타입의 <input> 태그에 
            `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${title}">
              <p><input type="text" name="title" placeholder="title" value="${title}"></p>
              <p>
                <textarea name="description" placeholder="description">${description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
            `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
          );
          response.writeHead(200);
          response.end(template);
        });
      });
    } else {
      response.writeHead(404);
      response.end('Not found');
    }
});
app.listen(3000);     //포트 번호(localhost:3000)을 입력하면 동작을 확인할 수 있다.
