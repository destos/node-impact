var fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    step = require('step');
    
exports.listen = function(server, options) {
  var options = options || {};
  var root = options.root || __dirname;
  
  server.get('/wm/glob', function(req, res){
    var searchArray = req.param('glob')
    step(function(){
      var stepThis = this
      searchArray.forEach( function(search) {
        glob( search, {
          cwd: root
        }, stepThis.parallel());
      });
    },function(err,matches){
      if(err){
        res.send({ error: 1, msg: err });
      }else{
        res.send(matches);
      }
    });
  });

  server.post('/wm/save', function(req, res){
    
    //TODO: Check to make sure bodyparser is on
    
    var savePath = req.body.path,
        data = req.body.data;
    if (savePath && data) {
      if (/\.js$/.test(savePath)) {
        fs.writeFile( path.resolve( root, savePath ), data, function(err){
          if (err) {
            res.send({ error: 2, msg: 'Couldn\'t write to file: '+ savePath });
          } else {
            res.send({ error: 0, msg:''});
          }
        });
      } else {
        res.send({ error: 3, msg: 'File must have a .js suffix' });
      }
    } else {
      res.send({ error: 1, msg: 'No Data or Path specified' });
    }
  });

  server.get('/wm/browse', function(req, res){
    
    var dir = req.param('dir') || '',
        type = req.param('type'),
        types = { scripts: ['.js'], images: ['.png', '.gif', '.jpg', '.jpeg'] },
        result = { parent: false, dirs: [], files: [] };
        
    var filter = (type && types[type]) ? types[type] : false;
    
    result.parent = req.param('dir') ? dir.substring(0, dir.lastIndexOf('/')) : false;
    
    if (dir[dir.length-1] === '/')
      dir = dir.substring(0, dir.length-1);
    
    var dirpath = path.resolve(root, dir);
    
    fs.readdir(dirpath, function(err, files){
      if(err){
        console.error(err);
      }else{      
        for (var i in files) {
          filePath = path.resolve(dirpath,files[i]).replace( root+'/' ,'');
          
          stats = fs.statSync( path.resolve( dirpath, files[i] ) );
          if (stats.isDirectory()) {
            result.dirs.push(filePath);
          } else if (stats.isFile()) {
            if (filter) {
              if (filter.indexOf(path.extname(files[i])) >= 0) {
                result.files.push(filePath);
              }
            } else {
              result.files.push(filePath);
            }
          }
        }
      }
      res.send(result);
    });
  });
  
  return {
    root: root
  };
};