var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');

function templateHTML(title, list, body, control){
  return `
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
function templateList(filelist){
  var list = '<ul>';
  var i = 0;
  while(i < filelist.length){
    list = list + `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
    i = i + 1;
  }
  list = list+'</ul>';
  return list;
}

var app = http.createServer(function(request,response){
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
              `<a href="/create">create</a>               //58~98 글삭제(delete) 버튼 구현
               <a href="/update?id=${title}">update</a>
              <form action="delete_process" method="post">   //글 목록 중 하나를 선택했을 때 delete 버튼 표시, 
                                                             //form 버튼을 이용해 POST 방식으로 처리하고 delete 버튼을 눌렀을 때 delete_process가 삭제 요청을 함
              <input type="hidden" name="id" value="${title}">
              <input type="submit" value="delete">
              </form>`
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
    } else if(pathname === '/create_process'){
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var title = post.title;
          var description = post.description;
          fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            response.writeHead(302, {Location: `/?id=${title}`});
            response.end();
          })
      });
    } else if(pathname === '/update'){
      fs.readdir('./data', function(error, filelist){
        fs.readFile(`data/${queryData.id}`, 'utf8', function(err, description){
          var title = queryData.id;
          var list = templateList(filelist);
          var template = templateHTML(title, list,
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
    } else if(pathname === '/update_process'){                                    //126~142 update_process를 받을 수 있는 코드
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var id = post.id;
          var title = post.title;
          var description = post.description;
          fs.rename(`data/${id}`, `data/${title}`, function(error){                //rename 기능을 이용하여 파일 이름 변경 시키는 코드
            fs.writeFile(`data/${title}`, description, 'utf8', function(err){      //137~139 fs.rename 블록 안에서 내용을 수정하는 처리 구현 
              response.writeHead(302, {Location: `/?id=${title}`});
              response.end();
            })
          });
      });
    } else if(pathname === '/delete_process'){  //144~156 글 삭제 기능 코드
        var body = '';
        request.on('data', function(data){
            body = body + data;
        });
        request.on('end', function(){
            var post = qs.parse(body);
            var id = post.id;
            fs.unlink(`data/${id}`, function(error){  //152~155 unlink 함수 기능으로 글 삭제 요청을 처리하는 코드
              response.writeHead(302, {Location:'/'}); //id값을 이용해 삭제할 파일 경로를 전달하고, 콜백 함수에 파일 삭제 완료 후 처리할 내용을 작성.
                                                       //삭제가 끝난 다음 사용자를 홈으로 보내기 위해 302 상태 코드에 Location을 `/`로 지정
              response.end();
            })
          });
    } else {
      response.writeHead(404);
      response.end('Not found');
    }
});
app.listen(3000);
